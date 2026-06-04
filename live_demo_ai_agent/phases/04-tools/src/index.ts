import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

type Tool<TArgs> = {
  name: string;
  description: string;
  jsonSchema: Record<string, unknown>;
  parse(args: unknown): TArgs;
  execute(args: TArgs): Promise<string>;
};

const workspaceDir = path.join(process.cwd(), "workspace");

function resolveWorkspacePath(relativePath: string): string {
  if (path.isAbsolute(relativePath)) {
    throw new Error("Absolute paths are not allowed");
  }

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

const writeFileTool: Tool<z.infer<typeof writeFileArgs>> = {
  name: "write_file",
  description: "Write text into a file inside the workspace.",
  jsonSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Relative file path inside workspace" },
      content: { type: "string", description: "Text content" },
    },
    required: ["path", "content"],
    additionalProperties: false,
  },
  parse: (args) => writeFileArgs.parse(args),
  async execute(args) {
    const fullPath = resolveWorkspacePath(args.path);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, args.content, "utf8");
    return `Wrote ${args.path}`;
  },
};

const readFileArgs = z.object({ path: z.string() });

const readFileTool: Tool<z.infer<typeof readFileArgs>> = {
  name: "read_file",
  description: "Read a UTF-8 file from the workspace.",
  jsonSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Relative file path inside workspace" },
    },
    required: ["path"],
    additionalProperties: false,
  },
  parse: (args) => readFileArgs.parse(args),
  async execute(args) {
    return await readFile(resolveWorkspacePath(args.path), "utf8");
  },
};

const listFilesArgs = z.object({ path: z.string().nullable() });

const listFilesTool: Tool<z.infer<typeof listFilesArgs>> = {
  name: "list_files",
  description: "List files in a workspace directory.",
  jsonSchema: {
    type: "object",
    properties: {
      path: { type: ["string", "null"], description: "Relative directory or null for root" },
    },
    required: ["path"],
    additionalProperties: false,
  },
  parse: (args) => listFilesArgs.parse(args),
  async execute(args) {
    const entries = await readdir(resolveWorkspacePath(args.path ?? "."), { withFileTypes: true });
    return entries.map((entry) => `${entry.isDirectory() ? "dir " : "file"} ${entry.name}`).join("\n");
  },
};

const tools = [writeFileTool, readFileTool, listFilesTool];

await mkdir(workspaceDir, { recursive: true });

// Manualer Tool-Aufruf: Das Modell kommt erst in der naechsten Phase dazu.
const writeResult = await writeFileTool.execute(
  writeFileTool.parse({ path: "demo.txt", content: "Tools sind Funktionen mit Schema.\n" }),
);
const readResult = await readFileTool.execute(readFileTool.parse({ path: "demo.txt" }));

console.log(`registered tools: ${tools.map((tool) => tool.name).join(", ")}`);
console.log(writeResult);
console.log(readResult);
