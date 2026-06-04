import { existsSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const envFiles = [
  path.join(process.cwd(), ".env"),
  path.join(os.homedir(), "DevTools/repos/plattform.env"),
  path.join(os.homedir(), "DevTools/repos/plattform/.env"),
];

loadEnvFiles();

export function readConfig(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export function requireConfig(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing ${key}. Copy .env.example to .env and fill it.`);
  return value;
}

function loadEnvFiles(): void {
  for (const file of envFiles) {
    if (!existsSync(file)) continue;

    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const parsed = parseEnvLine(line);
      if (parsed && process.env[parsed.key] === undefined) {
        process.env[parsed.key] = parsed.value;
      }
    }
  }
}

function parseEnvLine(line: string): { key: string; value: string } | undefined {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return undefined;

  const separator = trimmed.indexOf("=");
  if (separator === -1) return undefined;

  return {
    key: trimmed.slice(0, separator).trim(),
    value: trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, ""),
  };
}
