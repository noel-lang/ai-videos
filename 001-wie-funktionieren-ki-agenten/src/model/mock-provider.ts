import type { ModelInput, ModelProvider, ModelStep } from "../types";

export class MockProvider implements ModelProvider {
  private turn = 0;

  async run(input: ModelInput): Promise<ModelStep[]> {
    this.turn += 1;
    const last = input.messages.at(-1)?.content ?? "";

    if (this.turn === 1 && /schreib|write|datei/i.test(last)) {
      return [
        {
          type: "tool_call",
          callId: "mock-call-1",
          name: "write_file",
          arguments: {
            path: "notizen/agent-demo.txt",
            content: "Ein Agent ist ein LLM in einem Tool-Loop.\n",
          },
        },
      ];
    }

    if (this.turn === 2) {
      return [
        {
          type: "tool_call",
          callId: "mock-call-2",
          name: "read_file",
          arguments: { path: "notizen/agent-demo.txt" },
        },
      ];
    }

    return [{ type: "final", text: "Fertig: Ich habe die Datei geschrieben und wieder gelesen." }];
  }
}
