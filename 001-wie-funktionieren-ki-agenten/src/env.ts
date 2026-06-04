import { existsSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const candidateEnvFiles = [
  path.join(process.cwd(), ".env"),
  path.join(os.homedir(), "DevTools/repos/plattform.env"),
  path.join(os.homedir(), "DevTools/repos/plattform/.env"),
];

loadEnvFiles();

export function readConfig(key: string, fallback?: string): string | undefined {
  return process.env[key] ?? fallback;
}

export function loadOpenAiApiKey(): string | undefined {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;

  for (const file of candidateEnvFiles) {
    if (!existsSync(file)) continue;
    const value = readEnvKey(file, "OPENAI_API_KEY");
    if (value) return value;
  }

  return undefined;
}

function loadEnvFiles(): void {
  for (const file of candidateEnvFiles) {
    if (!existsSync(file)) continue;
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const parsed = parseEnvLine(line);
      if (!parsed) continue;
      if (process.env[parsed.key] === undefined) {
        process.env[parsed.key] = parsed.value;
      }
    }
  }
}

function readEnvKey(file: string, key: string): string | undefined {
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const parsed = parseEnvLine(line);
    if (parsed?.key === key) return parsed.value;
  }
  return undefined;
}

function parseEnvLine(line: string): { key: string; value: string } | undefined {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return undefined;
  const index = trimmed.indexOf("=");
  if (index === -1) return undefined;
  const key = trimmed.slice(0, index).trim();
  const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
  return { key, value };
}
