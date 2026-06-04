import path from "node:path";

export function resolveWorkspacePath(workspaceDir: string, relativePath: string): string {
  if (path.isAbsolute(relativePath)) {
    throw new Error("Absolute paths are not allowed");
  }

  const workspaceRoot = path.resolve(workspaceDir);
  const fullPath = path.resolve(workspaceRoot, relativePath);
  const relative = path.relative(workspaceRoot, fullPath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Path escapes workspace");
  }

  return fullPath;
}
