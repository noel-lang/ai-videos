// Datei-Operationen für unsere Tools.
import { mkdir, readFile, writeFile } from "node:fs/promises";

// path hilft beim sicheren Bauen von Dateipfaden.
import path from "node:path";

// OpenAI ist das SDK für den Modellzugriff.
import OpenAI from "openai";

// zod validiert Tool-Argumente.
import { z } from "zod";

// Env-Helfer für API-Key und Modellname.
import { readConfig, requireConfig } from "../../shared/env";

// Eine Message ist ein Eintrag im Verlauf. Zusätzlich zu user und assistant gibt
// es jetzt tool, weil Tool-Ergebnisse zurück in den Modellkontext müssen.
type Message = {
  role: "user" | "assistant" | "tool";
  content: string;

  // item speichert technische OpenAI-Objekte. Das brauchen wir, damit die API
  // Tool Call und Tool Result in der nächsten Runde richtig zuordnen kann.
  item?: Record<string, unknown>;
};

// Ein Tool ist ein benanntes Werkzeug mit Beschreibung, Schema und echter Funktion.
type Tool<TArgs> = {
  name: string;
  description: string;
  jsonSchema: Record<string, unknown>;
  parse(args: unknown): TArgs;
  execute(args: TArgs): Promise<string>;
};

// Der OpenAI Client spricht mit dem Modell.
const client = new OpenAI({ apiKey: requireConfig("OPENAI_API_KEY") });

// Der Modellname kommt aus der Umgebung.
const model = readConfig("OPENAI_MODEL", "gpt-5.4-mini");

// Alle Dateien liegen im lokalen Workspace.
const workspaceDir = path.join(process.cwd(), "workspace");

// Der User-Prompt kommt aus der CLI. Wenn keiner übergeben wird, nutzen wir einen
// Prompt, der sicher einen mehrstufigen Tool-Loop auslöst.
const input = process.argv.slice(2).join(" ") || "Erstelle agent.txt, lies sie danach wieder und fasse sie kurz zusammen.";

// Sicherheitsfunktion: Aus einem relativen Pfad wird ein sicherer Workspace-Pfad.
function resolveWorkspacePath(relativePath: string): string {
  // Absolute Pfade sind verboten.
  if (path.isAbsolute(relativePath)) throw new Error("Absolute paths are not allowed");

  // Der vollständige Pfad wird normalisiert.
  const fullPath = path.resolve(workspaceDir, relativePath);

  // Wenn der Pfad nicht mehr im Workspace liegt, blocken wir ihn.
  if (!fullPath.startsWith(`${workspaceDir}${path.sep}`) && fullPath !== workspaceDir) {
    throw new Error("Path escapes workspace");
  }

  return fullPath;
}

// Argument-Schemas für unsere beiden Tools.
const writeFileArgs = z.object({ path: z.string(), content: z.string() });
const readFileArgs = z.object({ path: z.string() });

// In dieser Phase definieren wir die Tools direkt in dieser Datei, damit man den
// kompletten Agent-Loop an einem Ort erklären kann.
const tools: Tool<unknown>[] = [
  {
    name: "write_file",
    description: "Write text into a file inside the workspace.",
    jsonSchema: {
      type: "object",
      properties: { path: { type: "string" }, content: { type: "string" } },
      required: ["path", "content"],
      additionalProperties: false,
    },
    parse: (args) => writeFileArgs.parse(args),
    async execute(args) {
      // Zuerst prüfen wir die Argumente.
      const parsed = writeFileArgs.parse(args);

      // Dann lösen wir den Pfad sicher auf.
      const fullPath = resolveWorkspacePath(parsed.path);

      // Ordner anlegen, falls nötig.
      await mkdir(path.dirname(fullPath), { recursive: true });

      // Datei schreiben.
      await writeFile(fullPath, parsed.content, "utf8");

      // Kurze Rückmeldung für das Modell.
      return `Wrote ${parsed.path}`;
    },
  },
  {
    name: "read_file",
    description: "Read a UTF-8 file from the workspace.",
    jsonSchema: {
      type: "object",
      properties: { path: { type: "string" } },
      required: ["path"],
      additionalProperties: false,
    },
    parse: (args) => readFileArgs.parse(args),
    async execute(args) {
      // Argumente prüfen.
      const parsed = readFileArgs.parse(args);

      // Datei sicher im Workspace lesen.
      return await readFile(resolveWorkspacePath(parsed.path), "utf8");
    },
  },
];

// Workspace vorbereiten.
await mkdir(workspaceDir, { recursive: true });

// Der Verlauf startet mit der User-Aufgabe.
const messages: Message[] = [{ role: "user", content: input }];

// maxTurns ist die Sicherheitsbremse. Ohne Stop-Kriterium könnte ein Agent-Loop
// theoretisch immer weiter Tools anfordern.
const maxTurns = 6;

// Das ist der agentische Kern: Modell fragen, Tool Calls ausführen, Tool Results
// zurückgeben, wieder Modell fragen, bis eine finale Antwort kommt.
for (let turn = 1; turn <= maxTurns; turn += 1) {
  // Jede Runde schicken wir den bisherigen Verlauf plus Tool-Beschreibungen ans Modell.
  const response = await client.responses.create({
    model,
    instructions: "Du bist ein kleiner Agent. Nutze Tools für Dateiaufgaben und antworte knapp.",
    input: toResponseInput(messages),
    tools: tools.map(toOpenAiTool),
    store: false,
  } as never);

  // Die Responses API kann Textantworten und strukturierte Items liefern.
  const outputItems = response.output as unknown as Array<Record<string, unknown>>;

  // function_call heißt: Das Modell möchte ein Tool benutzen.
  const calls = outputItems.filter((item) => item.type === "function_call");

  // Wenn kein Tool Call dabei ist, ist das Modell fertig.
  if (calls.length === 0) {
    console.log(`agent> ${response.output_text}`);
    break;
  }

  // Es können theoretisch mehrere Tool Calls in einer Runde kommen.
  for (const call of calls) {
    // Tool-Name aus dem Modell-Output lesen.
    const toolName = String(call.name);

    // Das passende Tool in unserer lokalen Tool-Liste suchen.
    const tool = tools.find((candidate) => candidate.name === toolName);

    // Tool-Argumente kommen als JSON-String und werden hier in ein Objekt verwandelt.
    const args = parseJson(String(call.arguments ?? "{}"));

    // Wir speichern den Tool Call im Verlauf, damit der nächste Modellrequest weiß,
    // zu welchem Aufruf das folgende Tool-Ergebnis gehört.
    messages.push({
      role: "assistant",
      content: `Tool call: ${toolName}`,
      item: sanitizeResponseItem(call),
    });

    // Sichtbare Demo-Ausgabe: Welches Tool will das Modell aufrufen?
    console.log(`tool call> ${toolName} ${JSON.stringify(args)}`);

    // Wenn es das Tool gibt, führen wir es aus. Sonst geben wir einen Fehler zurück.
    const output = tool ? await tool.execute(tool.parse(args)) : `Unknown tool: ${toolName}`;

    // Ground Truth zurück ans Modell: Das Ergebnis ist kein generierter Text,
    // sondern kommt aus der echten Umgebung nach der Tool-Ausführung.
    messages.push({
      role: "tool",
      content: output,
      item: { type: "function_call_output", call_id: String(call.call_id), output },
    });

    // Sichtbare Demo-Ausgabe: Was hat das Tool zurückgegeben?
    console.log(`tool result> ${output}`);
  }
}

// OpenAI erwartet Tools in einem bestimmten Format. Diese Funktion übersetzt
// unseren kleinen Tool-Typ in dieses API-Format.
function toOpenAiTool(tool: Tool<unknown>): Record<string, unknown> {
  return {
    type: "function",
    name: tool.name,
    description: tool.description,
    parameters: tool.jsonSchema,
    strict: true,
  };
}

// Unsere Message-Liste ist bequem für uns. Diese Funktion baut daraus den Input,
// den die Responses API versteht.
function toResponseInput(messages: Message[]): Array<Record<string, unknown>> {
  return messages.map((message) => {
    // Wenn ein technisches API-Item existiert, verwenden wir es direkt.
    if (message.item) return message.item;

    // Normale Chat-Nachrichten bekommen role und content.
    return { role: message.role === "tool" ? "user" : message.role, content: message.content };
  });
}

// JSON kann kaputt sein. Diese Funktion verhindert, dass die Demo wegen eines
// Parse-Fehlers sofort abstürzt.
function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

// Das OpenAI SDK fügt manchmal Hilfsfelder hinzu. Die API akzeptiert diese Felder
// aber nicht, wenn wir ein altes Item in der nächsten Runde wieder zurückschicken.
function sanitizeResponseItem(item: Record<string, unknown>): Record<string, unknown> {
  const clean = { ...item };
  delete clean.parsed_arguments;
  return clean;
}
