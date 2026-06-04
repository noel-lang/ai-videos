// NEU in Phase 4: Wir behalten die OpenTUI-Oberfläche aus Phase 3,
// aber ergänzen echte Tools als ausführbare Funktionen.

// Datei- und Ordnerfunktionen für unsere lokalen Tools.
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";

// path hilft uns, Dateipfade sicher zusammenzubauen.
import path from "node:path";

// OpenAI bleibt dabei, weil die App weiterhin normal chatten kann.
import OpenAI from "openai";

// OpenTUI bleibt dabei, weil Phase 4 additiv auf Phase 3 aufbaut.
import {
  BoxRenderable,
  createCliRenderer,
  InputRenderable,
  InputRenderableEvents,
  ScrollBoxRenderable,
  TextRenderable,
} from "@opentui/core";

// zod prüft Tool-Argumente zur Laufzeit.
import { z } from "zod";

// Env-Helfer für API-Key und Modellname.
import { readConfig, requireConfig } from "../../shared/env";

// Eine Chat-Nachricht wie in Phase 3.
type Message = { role: "user" | "assistant"; content: string };

// NEU: Ein Tool ist ein Werkzeug mit Name, Beschreibung, Schema und execute.
// Noch ruft das Modell diese Tools nicht selbst auf. Wir testen sie manuell in der UI.
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

// Chat-Kontext aus Phase 2/3 bleibt erhalten.
const messages: Message[] = [];

// Sichtbare Zeilen für die TUI.
const lines: string[] = [];

// Tool-Sicherheitsgrenze: Tools dürfen nur im Workspace arbeiten.
function resolveWorkspacePath(relativePath: string): string {
  if (path.isAbsolute(relativePath)) throw new Error("Absolute paths are not allowed");

  const fullPath = path.resolve(workspaceDir, relativePath);
  if (!fullPath.startsWith(`${workspaceDir}${path.sep}`) && fullPath !== workspaceDir) {
    throw new Error("Path escapes workspace");
  }
  return fullPath;
}

// write_file braucht path und content.
const writeFileArgs = z.object({
  path: z.string(),
  content: z.string(),
});

// read_file braucht nur path.
const readFileArgs = z.object({
  path: z.string(),
});

// list_files bekommt path oder null.
const listFilesArgs = z.object({
  path: z.string().nullable(),
});

// NEU: Die Tools sind normale Funktionen mit Vertrag. Das Modell sieht später
// name, description und jsonSchema; unsere Runtime führt execute aus.
const tools: Tool<unknown>[] = [
  {
    name: "write_file",
    description: "Write text into a file inside the workspace.",
    jsonSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Relative file path inside workspace" },
        content: { type: "string", description: "Text content" },
      },
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
      properties: {
        path: { type: "string", description: "Relative file path inside workspace" },
      },
      required: ["path"],
      additionalProperties: false,
    },
    parse: (args) => readFileArgs.parse(args),
    async execute(args) {
      const parsed = readFileArgs.parse(args);
      return await readFile(resolveWorkspacePath(parsed.path), "utf8");
    },
  },
  {
    name: "list_files",
    description: "List files in a workspace directory.",
    jsonSchema: {
      type: "object",
      properties: {
        path: { type: ["string", "null"], description: "Relative directory or null for root" },
      },
      required: ["path"],
      additionalProperties: false,
    },
    parse: (args) => listFilesArgs.parse(args),
    async execute(args) {
      const parsed = listFilesArgs.parse(args);
      const entries = await readdir(resolveWorkspacePath(parsed.path ?? "."), { withFileTypes: true });
      return entries.map((entry) => `${entry.isDirectory() ? "dir " : "file"} ${entry.name}`).join("\n");
    },
  },
];

await mkdir(workspaceDir, { recursive: true });

// OpenTUI-Aufbau wie Phase 3.
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

const footer = new BoxRenderable(renderer, {
  id: "footer",
  height: 3,
  border: true,
  paddingX: 1,
});

const input = new InputRenderable(renderer, {
  id: "input",
  placeholder: "Chat oder /tools /write-demo /read-demo /exit",
  width: "100%",
});
footer.add(input);

renderer.root.add(log);
renderer.root.add(footer);
renderer.start();
input.focus();
renderer.focusRenderable(input);

input.on(InputRenderableEvents.ENTER, (raw: string) => {
  void handleInput(raw);
});

async function handleInput(raw: string): Promise<void> {
  const userText = raw.trim();
  input.value = "";

  if (userText === "/exit") process.exit(0);
  if (!userText) return;

  // NEU: Diese Befehle zeigen Tools manuell. Das ist noch nicht agentisch,
  // weil nicht das Modell entscheidet, sondern wir als Runtime/Host.
  if (userText === "/tools") {
    append(`tools\n${tools.map((tool) => `${tool.name}: ${tool.description}`).join("\n")}`);
    return;
  }

  if (userText === "/write-demo") {
    const writeTool = tools.find((tool) => tool.name === "write_file");
    const result = await writeTool?.execute({ path: "phase4-demo.txt", content: "Phase 4: Tools sind Funktionen.\n" });
    append(`tool\n${result}`);
    return;
  }

  if (userText === "/read-demo") {
    const readTool = tools.find((tool) => tool.name === "read_file");
    const result = await readTool?.execute({ path: "phase4-demo.txt" });
    append(`tool\n${result}`);
    return;
  }

  // Normaler Chat aus Phase 3 bleibt weiterhin möglich.
  append(`you\n${userText}`);
  messages.push({ role: "user", content: userText });

  const response = await client.responses.create({
    model,
    input: messages,
  });

  messages.push({ role: "assistant", content: response.output_text });
  append(`agent\n${response.output_text}`);
}

function append(line: string): void {
  lines.push(line);
  textView.content = lines.join("\n\n");
  renderer.requestRender();
}
