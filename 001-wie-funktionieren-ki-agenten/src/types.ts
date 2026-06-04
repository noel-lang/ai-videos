import type { z } from "zod";

export type Role = "user" | "assistant" | "tool";

export type AgentMessage = {
  role: Role;
  content: string;
  item?: Record<string, unknown>;
};

export type ToolContext = {
  workspaceDir: string;
};

export type Tool<TArgs> = {
  name: string;
  description: string;
  parameters: z.ZodType<TArgs>;
  jsonSchema: Record<string, unknown>;
  execute(args: TArgs, context: ToolContext): Promise<string>;
};

export type ModelInput = {
  model: string;
  instructions: string;
  messages: AgentMessage[];
  tools: Tool<unknown>[];
  onTextDelta?: (delta: string) => void;
};

export type ModelStep =
  | { type: "final"; text: string; raw?: unknown }
  | { type: "tool_call"; callId: string; name: string; arguments: unknown; item?: Record<string, unknown>; raw?: unknown };

export type ModelProvider = {
  run(input: ModelInput): Promise<ModelStep[]>;
};

export type TransportInbound = {
  channel: "cli" | "discord";
  conversationId: string;
  userId: string;
  text: string;
};

export type TransportOutbound = {
  channel: "cli" | "discord";
  conversationId: string;
  text: string;
};

export type TransportAdapter = {
  name: TransportInbound["channel"];
  start(onMessage: (event: TransportInbound) => Promise<void>): Promise<void>;
  send(event: TransportOutbound): Promise<void>;
};
