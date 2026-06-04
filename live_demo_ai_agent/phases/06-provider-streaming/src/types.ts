import type { z } from "zod";

export type Message = {
  role: "user" | "assistant" | "tool";
  content: string;
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
  run(input: ModelInput): Promise<ModelStep[]>;
};
