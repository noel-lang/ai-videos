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
  const userInput = await ask("you> ");
  if (userInput === undefined) break;

  const text = userInput.trim();
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

async function ask(prompt: string): Promise<string | undefined> {
  try {
    return await rl.question(prompt);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ERR_USE_AFTER_CLOSE") {
      return undefined;
    }
    throw error;
  }
}
