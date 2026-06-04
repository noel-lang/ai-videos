import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import { z } from "zod";

import { readConfig, requireConfig } from "../../shared/env";

type Message = {
  role: "user" | "assistant" | "tool";
  content: string;
  // Manche OpenAI Response-Items muessen wir spaeter wieder an die API zurueckgeben.
  // item speichert diese technischen API-Objekte neben unserem einfachen Textverlauf.
  item?: Record<string, unknown>;
};

type Tool<TArgs> = {
  name: string;
  description: string;
  jsonSchema: Record<string, unknown>;
  parse(args: unknown): TArgs;
  execute(args: TArgs): Promise<string>;
};

const client = new OpenAI({ apiKey: requireConfig("OPENAI_API_KEY") });
const model = readConfig("OPENAI_MODEL", "gpt-5.4-mini");
const workspaceDir = path.join(process.cwd(), "workspace");
const input = process.argv.slice(2).join(" ") || "Erstelle agent.txt, lies sie danach wieder und fasse sie kurz zusammen.";

function resolveWorkspacePath(relativePath: string): string {
  if (path.isAbsolute(relativePath)) throw new Error("Absolute paths are not allowed");
  const fullPath = path.resolve(workspaceDir, relativePath);
  if (!fullPath.startsWith(`${workspaceDir}${path.sep}`) && fullPath !== workspaceDir) {
    throw new Error("Path escapes workspace");
  }
  return fullPath;
}

const writeFileArgs = z.object({ path: z.string(), content: z.string() });
const readFileArgs = z.object({ path: z.string() });

const tools: Tool<unknown>[] = [
  {
    name: "write_file",
    description: "Write text into a file inside the workspace.",
    jsonSchema: {
      type: "object",
      properties: { path: { type: "string" }, content: { type: "string" } },
      required: ["path", "content"],
      additionalProperties: false,
    },
    parse: (args) => writeFileArgs.parse(args),
    async execute(args) {
      const parsed = writeFileArgs.parse(args);
      const fullPath = resolveWorkspacePath(parsed.path);
      await mkdir(path.dirname(fullPath), { recursive: true });
      await writeFile(fullPath, parsed.content, "utf8");
      return `Wrote ${parsed.path}`;
    },
  },
  {
    name: "read_file",
    description: "Read a UTF-8 file from the workspace.",
    jsonSchema: {
      type: "object",
      properties: { path: { type: "string" } },
      required: ["path"],
      additionalProperties: false,
    },
    parse: (args) => readFileArgs.parse(args),
    async execute(args) {
      const parsed = readFileArgs.parse(args);
      return await readFile(resolveWorkspacePath(parsed.path), "utf8");
    },
  },
];

await mkdir(workspaceDir, { recursive: true });

const messages: Message[] = [{ role: "user", content: input }];
const maxTurns = 6;

// Das ist der agentische Kern: Das Modell darf pro Runde final antworten oder
// Tools anfordern. maxTurns verhindert, dass der Loop endlos weiterlaeuft.
for (let turn = 1; turn <= maxTurns; turn += 1) {
  const response = await client.responses.create({
    model,
    instructions: "Du bist ein kleiner Agent. Nutze Tools fuer Dateiaufgaben und antworte knapp.",
    input: toResponseInput(messages),
    tools: tools.map(toOpenAiTool),
    store: false,
  } as never);

  const outputItems = response.output as unknown as Array<Record<string, unknown>>;
  const calls = outputItems.filter((item) => item.type === "function_call");
  if (calls.length === 0) {
    // Kein Tool Call bedeutet: Das Modell ist fertig und liefert die finale Antwort.
    console.log(`agent> ${response.output_text}`);
    break;
  }

  for (const call of calls) {
    const toolName = String(call.name);
    const tool = tools.find((candidate) => candidate.name === toolName);
    const args = parseJson(String(call.arguments ?? "{}"));

    messages.push({
      role: "assistant",
      content: `Tool call: ${toolName}`,
      // Wir speichern den Tool Call im Verlauf, damit der naechste Modellrequest
      // weiss, zu welchem Aufruf das folgende Tool-Ergebnis gehoert.
      item: sanitizeResponseItem(call),
    });

    console.log(`tool call> ${toolName} ${JSON.stringify(args)}`);

    const output = tool ? await tool.execute(tool.parse(args)) : `Unknown tool: ${toolName}`;
    messages.push({
      role: "tool",
      content: output,
      // Ground Truth zurueck ans Modell: Das Ergebnis ist kein generierter Text,
      // sondern kommt aus der echten Umgebung nach der Tool-Ausfuehrung.
      item: { type: "function_call_output", call_id: String(call.call_id), output },
    });

    console.log(`tool result> ${output}`);
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
    if (message.item) return message.item;
    return { role: message.role === "tool" ? "user" : message.role, content: message.content };
  });
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function sanitizeResponseItem(item: Record<string, unknown>): Record<string, unknown> {
  const clean = { ...item };
  // Das SDK fuegt parsed_arguments fuer uns hinzu, die API akzeptiert dieses Feld
  // aber nicht als naechsten input. Deshalb entfernen wir es vor dem Replay.
  delete clean.parsed_arguments;
  return clean;
}
