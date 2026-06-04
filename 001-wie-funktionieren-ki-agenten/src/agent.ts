import type { AgentMessage, ModelProvider, Tool, ToolContext } from "./types";
import { AgentSession } from "./agent-session";

export type RunAgentOptions = {
  model: string;
  instructions: string;
  input: string;
  provider: ModelProvider;
  tools: Tool<unknown>[];
  toolContext: ToolContext;
  maxTurns?: number;
};

export async function runAgent(options: RunAgentOptions): Promise<{ text: string; messages: AgentMessage[] }> {
  const session = new AgentSession(options);
  const text = await session.ask(options.input, () => undefined);
  return { text, messages: session.transcript };
}
