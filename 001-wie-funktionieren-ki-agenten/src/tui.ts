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
import { loadOpenAiApiKey, readConfig } from "./env";
import { MockProvider } from "./model/mock-provider";
import { OpenAiResponsesProvider } from "./model/openai-provider";
import { fileTools } from "./tools/files";

type LogLine = {
  source: "user" | "assistant" | "tool" | "error";
  text: string;
};

const workspaceDir = path.join(process.cwd(), "workspace");
const model = readConfig("OPENAI_MODEL", "gpt-5.4-mini")!;
const forceMock = process.argv.includes("--mock");
const envProvider = readConfig("AGENT_PROVIDER", "openai");
const apiKey = loadOpenAiApiKey();
const provider = !forceMock && envProvider !== "mock" && apiKey ? new OpenAiResponsesProvider(apiKey) : new MockProvider();

await mkdir(workspaceDir, { recursive: true });

const session = new AgentSession({
  model,
  provider,
  tools: fileTools,
  toolContext: { workspaceDir },
  instructions: [
    "Du bist ein kleiner didaktischer KI-Agent in einer Terminal-UI.",
    "Wenn Dateiarbeit sinnvoll ist, nutze read_file, write_file oder list_files.",
    "Arbeite knapp und erklaere technische Konzepte einfach.",
    "Schreibe nur innerhalb des Workspace.",
  ].join("\n"),
});

const renderer = await createCliRenderer({
  clearOnShutdown: true,
  exitOnCtrlC: true,
  targetFps: 30,
  consoleMode: "disabled",
});

renderer.setTerminalTitle("KI-Agenten POC");
renderer.root.flexDirection = "column";

const markdownStyle = SyntaxStyle.fromStyles({
  "markup.bold": { bold: true, fg: "#f4c7ff" },
  "markup.strong": { bold: true, fg: "#f4c7ff" },
  "markup.italic": { italic: true, fg: "#d7dcff" },
  "markup.heading": { bold: true, fg: "#6aa6ff" },
  "markup.raw": { fg: "#a7f3d0" },
  "markup.list": { fg: "#f8d66d" },
  "markup.quote": { fg: "#a5b4fc", italic: true },
  string: { fg: "#a7f3d0" },
  number: { fg: "#f8d66d" },
  boolean: { fg: "#f8d66d" },
  property: { fg: "#93c5fd" },
  keyword: { fg: "#c4b5fd" },
  function: { fg: "#93c5fd" },
  variable: { fg: "#e5e7eb" },
  comment: { fg: "#8b949e", italic: true },
  punctuation: { fg: "#9ca3af" },
});

const header = new BoxRenderable(renderer, {
  id: "header",
  height: 3,
  border: true,
  borderColor: "#6aa6ff",
  paddingX: 1,
});
const headerText = new TextRenderable(renderer, {
  id: "header-text",
  content: `KI-Agenten POC  |  provider=${provider.constructor.name}  model=${model}  |  /clear /exit`,
  height: 1,
});
header.add(headerText);

const logBox = new ScrollBoxRenderable(renderer, {
  id: "log",
  flexGrow: 1,
  border: true,
  borderColor: "#2f3542",
  paddingX: 1,
  paddingY: 0,
  stickyScroll: true,
  stickyStart: "bottom",
  scrollY: true,
});

const logMarkdown = new MarkdownRenderable(renderer, {
  id: "log-markdown",
  content: "",
  width: "100%",
  syntaxStyle: markdownStyle,
  conceal: true,
  concealCode: false,
  tableOptions: {
    style: "columns",
    borders: false,
  },
});
logBox.content.add(logMarkdown);

const footer = new BoxRenderable(renderer, {
  id: "footer",
  height: 3,
  border: true,
  borderColor: "#6aa6ff",
  paddingX: 1,
});
const input = new InputRenderable(renderer, {
  id: "prompt",
  placeholder: "Schreib eine Nachricht und drueck Enter...",
  width: "100%",
  focusedBackgroundColor: "#151a24",
  focusedTextColor: "#ffffff",
});
footer.add(input);

renderer.root.add(header);
renderer.root.add(logBox);
renderer.root.add(footer);

const lines: LogLine[] = [];
let busy = false;
let streamingAssistantLine: LogLine | undefined;

input.focus();
renderer.focusRenderable(input);
renderer.start();

input.on(InputRenderableEvents.ENTER, (value: string) => {
  void handleInput(value);
});

async function handleInput(raw: string): Promise<void> {
  const text = raw.trim();
  input.value = "";
  renderer.focusRenderable(input);

  if (!text) return;
  if (text === "/exit" || text === "/quit") {
    renderer.destroy();
    process.exit(0);
  }
  if (text === "/clear") {
    lines.length = 0;
    session.reset();
    streamingAssistantLine = undefined;
    render();
    return;
  }
  if (busy) {
    append("error", "Agent arbeitet noch. Warte auf die finale Antwort.");
    return;
  }

  busy = true;
  input.placeholder = "Agent arbeitet...";
  input.blur();
  streamingAssistantLine = undefined;

  try {
    await session.ask(text, renderAgentEvent);
  } catch (error) {
    append("error", error instanceof Error ? error.message : String(error));
  } finally {
    busy = false;
    streamingAssistantLine = undefined;
    input.placeholder = "Schreib eine Nachricht und drueck Enter...";
    input.focus();
    renderer.focusRenderable(input);
    render();
  }
}

function renderAgentEvent(event: AgentEvent): void {
  switch (event.type) {
    case "user":
      append("user", event.text);
      break;
    case "status":
      break;
    case "tool_call":
      append("tool", `call ${event.name} ${formatJson(event.arguments)}`);
      break;
    case "tool_result":
      append("tool", `result ${event.name}\n\n${fenced("", shorten(event.result))}`);
      break;
    case "tool_error":
      append("error", `tool ${event.name}: ${event.error}`);
      break;
    case "assistant_delta":
      updateAssistantStream(event.text);
      break;
    case "assistant":
      append("assistant", event.text);
      break;
  }
}

function append(source: LogLine["source"], text: string): void {
  lines.push({ source, text });
  render();
}

function updateAssistantStream(text: string): void {
  if (!streamingAssistantLine) {
    streamingAssistantLine = { source: "assistant", text };
    lines.push(streamingAssistantLine);
  } else {
    streamingAssistantLine.text = text;
  }
  render();
}

function render(): void {
  logMarkdown.content = lines.map(formatLine).join("\n\n");
  logBox.scrollTo({ y: Number.MAX_SAFE_INTEGER, x: 0 });
  renderer.requestRender();
}

function formatLine(line: LogLine): string {
  if (line.source === "tool") {
    return `**tool**\n\n${line.text}`;
  }
  if (line.source === "assistant") {
    return `**agent**\n\n${line.text}`;
  }
  if (line.source === "user") {
    return `**you**\n\n${line.text}`;
  }
  if (line.source === "error") {
    return `**error**\n\n${line.text}`;
  }
  return line.text;
}

function formatJson(value: unknown): string {
  return fenced("json", JSON.stringify(value, null, 2));
}

function shorten(value: string): string {
  const singleLine = value.replace(/\s+/g, " ").trim();
  return singleLine.length > 220 ? `${singleLine.slice(0, 217)}...` : singleLine;
}

function fenced(language: string, value: string): string {
  return `\`\`\`${language}\n${value.replaceAll("```", "`\\`\\`")}\n\`\`\``;
}
