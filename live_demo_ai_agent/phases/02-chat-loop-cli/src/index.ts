import { createInterface } from "node:readline/promises";
import OpenAI from "openai";

import { readConfig, requireConfig } from "../../shared/env";

type Message = { role: "user" | "assistant"; content: string };

const client = new OpenAI({ apiKey: requireConfig("OPENAI_API_KEY") });
const model = readConfig("OPENAI_MODEL", "gpt-5.4-mini");
const messages: Message[] = [];

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("Schreib eine Nachricht. /exit beendet den Chat.\n");

while (true) {
  const text = (await rl.question("you> ")).trim();
  if (text === "/exit") break;
  if (!text) continue;

  messages.push({ role: "user", content: text });

  const response = await client.responses.create({
    model,
    input: messages,
  });

  const answer = response.output_text;
  messages.push({ role: "assistant", content: answer });
  console.log(`agent> ${answer}\n`);
}

rl.close();
