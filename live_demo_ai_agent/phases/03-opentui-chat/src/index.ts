import OpenAI from "openai";
import {
  BoxRenderable,
  createCliRenderer,
  InputRenderable,
  InputRenderableEvents,
  ScrollBoxRenderable,
  TextRenderable,
} from "@opentui/core";

import { readConfig, requireConfig } from "../../shared/env";

type Message = { role: "user" | "assistant"; content: string };

const client = new OpenAI({ apiKey: requireConfig("OPENAI_API_KEY") });
const model = readConfig("OPENAI_MODEL", "gpt-5.4-mini");
const messages: Message[] = [];
const lines: string[] = [];

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
  placeholder: "Nachricht schreiben. /exit beendet.",
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
