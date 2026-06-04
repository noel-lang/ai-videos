import { mkdir } from "node:fs/promises";
import path from "node:path";

import { runAgent } from "./agent";
import { loadOpenAiApiKey, readConfig } from "./env";
import { MockProvider } from "./model/mock-provider";
import { OpenAiResponsesProvider } from "./model/openai-provider";
import { fileTools } from "./tools/files";

const workspaceDir = path.join(process.cwd(), "workspace");
const model = readConfig("OPENAI_MODEL", "gpt-5.4-mini")!;
const live = process.argv.includes("--live");
const input =
  process.argv
    .filter((arg) => arg !== "--live")
    .slice(2)
    .join(" ") || "Schreib eine kurze Notiz darüber, was ein KI-Agent technisch ist.";

await mkdir(workspaceDir, { recursive: true });

const apiKey = loadOpenAiApiKey();
const envProvider = readConfig("AGENT_PROVIDER", live ? "openai" : "mock");
const provider = live && envProvider !== "mock" && apiKey ? new OpenAiResponsesProvider(apiKey) : new MockProvider();

const result = await runAgent({
  model,
  provider,
  tools: fileTools,
  toolContext: { workspaceDir },
  instructions: [
    "Du bist ein kleiner didaktischer KI-Agent.",
    "Wenn Dateiarbeit sinnvoll ist, nutze read_file, write_file oder list_files.",
    "Arbeite knapp und erklaere technische Konzepte einfach.",
    "Schreibe nur innerhalb des Workspace.",
  ].join("\n"),
  input,
});

console.log(`provider: ${provider.constructor.name}`);
console.log(`model: ${model}`);
console.log(`answer: ${result.text}`);
console.log("\ntranscript:");
for (const message of result.messages) {
  console.log(`${message.role}: ${message.content}`);
}
