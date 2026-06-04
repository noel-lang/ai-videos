// NEU in Phase 5: Aus Tools + Chat + TUI wird ein Agent-Loop.
// Das Modell darf jetzt selbst Tool Calls anfordern, die Runtime führt sie aus.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import {
  BoxRenderable,
  createCliRenderer,
  InputRenderable,
  InputRenderableEvents,
  ScrollBoxRenderable,
  TextRenderable,
} from "@opentui/core";
import { z } from "zod";

import { readConfig, requireConfig } from "../../shared/env";

type Message = {
  role: "user" | "assistant" | "tool";
  content: string;
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
await mkdir(workspaceDir, { recursive: true });

const messages: Message[] = [];
const lines: string[] = [];

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

// TUI bleibt aus Phase 3/4 erhalten. Nur die Logik hinter Enter wird agentisch.
const renderer = await createCliRenderer({
  clearOnShutdown: true,
  exitOnCtrlC: true,
  consoleMode: "disabled",
});

renderer.root.flexDirection = "column";

const log = new ScrollBoxRenderable(renderer, {
  id: "log",
  flexGrow: 1,
  border: true,
  paddingX: 1,
  scrollY: true,
  stickyScroll: true,
  stickyStart: "bottom",
});

const textView = new TextRenderable(renderer, {
  id: "text",
  content: "",
  width: "100%",
});
log.content.add(textView);

const footer = new BoxRenderable(renderer, { id: "footer", height: 3, border: true, paddingX: 1 });
const input = new InputRenderable(renderer, {
  id: "input",
  placeholder: "Bitte Aufgabe eingeben. /clear /exit",
  width: "100%",
});
footer.add(input);

renderer.root.add(log);
renderer.root.add(footer);
renderer.start();
input.focus();
renderer.focusRenderable(input);

let busy = false;

input.on(InputRenderableEvents.ENTER, (raw: string) => {
  void handleInput(raw);
});

async function handleInput(raw: string): Promise<void> {
  const text = raw.trim();
  input.value = "";

  if (text === "/exit") process.exit(0);
  if (text === "/clear") {
    messages.length = 0;
    lines.length = 0;
    render();
    return;
  }
  if (!text || busy) return;

  busy = true;
  input.placeholder = "Agent arbeitet...";

  try {
    append(`you\n${text}`);
    messages.push({ role: "user", content: text });

    // NEU: Statt genau einmal Modell -> Antwort zu machen, starten wir den
    // agentischen Loop. Er läuft, bis das Modell fertig ist oder maxTurns greift.
    await runAgentLoop();
  } catch (error) {
    append(`error\n${error instanceof Error ? error.message : String(error)}`);
  } finally {
    busy = false;
    input.placeholder = "Bitte Aufgabe eingeben. /clear /exit";
    input.focus();
    renderer.focusRenderable(input);
  }
}

async function runAgentLoop(): Promise<void> {
  // maxTurns ist die Sicherheitsbremse. Wenn das Modell nie final antwortet,
  // stoppen wir nach acht Runden kontrolliert.
  const maxTurns = 8;

  for (let turn = 1; turn <= maxTurns; turn += 1) {
    append(`status\nturn ${turn}/${maxTurns}: Modell entscheidet...`);

    const response = await client.responses.create({
      model,
      instructions: "Du bist ein kleiner Agent. Nutze Tools für Dateiaufgaben und antworte knapp.",
      input: toResponseInput(messages),
      tools: tools.map(toOpenAiTool),
      store: false,
    } as never);

    const outputItems = response.output as unknown as Array<Record<string, unknown>>;
    const calls = outputItems.filter((item) => item.type === "function_call");

    // Woran wissen wir, dass der Agent fertig ist?
    // Wenn das Modell keinen function_call mehr liefert, sondern normalen Text.
    if (calls.length === 0) {
      messages.push({ role: "assistant", content: response.output_text });
      append(`agent\n${response.output_text}`);
      return;
    }

    // NEU: "Selbst denken" heißt hier technisch: Das Modell wählt anhand von Ziel
    // und bisherigem Feedback selbst den nächsten Tool Call.
    for (const call of calls) {
      const toolName = String(call.name);
      const tool = tools.find((candidate) => candidate.name === toolName);
      const args = parseJson(String(call.arguments ?? "{}"));

      messages.push({
        role: "assistant",
        content: `Tool call: ${toolName}`,
        item: sanitizeResponseItem(call),
      });

      append(`tool call\n${toolName} ${JSON.stringify(args, null, 2)}`);

      const output = tool ? await tool.execute(tool.parse(args)) : `Unknown tool: ${toolName}`;

      // Das Tool Result ist Ground Truth aus der Umgebung. Genau dieses Feedback
      // bekommt das Modell in der nächsten Loop-Runde zurück.
      messages.push({
        role: "tool",
        content: output,
        item: { type: "function_call_output", call_id: String(call.call_id), output },
      });

      append(`tool result\n${output}`);
    }
  }

  append(`agent\nStopped after maxTurns. Das Stop-Kriterium hat den Loop beendet.`);
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
    if (message.item) return sanitizeResponseItem(message.item);
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
  delete clean.parsed_arguments;
  return clean;
}

function append(line: string): void {
  lines.push(line);
  render();
}

function render(): void {
  textView.content = lines.join("\n\n---\n\n");
  renderer.requestRender();
}
