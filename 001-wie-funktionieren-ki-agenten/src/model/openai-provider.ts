import OpenAI from "openai";

import type { AgentMessage, ModelInput, ModelProvider, ModelStep, Tool } from "../types";

function toResponseInput(messages: AgentMessage[]): Array<Record<string, unknown>> {
  return messages.map((message) => {
    if (message.item) return sanitizeResponseInputItem(message.item);
    return {
      role: message.role === "tool" ? "user" : message.role,
      content: message.role === "tool" ? `Tool result:\n${message.content}` : message.content,
    };
  });
}

export function sanitizeResponseInputItem(item: Record<string, unknown>): Record<string, unknown> {
  return stripSdkOnlyFields(item) as Record<string, unknown>;
}

function stripSdkOnlyFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripSdkOnlyFields);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const clean: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    if (key === "parsed_arguments" || key === "parsed" || key === "output_parsed") continue;
    clean[key] = stripSdkOnlyFields(nestedValue);
  }
  return clean;
}

function toOpenAiTool(tool: Tool<unknown>): Record<string, unknown> {
  return {
    type: "function",
    name: tool.name,
    description: tool.description,
    parameters: tool.jsonSchema,
    strict: true,
  };
}

function parseToolArguments(rawArguments: unknown): unknown {
  if (typeof rawArguments !== "string") return rawArguments ?? {};

  try {
    return JSON.parse(rawArguments);
  } catch {
    return {};
  }
}

export class OpenAiResponsesProvider implements ModelProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async run(input: ModelInput): Promise<ModelStep[]> {
    let streamedText = "";
    const stream = this.client.responses.stream({
      model: input.model,
      instructions: input.instructions,
      input: toResponseInput(input.messages),
      tools: input.tools.map(toOpenAiTool),
      store: false,
    } as never);

    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        streamedText += event.delta;
        input.onTextDelta?.(event.delta);
      }
    }

    const response = await stream.finalResponse();
    const steps: ModelStep[] = [];
    for (const item of response.output as unknown as Array<Record<string, unknown>>) {
      if (item.type === "function_call") {
        const cleanItem = sanitizeResponseInputItem(item);
        steps.push({
          type: "tool_call",
          callId: String(item.call_id),
          name: String(item.name),
          arguments: parseToolArguments(item.arguments),
          item: cleanItem,
          raw: item,
        });
      }
    }

    if (steps.length > 0) return steps;

    return [{ type: "final", text: response.output_text || streamedText || "(no text output)", raw: response }];
  }
}
