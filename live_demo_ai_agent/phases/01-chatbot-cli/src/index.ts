import OpenAI from "openai";

import { readConfig, requireConfig } from "../../shared/env";

const client = new OpenAI({ apiKey: requireConfig("OPENAI_API_KEY") });
const model = readConfig("OPENAI_MODEL", "gpt-5.4-mini");
const input = process.argv.slice(2).join(" ") || "Was ist ein KI-Agent in einem Satz?";

// Der kleinste Durchstich: ein Prompt geht zum Modell, eine Textantwort kommt zurueck.
// Hier gibt es noch keinen Verlauf, keine Tools und keinen Agent-Loop.
const response = await client.responses.create({
  model,
  input,
});

console.log(response.output_text);
