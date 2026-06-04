import type { AgentMessage, ModelProvider, Tool, ToolContext } from "./types";

export type AgentEvent =
  | { type: "user"; text: string }
  | { type: "status"; text: string }
  | { type: "tool_call"; callId: string; name: string; arguments: unknown }
  | { type: "tool_result"; callId: string; name: string; result: string }
  | { type: "tool_error"; callId: string; name: string; error: string }
  | { type: "assistant_delta"; text: string }
  | { type: "assistant"; text: string };

export type AgentSessionOptions = {
  model: string;
  instructions: string;
  provider: ModelProvider;
  tools: Tool<unknown>[];
  toolContext: ToolContext;
  maxTurns?: number;
};

export class AgentSession {
  private messages: AgentMessage[] = [];
  private readonly maxTurns: number;

  constructor(private readonly options: AgentSessionOptions) {
    this.maxTurns = options.maxTurns ?? 8;
  }

  reset(): void {
    this.messages = [];
  }

  get transcript(): AgentMessage[] {
    return [...this.messages];
  }

  async ask(input: string, emit: (event: AgentEvent) => void): Promise<string> {
    this.messages.push({ role: "user", content: input });
    emit({ type: "user", text: input });

    for (let turn = 0; turn < this.maxTurns; turn += 1) {
      emit({ type: "status", text: `thinking turn ${turn + 1}/${this.maxTurns}` });
      let streamedText = "";
      const steps = await this.options.provider.run({
        model: this.options.model,
        instructions: this.options.instructions,
        messages: this.messages,
        tools: this.options.tools,
        onTextDelta: (delta) => {
          streamedText += delta;
          emit({ type: "assistant_delta", text: streamedText });
        },
      });

      const final = steps.find((step) => step.type === "final");
      if (final?.type === "final") {
        this.messages.push({ role: "assistant", content: final.text });
        if (streamedText.length === 0) {
          emit({ type: "assistant", text: final.text });
        } else if (streamedText !== final.text) {
          emit({ type: "assistant_delta", text: final.text });
        }
        return final.text;
      }

      for (const step of steps) {
        if (step.type !== "tool_call") continue;

        emit({ type: "tool_call", callId: step.callId, name: step.name, arguments: step.arguments });

        if (step.item) {
          this.messages.push({
            role: "assistant",
            content: `Tool call: ${step.name}(${JSON.stringify(step.arguments)})`,
            item: step.item,
          });
        }

        const tool = this.options.tools.find((candidate) => candidate.name === step.name);
        if (!tool) {
          const output = `Unknown tool: ${step.name}`;
          this.messages.push({
            role: "tool",
            content: JSON.stringify({ callId: step.callId, tool: step.name, error: output }),
            item: { type: "function_call_output", call_id: step.callId, output },
          });
          emit({ type: "tool_error", callId: step.callId, name: step.name, error: output });
          continue;
        }

        try {
          const result = await tool.execute(step.arguments, this.options.toolContext);
          this.messages.push({
            role: "tool",
            content: JSON.stringify({ callId: step.callId, tool: step.name, result }),
            item: { type: "function_call_output", call_id: step.callId, output: result },
          });
          emit({ type: "tool_result", callId: step.callId, name: step.name, result });
        } catch (error) {
          const output = error instanceof Error ? error.message : String(error);
          this.messages.push({
            role: "tool",
            content: JSON.stringify({ callId: step.callId, tool: step.name, error: output }),
            item: { type: "function_call_output", call_id: step.callId, output },
          });
          emit({ type: "tool_error", callId: step.callId, name: step.name, error: output });
        }
      }
    }

    const text = `Stopped after ${this.maxTurns} turns without a final answer.`;
    this.messages.push({ role: "assistant", content: text });
    emit({ type: "assistant", text });
    return text;
  }
}
