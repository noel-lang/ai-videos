import OpenAI from "openai";

import type { Message, ModelInput, ModelProvider, ModelStep, Tool } from "./types";

export class OpenAiProvider implements ModelProvider {
  private readonly client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async run(input: ModelInput): Promise<ModelStep[]> {
    let streamedText = "";
    // Der Provider uebersetzt unsere neutralen Agent-Daten in das OpenAI Responses
    // Format. Die AgentSession muss dadurch keine OpenAI-Details kennen.
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
        // Streaming schickt Zwischenstaende sofort an die UI. Dadurch wirkt der
        // Agent nicht blockierend, obwohl der finale Turn noch laeuft.
        input.onTextDelta?.(streamedText);
      }
    }

    const response = await stream.finalResponse();
    const outputItems = response.output as unknown as Array<Record<string, unknown>>;
    const toolCalls = outputItems.filter((item) => item.type === "function_call");

    if (toolCalls.length > 0) {
      // Wenn das Modell Tools will, geben wir keine finale Antwort zurueck, sondern
      // strukturierte Tool-Schritte, die die AgentSession ausfuehren kann.
      return toolCalls.map((item) => ({
        type: "tool_call",
        callId: String(item.call_id),
        name: String(item.name),
        arguments: parseJson(String(item.arguments ?? "{}")),
        item: sanitizeResponseItem(item),
      }));
    }

    return [{ type: "final", text: response.output_text || streamedText || "(no text output)" }];
  }
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

function toResponseInput(messages: Message[]): Array<Record<string, unknown>> {
  return messages.map((message) => {
    // Bereits vorhandene API-Items werden wieder abgespielt. Das ist noetig,
    // damit OpenAI den Zusammenhang zwischen Tool Call und Tool Output versteht.
    if (message.item) return sanitizeResponseItem(message.item);
    return {
      role: message.role === "tool" ? "user" : message.role,
      content: message.role === "tool" ? `Tool result:\n${message.content}` : message.content,
    };
  });
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export function sanitizeResponseItem(item: Record<string, unknown>): Record<string, unknown> {
  return stripSdkOnlyFields(item) as Record<string, unknown>;
}

function stripSdkOnlyFields(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripSdkOnlyFields);
  if (!value || typeof value !== "object") return value;

  const clean: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    // Diese Felder fuegt das SDK fuer uns hinzu. Die API akzeptiert sie aber nicht,
    // wenn wir ein altes Response-Item als neuen input zurueckschicken.
    if (key === "parsed_arguments" || key === "parsed" || key === "output_parsed") continue;
    clean[key] = stripSdkOnlyFields(nestedValue);
  }
  return clean;
}
