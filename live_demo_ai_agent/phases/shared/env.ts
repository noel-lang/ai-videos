// Diese Datei ist ein kleiner gemeinsamer Helfer für alle Phasen.
// Sie lädt Umgebungsvariablen, damit API-Keys nicht direkt im Code stehen.

// existsSync prüft, ob eine Datei existiert.
import { existsSync, readFileSync } from "node:fs";

// os gibt uns Informationen über das Betriebssystem, zum Beispiel den Home-Ordner.
import os from "node:os";

// path baut Dateipfade sauber zusammen.
import path from "node:path";

// Diese Dateien lesen wir nacheinander. Die lokale .env ist für das Demo-Projekt,
// plattform.env ist ein bequemer Fallback auf meinem Rechner.
const envFiles = [
  path.join(process.cwd(), ".env"),
  path.join(os.homedir(), "DevTools/repos/plattform.env"),
  path.join(os.homedir(), "DevTools/repos/plattform/.env"),
];

// Beim Import dieser Datei laden wir die Env-Dateien direkt einmal.
loadEnvFiles();

// readConfig liest einen Wert aus process.env. Wenn er fehlt, kommt ein Default zurück.
export function readConfig(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

// requireConfig liest einen Pflichtwert. Wenn er fehlt, brechen wir mit einer
// verständlichen Fehlermeldung ab.
export function requireConfig(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing ${key}. Copy .env.example to .env and fill it.`);
  return value;
}

// Diese Funktion läuft über alle möglichen Env-Dateien und lädt Werte daraus.
function loadEnvFiles(): void {
  for (const file of envFiles) {
    // Wenn die Datei nicht existiert, überspringen wir sie.
    if (!existsSync(file)) continue;

    // Eine .env-Datei besteht aus Zeilen wie OPENAI_MODEL=gpt-5.4-mini.
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const parsed = parseEnvLine(line);

      // Bereits gesetzte Env-Werte überschreiben wir nicht.
      if (parsed && process.env[parsed.key] === undefined) {
        process.env[parsed.key] = parsed.value;
      }
    }
  }
}

// parseEnvLine macht aus einer Textzeile ein key/value-Paar.
function parseEnvLine(line: string): { key: string; value: string } | undefined {
  // Leerzeichen außen entfernen.
  const trimmed = line.trim();

  // Leere Zeilen und Kommentare ignorieren.
  if (!trimmed || trimmed.startsWith("#")) return undefined;

  // Wir suchen das erste Gleichheitszeichen.
  const separator = trimmed.indexOf("=");
  if (separator === -1) return undefined;

  // Links vom "=" steht der Key, rechts der Wert.
  return {
    key: trimmed.slice(0, separator).trim(),
    value: trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, ""),
  };
}
