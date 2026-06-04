import type { z } from "zod";

export type Message = {
  role: "user" | "assistant" | "tool";
  content: string;
  // item ist fuer API-spezifische Response-Objekte. Unsere App kann mit einfachem
  // Text arbeiten, aber OpenAI braucht Tool Calls und Tool Outputs strukturiert.
  item?: Record<string, unknown>;
};

export type Tool<TArgs> = {
  name: string;
  description: string;
  schema: z.ZodType<TArgs>;
  jsonSchema: Record<string, unknown>;
  execute(args: TArgs, context: { workspaceDir: string }): Promise<string>;
};

export type ModelInput = {
  model: string;
  instructions: string;
  messages: Message[];
  tools: Tool<unknown>[];
  onTextDelta?: (text: string) => void;
};

export type ModelStep =
  | { type: "final"; text: string }
  | { type: "tool_call"; callId: string; name: string; arguments: unknown; item: Record<string, unknown> };

export type ModelProvider = {
  // Der Agent kennt nur dieses Interface. Ob darunter OpenAI, ein Mock oder spaeter
  // ein anderer Provider steckt, ist fuer den Agent-Loop egal.
  run(input: ModelInput): Promise<ModelStep[]>;
};
