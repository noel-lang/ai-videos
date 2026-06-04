import OpenAI from "openai";

import { readConfig, requireConfig } from "../../shared/env";

const client = new OpenAI({ apiKey: requireConfig("OPENAI_API_KEY") });
const model = readConfig("OPENAI_MODEL", "gpt-5.4-mini");
const input = process.argv.slice(2).join(" ") || "Was ist ein KI-Agent in einem Satz?";

const response = await client.responses.create({
  model,
  input,
});

console.log(response.output_text);
