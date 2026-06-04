import { mkdir } from "node:fs/promises";
import path from "node:path";
import {
  BoxRenderable,
  createCliRenderer,
  InputRenderable,
  InputRenderableEvents,
  MarkdownRenderable,
  ScrollBoxRenderable,
  SyntaxStyle,
  TextRenderable,
} from "@opentui/core";

import { AgentSession, type AgentEvent } from "./agent-session";
import { readConfig, requireConfig } from "./env";
import { OpenAiProvider } from "./provider";
import { fileTools } from "./tools";

type LogLine = { role: "you" | "agent" | "tool" | "error"; text: string };

const model = readConfig("OPENAI_MODEL", "gpt-5.4-mini");
const workspaceDir = path.join(process.cwd(), "workspace");
await mkdir(workspaceDir, { recursive: true });

// Die UI baut nur eine Session zusammen. Modellzugriff, Tool-Ausfuehrung und
// Loop-Logik liegen in eigenen Dateien und bleiben dadurch erklaerbar.
const session = new AgentSession({
  model,
  provider: new OpenAiProvider(requireConfig("OPENAI_API_KEY")),
  tools: fileTools,
  workspaceDir,
  maxTurns: 8,
  instructions: [
    "Du bist ein didaktischer KI-Agent.",
    "Nutze File-Tools, wenn Dateiarbeit sinnvoll ist.",
    "Keine Thinking-Nachrichten ausgeben.",
    "Antworte knapp und erklaerbar.",
  ].join("\n"),
});

const renderer = await createCliRenderer({
  clearOnShutdown: true,
  exitOnCtrlC: true,
  consoleMode: "disabled",
  targetFps: 30,
});

renderer.root.flexDirection = "column";

const header = new TextRenderable(renderer, {
  id: "header",
  content: `KI-Agent Demo | model=${model} | /clear /exit`,
  height: 1,
});

const logBox = new ScrollBoxRenderable(renderer, {
  id: "log",
  flexGrow: 1,
  border: true,
  paddingX: 1,
  scrollY: true,
  stickyScroll: true,
  stickyStart: "bottom",
});

const markdown = new MarkdownRenderable(renderer, {
  id: "markdown",
  content: "",
  width: "100%",
  conceal: true,
  concealCode: false,
  syntaxStyle: SyntaxStyle.fromStyles({
    "markup.bold": { bold: true, fg: "#f4c7ff" },
    "markup.strong": { bold: true, fg: "#f4c7ff" },
    "markup.italic": { italic: true, fg: "#d7dcff" },
    "markup.raw": { fg: "#a7f3d0" },
    keyword: { fg: "#c4b5fd" },
    string: { fg: "#a7f3d0" },
    property: { fg: "#93c5fd" },
  }),
});
logBox.content.add(markdown);

const footer = new BoxRenderable(renderer, { id: "footer", height: 3, border: true, paddingX: 1 });
// Der Input ist der Adapter vom Menschen zur AgentSession. Spaeter koennte hier
// statt OpenTUI auch Discord stehen und dieselbe Session verwenden.
const input = new InputRenderable(renderer, {
  id: "input",
  placeholder: "Schreib eine Nachricht und drueck Enter...",
  width: "100%",
});
footer.add(input);

renderer.root.add(header);
renderer.root.add(logBox);
renderer.root.add(footer);
renderer.start();
input.focus();
renderer.focusRenderable(input);

const lines: LogLine[] = [];
let busy = false;
let streamingLine: LogLine | undefined;

input.on(InputRenderableEvents.ENTER, (raw: string) => {
  void handleInput(raw);
});

async function handleInput(raw: string): Promise<void> {
  const text = raw.trim();
  input.value = "";

  if (text === "/exit") process.exit(0);
  if (text === "/clear") {
    lines.length = 0;
    session.reset();
    streamingLine = undefined;
    render();
    return;
  }
  if (!text || busy) return;

  busy = true;
  input.placeholder = "Agent arbeitet...";

  try {
    await session.ask(text, renderEvent);
  } catch (error) {
    append("error", error instanceof Error ? error.message : String(error));
  } finally {
    busy = false;
    streamingLine = undefined;
    input.placeholder = "Schreib eine Nachricht und drueck Enter...";
    input.focus();
    renderer.focusRenderable(input);
  }
}

function renderEvent(event: AgentEvent): void {
  // Die AgentSession emittiert neutrale Events. Diese Funktion entscheidet nur,
  // wie User, Tool Calls, Tool Results und Streaming-Text sichtbar werden.
  if (event.type === "user") append("you", event.text);
  if (event.type === "assistant_delta") updateStream(event.text);
  if (event.type === "assistant" && !streamingLine) append("agent", event.text);
  if (event.type === "tool_call") append("tool", `call ${event.name}\n\n\`\`\`json\n${JSON.stringify(event.arguments, null, 2)}\n\`\`\``);
  if (event.type === "tool_result") append("tool", `result ${event.name}\n\n\`\`\`\n${event.result}\n\`\`\``);
  if (event.type === "tool_error") append("error", `tool ${event.name}: ${event.error}`);
}

function append(role: LogLine["role"], text: string): void {
  lines.push({ role, text });
  render();
}

function updateStream(text: string): void {
  streamingLine ??= { role: "agent", text: "" };
  if (!lines.includes(streamingLine)) lines.push(streamingLine);
  streamingLine.text = text;
  render();
}

function render(): void {
  // Markdown macht die Demo lesbarer: Rollen werden fett, Tool-Argumente bleiben
  // als Code sichtbar, aber System- und Thinking-Nachrichten zeigen wir nicht.
  markdown.content = lines.map((line) => `**${line.role}**\n\n${line.text}`).join("\n\n---\n\n");
  renderer.requestRender();
}
