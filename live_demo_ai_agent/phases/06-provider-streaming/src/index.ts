// mkdir legt den Workspace-Ordner an.
import { mkdir } from "node:fs/promises";

// path baut Dateipfade.
import path from "node:path";

// OpenTUI-Komponenten für Terminal-Layout, Eingabe und Markdown-Ausgabe.
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

// AgentSession enthält den Agent-Loop.
import { AgentSession, type AgentEvent } from "./agent-session";

// Env-Helfer für Modellname und API-Key.
import { readConfig, requireConfig } from "./env";

// OpenAiProvider kapselt die OpenAI API.
import { OpenAiProvider } from "./provider";

// fileTools sind die Werkzeuge, die der Agent benutzen darf.
import { fileTools } from "./tools";

// Eine LogLine ist eine sichtbare Zeile im Chatfenster.
type LogLine = { role: "you" | "agent" | "tool" | "error"; text: string };

// Modellname aus Env lesen.
const model = readConfig("OPENAI_MODEL", "gpt-5.4-mini");

// Workspace-Pfad für lokale Dateien.
const workspaceDir = path.join(process.cwd(), "workspace");

// Workspace anlegen, bevor Tools ihn verwenden.
await mkdir(workspaceDir, { recursive: true });

// Die UI baut nur eine Session zusammen. Modellzugriff, Tool-Ausführung und
// Loop-Logik liegen in eigenen Dateien und bleiben dadurch erklärbar.
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
    "Antworte knapp und erklärbar.",
  ].join("\n"),
});

// Renderer starten: Das ist die Zeichenmaschine für unsere Terminal-App.
const renderer = await createCliRenderer({
  clearOnShutdown: true,
  exitOnCtrlC: true,
  consoleMode: "disabled",
  targetFps: 30,
});

// column heißt: Header, Chatlog und Eingabe stehen untereinander.
renderer.root.flexDirection = "column";

// Header oben zeigt Modell und Kurzbefehle.
const header = new TextRenderable(renderer, {
  id: "header",
  content: `KI-Agent Demo | model=${model} | /clear /exit`,
  height: 1,
});

// logBox ist der große scrollbare Chatbereich.
const logBox = new ScrollBoxRenderable(renderer, {
  id: "log",
  flexGrow: 1,
  border: true,
  paddingX: 1,
  scrollY: true,
  stickyScroll: true,
  stickyStart: "bottom",
});

// MarkdownRenderable macht aus Markdown sichtbaren Terminal-Text mit Formatierung.
const markdown = new MarkdownRenderable(renderer, {
  id: "markdown",
  content: "",
  width: "100%",
  conceal: true,
  concealCode: false,
  syntaxStyle: SyntaxStyle.fromStyles({
    // Fettgedrucktes Markdown wird pastel, damit Rollen wie **tool** auffallen.
    "markup.bold": { bold: true, fg: "#f4c7ff" },
    "markup.strong": { bold: true, fg: "#f4c7ff" },
    "markup.italic": { italic: true, fg: "#d7dcff" },
    "markup.raw": { fg: "#a7f3d0" },
    keyword: { fg: "#c4b5fd" },
    string: { fg: "#a7f3d0" },
    property: { fg: "#93c5fd" },
  }),
});

// Das Markdown-Feld liegt im scrollbaren Chatbereich.
logBox.content.add(markdown);

// footer ist der untere Eingabebereich.
const footer = new BoxRenderable(renderer, { id: "footer", height: 3, border: true, paddingX: 1 });

// Der Input ist der Adapter vom Menschen zur AgentSession. Später könnte hier
// statt OpenTUI auch Discord stehen und dieselbe Session verwenden.
const input = new InputRenderable(renderer, {
  id: "input",
  placeholder: "Schreib eine Nachricht und drück Enter...",
  width: "100%",
});

// Eingabefeld in den Footer legen.
footer.add(input);

// Header, Log und Footer an die App hängen.
renderer.root.add(header);
renderer.root.add(logBox);
renderer.root.add(footer);

// Terminal-UI starten.
renderer.start();

// Direkt das Eingabefeld fokussieren.
input.focus();
renderer.focusRenderable(input);

// lines ist der sichtbare Chatverlauf.
const lines: LogLine[] = [];

// busy verhindert, dass der Nutzer während eines laufenden Agent-Turns einen
// zweiten Turn startet.
let busy = false;

// streamingLine ist die Zeile, die während Streaming immer wieder aktualisiert wird.
let streamingLine: LogLine | undefined;

// ENTER im Eingabefeld startet handleInput.
input.on(InputRenderableEvents.ENTER, (raw: string) => {
  void handleInput(raw);
});

// handleInput verarbeitet einen eingegebenen Text.
async function handleInput(raw: string): Promise<void> {
  // Leerzeichen außen entfernen.
  const text = raw.trim();

  // Eingabefeld leeren.
  input.value = "";

  // /exit beendet die App.
  if (text === "/exit") process.exit(0);

  // /clear leert UI und Agent-Verlauf.
  if (text === "/clear") {
    lines.length = 0;
    session.reset();
    streamingLine = undefined;
    render();
    return;
  }

  // Leere Eingaben oder parallele Eingaben ignorieren.
  if (!text || busy) return;

  // Ab hier arbeitet der Agent.
  busy = true;
  input.placeholder = "Agent arbeitet...";

  try {
    // session.ask startet den Agent-Loop. renderEvent bekommt alle Events.
    await session.ask(text, renderEvent);
  } catch (error) {
    // Fehler werden sichtbar in den Chat geschrieben.
    append("error", error instanceof Error ? error.message : String(error));
  } finally {
    // UI wieder in Eingabezustand bringen.
    busy = false;
    streamingLine = undefined;
    input.placeholder = "Schreib eine Nachricht und drück Enter...";
    input.focus();
    renderer.focusRenderable(input);
  }
}

// Die AgentSession emittiert neutrale Events. Diese Funktion entscheidet nur,
// wie User, Tool Calls, Tool Results und Streaming-Text sichtbar werden.
function renderEvent(event: AgentEvent): void {
  if (event.type === "user") append("you", event.text);
  if (event.type === "assistant_delta") updateStream(event.text);
  if (event.type === "assistant" && !streamingLine) append("agent", event.text);
  if (event.type === "tool_call") append("tool", `call ${event.name}\n\n\`\`\`json\n${JSON.stringify(event.arguments, null, 2)}\n\`\`\``);
  if (event.type === "tool_result") append("tool", `result ${event.name}\n\n\`\`\`\n${event.result}\n\`\`\``);
  if (event.type === "tool_error") append("error", `tool ${event.name}: ${event.error}`);
}

// append fügt eine neue Zeile in den sichtbaren Verlauf ein.
function append(role: LogLine["role"], text: string): void {
  lines.push({ role, text });
  render();
}

// updateStream aktualisiert die laufende Agent-Antwort, statt jedes Textstück als
// neue Zeile einzufügen.
function updateStream(text: string): void {
  streamingLine ??= { role: "agent", text: "" };
  if (!lines.includes(streamingLine)) lines.push(streamingLine);
  streamingLine.text = text;
  render();
}

// render baut den Markdown-Text für den gesamten sichtbaren Verlauf.
function render(): void {
  // Markdown macht die Demo lesbarer: Rollen werden fett, Tool-Argumente bleiben
  // als Code sichtbar, aber System- und Thinking-Nachrichten zeigen wir nicht.
  markdown.content = lines.map((line) => `**${line.role}**\n\n${line.text}`).join("\n\n---\n\n");
  renderer.requestRender();
}
