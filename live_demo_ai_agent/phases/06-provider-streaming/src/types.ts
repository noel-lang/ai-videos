// z ist nur ein TypeScript-Typimport. Er landet nicht im laufenden JavaScript,
// hilft uns aber, Tool-Schemas korrekt zu typisieren.
import type { z } from "zod";

// Message ist ein einzelner Eintrag im Agent-Verlauf.
export type Message = {
  // role sagt, wer gesprochen oder geantwortet hat.
  role: "user" | "assistant" | "tool";

  // content ist der lesbare Text dieser Nachricht.
  content: string;

  // item ist für API-spezifische Response-Objekte. Unsere App kann mit einfachem
  // Text arbeiten, aber OpenAI braucht Tool Calls und Tool Outputs strukturiert.
  item?: Record<string, unknown>;
};

// Tool beschreibt ein Werkzeug, das der Agent verwenden darf.
export type Tool<TArgs> = {
  // name ist der technische Name, den das Modell im Tool Call verwendet.
  name: string;

  // description erklärt dem Modell, wann dieses Tool sinnvoll ist.
  description: string;

  // schema ist die Laufzeitprüfung mit Zod.
  schema: z.ZodType<TArgs>;

  // jsonSchema ist die maschinenlesbare Beschreibung für die OpenAI API.
  jsonSchema: Record<string, unknown>;

  // execute ist die echte Arbeit in der Umgebung.
  execute(args: TArgs, context: { workspaceDir: string }): Promise<string>;
};

// ModelInput ist alles, was ein Provider für einen Modellschritt braucht.
export type ModelInput = {
  model: string;
  instructions: string;
  messages: Message[];
  tools: Tool<unknown>[];
  onTextDelta?: (text: string) => void;
};

// Ein Modellschritt ist entweder eine finale Antwort oder ein Tool Call.
export type ModelStep =
  | { type: "final"; text: string }
  | { type: "tool_call"; callId: string; name: string; arguments: unknown; item: Record<string, unknown> };

// Der Agent kennt nur dieses Interface. Ob darunter OpenAI, ein Mock oder später
// ein anderer Provider steckt, ist für den Agent-Loop egal.
export type ModelProvider = {
  run(input: ModelInput): Promise<ModelStep[]>;
};
