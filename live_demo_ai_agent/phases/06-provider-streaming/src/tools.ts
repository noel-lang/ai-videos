// Datei- und Ordnerfunktionen für unsere lokalen Tools.
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";

// path hilft beim sicheren Umgang mit Dateipfaden.
import path from "node:path";

// zod prüft Tool-Argumente zur Laufzeit.
import { z } from "zod";

// Tool ist unser gemeinsamer Tool-Typ aus types.ts.
import type { Tool } from "./types";

// Alle File-Tools laufen in einem lokalen Workspace. Das ist die einfache
// Sicherheitsgrenze für die Demo: keine absoluten Pfade, kein Ausbrechen per "..".
function resolveWorkspacePath(workspaceDir: string, relativePath: string): string {
  // Absolute Pfade sind verboten, weil das Modell nur relativ im Workspace arbeiten soll.
  if (path.isAbsolute(relativePath)) throw new Error("Absolute paths are not allowed");

  // Aus Workspace und relativem Pfad wird ein vollständiger Pfad.
  const fullPath = path.resolve(workspaceDir, relativePath);

  // Wenn der Pfad außerhalb des Workspace landet, blocken wir ihn.
  if (!fullPath.startsWith(`${workspaceDir}${path.sep}`) && fullPath !== workspaceDir) {
    throw new Error("Path escapes workspace");
  }

  // Nur sichere Pfade werden zurückgegeben.
  return fullPath;
}

// write_file erwartet path und content.
const writeFileArgs = z.object({
  path: z.string(),
  content: z.string(),
});

// read_file erwartet nur path.
const readFileArgs = z.object({
  path: z.string(),
});

// list_files erwartet path oder null.
const listFilesArgs = z.object({
  path: z.string().nullable(),
});

// fileTools ist die Tool-Liste, die später an den Agent übergeben wird.
export const fileTools: Tool<unknown>[] = [
  {
    // Name, den das Modell im Tool Call verwenden kann.
    name: "write_file",

    // Menschlich lesbare Beschreibung für das Modell.
    description: "Write UTF-8 text into a workspace file.",

    // Zod-Schema für unsere Runtime.
    schema: writeFileArgs,

    // JSON Schema für die OpenAI API. Je klarer dieses Schema ist, desto besser
    // kann das Modell passende Argumente erzeugen.
    jsonSchema: {
      type: "object",
      properties: { path: { type: "string" }, content: { type: "string" } },
      required: ["path", "content"],
      additionalProperties: false,
    },

    // execute ist die echte Aktion: Hier wird tatsächlich eine Datei geschrieben.
    async execute(args, context) {
      // Erst prüfen wir, ob die Argumente stimmen.
      const parsed = writeFileArgs.parse(args);

      // Dann machen wir aus dem relativen Pfad einen sicheren Workspace-Pfad.
      const fullPath = resolveWorkspacePath(context.workspaceDir, parsed.path);

      // Falls der Zielordner noch nicht existiert, legen wir ihn an.
      await mkdir(path.dirname(fullPath), { recursive: true });

      // Jetzt schreiben wir den Inhalt in die Datei.
      await writeFile(fullPath, parsed.content, "utf8");

      // Das Ergebnis geht später zurück ans Modell.
      return `Wrote ${parsed.path}`;
    },
  },
  {
    name: "read_file",
    description: "Read a UTF-8 text file from the workspace.",
    schema: readFileArgs,
    jsonSchema: {
      type: "object",
      properties: { path: { type: "string" } },
      required: ["path"],
      additionalProperties: false,
    },
    async execute(args, context) {
      // Argumente prüfen.
      const parsed = readFileArgs.parse(args);

      // Datei sicher im Workspace lesen.
      return await readFile(resolveWorkspacePath(context.workspaceDir, parsed.path), "utf8");
    },
  },
  {
    name: "list_files",
    description: "List files in the workspace.",
    schema: listFilesArgs,
    jsonSchema: {
      type: "object",
      properties: { path: { type: ["string", "null"] } },
      required: ["path"],
      additionalProperties: false,
    },
    async execute(args, context) {
      // null bedeutet: Liste den Workspace selbst.
      const parsed = listFilesArgs.parse(args);

      // readdir liest die Einträge eines Ordners.
      const entries = await readdir(resolveWorkspacePath(context.workspaceDir, parsed.path ?? "."), {
        withFileTypes: true,
      });

      // Für die Demo formatieren wir jeden Eintrag als "dir name" oder "file name".
      return entries.map((entry) => `${entry.isDirectory() ? "dir " : "file"} ${entry.name}`).join("\n");
    },
  },
];
