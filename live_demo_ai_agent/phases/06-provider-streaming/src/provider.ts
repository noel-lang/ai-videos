// OpenAI SDK für den Zugriff auf die Responses API.
import OpenAI from "openai";

// Diese Typen beschreiben unsere eigene, provider-neutrale Agent-Schnittstelle.
import type { Message, ModelInput, ModelProvider, ModelStep, Tool } from "./types";

// Der OpenAiProvider ist der Adapter zwischen unserem Agent-Code und der OpenAI API.
export class OpenAiProvider implements ModelProvider {
  // Der Client wird einmal gebaut und dann pro Request wiederverwendet.
  private readonly client: OpenAI;

  // Beim Erstellen des Providers geben wir den API-Key hinein.
  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  // run ist ein einzelner Modellschritt. Die AgentSession ruft diese Methode auf,
  // ohne wissen zu müssen, wie OpenAI intern funktioniert.
  async run(input: ModelInput): Promise<ModelStep[]> {
    // streamedText sammelt alle Textstücke, die während des Streamings reinkommen.
    let streamedText = "";

    // NEU in Phase 6: Streaming. responses.stream startet einen Request, bei dem
    // Textstücke sofort ankommen. Statt auf die ganze Antwort
    // zu warten, bekommen wir Events, sobald Text entsteht.
    const stream = this.client.responses.stream({
      model: input.model,
      instructions: input.instructions,
      input: toResponseInput(input.messages),
      tools: input.tools.map(toOpenAiTool),
      store: false,
    } as never);

    // for await liest die Streaming-Events nacheinander.
    for await (const event of stream) {
      // Dieses Event bedeutet: Es gibt ein neues Stück Antworttext.
      if (event.type === "response.output_text.delta") {
        // Wir hängen das neue Textstück an den bisherigen Text.
        streamedText += event.delta;

        // Die UI bekommt sofort den aktuellen Zwischenstand.
        input.onTextDelta?.(streamedText);
      }
    }

    // finalResponse gibt uns am Ende die komplette strukturierte Antwort.
    const response = await stream.finalResponse();

    // response.output enthält nicht nur Text, sondern auch Tool Calls.
    const outputItems = response.output as unknown as Array<Record<string, unknown>>;

    // function_call Items sind Tool-Wünsche des Modells.
    const toolCalls = outputItems.filter((item) => item.type === "function_call");

    // Wenn Tools angefordert wurden, geben wir Tool-Schritte an die AgentSession zurück.
    if (toolCalls.length > 0) {
      return toolCalls.map((item) => ({
        type: "tool_call",
        callId: String(item.call_id),
        name: String(item.name),
        arguments: parseJson(String(item.arguments ?? "{}")),
        item: sanitizeResponseItem(item),
      }));
    }

    // Wenn keine Tools angefordert wurden, ist das eine finale Modellantwort.
    return [{ type: "final", text: response.output_text || streamedText || "(no text output)" }];
  }
}

// Diese Funktion übersetzt unser Tool-Objekt in das Format, das OpenAI erwartet.
function toOpenAiTool(tool: Tool<unknown>): Record<string, unknown> {
  return {
    type: "function",
    name: tool.name,
    description: tool.description,
    parameters: tool.jsonSchema,
    strict: true,
  };
}

// Diese Funktion übersetzt unseren Verlauf in OpenAI input Items.
function toResponseInput(messages: Message[]): Array<Record<string, unknown>> {
  return messages.map((message) => {
    // Technische API-Items spielen wir wieder ab, damit OpenAI Tool Calls und Tool
    // Results korrekt miteinander verbinden kann.
    if (message.item) return sanitizeResponseItem(message.item);

    // Normale Nachrichten bekommen role und content.
    return {
      role: message.role === "tool" ? "user" : message.role,
      content: message.role === "tool" ? `Tool result:\n${message.content}` : message.content,
    };
  });
}

// Tool-Argumente kommen als JSON-String. Diese Funktion macht daraus ein Objekt.
function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

// sanitizeResponseItem entfernt SDK-Hilfsfelder, bevor wir Items wieder an die API
// zurückschicken. Ohne das gab es in unserer Implementierung den 400er.
export function sanitizeResponseItem(item: Record<string, unknown>): Record<string, unknown> {
  return stripSdkOnlyFields(item) as Record<string, unknown>;
}

// Diese Funktion läuft rekursiv durch Objekte und Arrays.
function stripSdkOnlyFields(value: unknown): unknown {
  // Arrays reinigen wir Element für Element.
  if (Array.isArray(value)) return value.map(stripSdkOnlyFields);

  // Primitive Werte wie String oder Number bleiben unverändert.
  if (!value || typeof value !== "object") return value;

  // Für Objekte bauen wir ein neues sauberes Objekt.
  const clean: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    // Diese Felder fügt das SDK für uns hinzu. Die API akzeptiert sie aber nicht,
    // wenn wir ein altes Response-Item als neuen input zurückschicken.
    if (key === "parsed_arguments" || key === "parsed" || key === "output_parsed") continue;

    // Alle erlaubten Felder übernehmen wir, verschachtelte Werte werden auch gereinigt.
    clean[key] = stripSdkOnlyFields(nestedValue);
  }
  return clean;
}
