import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

import type { Tool } from "./types";

// Alle File-Tools laufen in einem lokalen Workspace. Das ist die einfache
// Sicherheitsgrenze fuer die Demo: keine absoluten Pfade, kein Ausbrechen per "..".
function resolveWorkspacePath(workspaceDir: string, relativePath: string): string {
  if (path.isAbsolute(relativePath)) throw new Error("Absolute paths are not allowed");

  const fullPath = path.resolve(workspaceDir, relativePath);
  if (!fullPath.startsWith(`${workspaceDir}${path.sep}`) && fullPath !== workspaceDir) {
    throw new Error("Path escapes workspace");
  }
  return fullPath;
}

const writeFileArgs = z.object({
  path: z.string(),
  content: z.string(),
});

const readFileArgs = z.object({
  path: z.string(),
});

const listFilesArgs = z.object({
  path: z.string().nullable(),
});

export const fileTools: Tool<unknown>[] = [
  {
    name: "write_file",
    description: "Write UTF-8 text into a workspace file.",
    schema: writeFileArgs,
    // Das JSON Schema ist die Tool-Dokumentation fuer das Modell. Je klarer es ist,
    // desto zuverlaessiger kann das Modell das Tool mit passenden Argumenten nutzen.
    jsonSchema: {
      type: "object",
      properties: { path: { type: "string" }, content: { type: "string" } },
      required: ["path", "content"],
      additionalProperties: false,
    },
    async execute(args, context) {
      // Erst execute veraendert die echte Umgebung. Das Modell selbst erzeugt nur
      // den Wunsch, diese Funktion aufzurufen.
      const parsed = writeFileArgs.parse(args);
      const fullPath = resolveWorkspacePath(context.workspaceDir, parsed.path);
      await mkdir(path.dirname(fullPath), { recursive: true });
      await writeFile(fullPath, parsed.content, "utf8");
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
      const parsed = readFileArgs.parse(args);
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
      const parsed = listFilesArgs.parse(args);
      const entries = await readdir(resolveWorkspacePath(context.workspaceDir, parsed.path ?? "."), {
        withFileTypes: true,
      });
      return entries.map((entry) => `${entry.isDirectory() ? "dir " : "file"} ${entry.name}`).join("\n");
    },
  },
];
