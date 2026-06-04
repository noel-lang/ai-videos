import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, test } from "bun:test";

import { runAgent } from "../src/agent";
import { MockProvider } from "../src/model/mock-provider";
import { sanitizeResponseInputItem } from "../src/model/openai-provider";
import { fileTools, readFileTool, writeFileTool } from "../src/tools/files";

describe("file tools", () => {
  test("write_file and read_file stay inside the workspace", async () => {
    const workspaceDir = await mkdtemp(path.join(os.tmpdir(), "agent-poc-"));
    try {
      await writeFileTool.execute({ path: "hello.txt", content: "Hallo Agent" }, { workspaceDir });
      await expect(readFile(path.join(workspaceDir, "hello.txt"), "utf8")).resolves.toBe("Hallo Agent");
      await expect(readFileTool.execute({ path: "../secret.txt" }, { workspaceDir })).rejects.toThrow(
        "Path escapes workspace",
      );
    } finally {
      await rm(workspaceDir, { recursive: true, force: true });
    }
  });
});

describe("agent loop", () => {
  test("runs multiple tool calls before a final answer", async () => {
    const workspaceDir = await mkdtemp(path.join(os.tmpdir(), "agent-poc-"));
    try {
      const result = await runAgent({
        model: "mock-model",
        provider: new MockProvider(),
        tools: fileTools,
        toolContext: { workspaceDir },
        instructions: "Use tools when needed.",
        input: "Bitte schreib eine Datei und lies sie danach wieder.",
      });

      expect(result.text).toContain("Fertig");
      expect(result.messages.filter((message) => message.role === "tool")).toHaveLength(2);
      await expect(readFile(path.join(workspaceDir, "notizen/agent-demo.txt"), "utf8")).resolves.toContain(
        "Tool-Loop",
      );
    } finally {
      await rm(workspaceDir, { recursive: true, force: true });
    }
  });
});

describe("openai response replay", () => {
  test("removes SDK-only parsed fields before replaying output items as input", () => {
    const item = sanitizeResponseInputItem({
      type: "function_call",
      id: "fc_123",
      call_id: "call_123",
      name: "write_file",
      arguments: '{"path":"beispiel.txt","content":"Hallo"}',
      parsed_arguments: { path: "beispiel.txt", content: "Hallo" },
      content: [{ type: "output_text", text: "ok", parsed: { ignored: true } }],
    });

    expect(item).toEqual({
      type: "function_call",
      id: "fc_123",
      call_id: "call_123",
      name: "write_file",
      arguments: '{"path":"beispiel.txt","content":"Hallo"}',
      content: [{ type: "output_text", text: "ok" }],
    });
  });
});
