import type { Message, ModelProvider, Tool } from "./types";

export type AgentEvent =
  | { type: "user"; text: string }
  | { type: "assistant_delta"; text: string }
  | { type: "assistant"; text: string }
  | { type: "tool_call"; name: string; arguments: unknown }
  | { type: "tool_result"; name: string; result: string }
  | { type: "tool_error"; name: string; error: string };

export class AgentSession {
  private readonly messages: Message[] = [];

  constructor(
    private readonly options: {
      model: string;
      instructions: string;
      provider: ModelProvider;
      tools: Tool<unknown>[];
      workspaceDir: string;
      maxTurns: number;
    },
  ) {}

  reset(): void {
    this.messages.length = 0;
  }

  async ask(text: string, emit: (event: AgentEvent) => void): Promise<void> {
    this.messages.push({ role: "user", content: text });
    emit({ type: "user", text });

    for (let turn = 0; turn < this.options.maxTurns; turn += 1) {
      const steps = await this.options.provider.run({
        model: this.options.model,
        instructions: this.options.instructions,
        messages: this.messages,
        tools: this.options.tools,
        onTextDelta: (delta) => emit({ type: "assistant_delta", text: delta }),
      });

      const final = steps.find((step) => step.type === "final");
      if (final?.type === "final") {
        this.messages.push({ role: "assistant", content: final.text });
        emit({ type: "assistant", text: final.text });
        return;
      }

      for (const step of steps) {
        if (step.type !== "tool_call") continue;

        emit({ type: "tool_call", name: step.name, arguments: step.arguments });
        this.messages.push({ role: "assistant", content: `Tool call: ${step.name}`, item: step.item });

        const tool = this.options.tools.find((candidate) => candidate.name === step.name);
        if (!tool) {
          await this.pushToolError(step.callId, step.name, `Unknown tool: ${step.name}`, emit);
          continue;
        }

        try {
          const result = await tool.execute(tool.schema.parse(step.arguments), { workspaceDir: this.options.workspaceDir });
          this.messages.push({
            role: "tool",
            content: result,
            item: { type: "function_call_output", call_id: step.callId, output: result },
          });
          emit({ type: "tool_result", name: step.name, result });
        } catch (error) {
          await this.pushToolError(step.callId, step.name, error instanceof Error ? error.message : String(error), emit);
        }
      }
    }

    emit({ type: "assistant", text: `Stopped after ${this.options.maxTurns} turns.` });
  }

  private async pushToolError(
    callId: string,
    name: string,
    error: string,
    emit: (event: AgentEvent) => void,
  ): Promise<void> {
    this.messages.push({
      role: "tool",
      content: error,
      item: { type: "function_call_output", call_id: callId, output: error },
    });
    emit({ type: "tool_error", name, error });
  }
}
