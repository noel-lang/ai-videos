import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

import type { Tool } from "../types";
import { resolveWorkspacePath } from "./safe-path";

const readFileArgs = z.object({
  path: z.string().describe("Relative path inside the workspace"),
});

export const readFileTool: Tool<z.infer<typeof readFileArgs>> = {
  name: "read_file",
  description: "Read a UTF-8 text file from the workspace.",
  parameters: readFileArgs,
  jsonSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Relative path inside the workspace" },
    },
    required: ["path"],
    additionalProperties: false,
  },
  async execute(args, context) {
    const parsed = readFileArgs.parse(args);
    const fullPath = resolveWorkspacePath(context.workspaceDir, parsed.path);
    return await readFile(fullPath, "utf8");
  },
};

const writeFileArgs = z.object({
  path: z.string().describe("Relative path inside the workspace"),
  content: z.string().describe("UTF-8 file content"),
});

export const writeFileTool: Tool<z.infer<typeof writeFileArgs>> = {
  name: "write_file",
  description: "Write UTF-8 text content to a file inside the workspace.",
  parameters: writeFileArgs,
  jsonSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Relative path inside the workspace" },
      content: { type: "string", description: "UTF-8 file content" },
    },
    required: ["path", "content"],
    additionalProperties: false,
  },
  async execute(args, context) {
    const parsed = writeFileArgs.parse(args);
    const fullPath = resolveWorkspacePath(context.workspaceDir, parsed.path);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, parsed.content, "utf8");
    return `Wrote ${parsed.path}`;
  },
};

const listFilesArgs = z.object({
  path: z.string().nullable().describe("Relative directory path inside the workspace, or null for the root"),
});

export const listFilesTool: Tool<z.infer<typeof listFilesArgs>> = {
  name: "list_files",
  description: "List files and directories inside the workspace.",
  parameters: listFilesArgs,
  jsonSchema: {
    type: "object",
    properties: {
      path: {
        type: ["string", "null"],
        description: "Relative directory path inside the workspace, or null for the root",
      },
    },
    required: ["path"],
    additionalProperties: false,
  },
  async execute(args, context) {
    const parsed = listFilesArgs.parse(args);
    const fullPath = resolveWorkspacePath(context.workspaceDir, parsed.path ?? ".");
    const entries = await readdir(fullPath, { withFileTypes: true });
    return entries
      .map((entry) => `${entry.isDirectory() ? "dir " : "file"} ${entry.name}`)
      .sort()
      .join("\n");
  },
};

export const fileTools = [readFileTool, writeFileTool, listFilesTool] as Tool<unknown>[];
