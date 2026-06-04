// Diese Typen beschreiben Nachrichten, Provider und Tools.
import type { Message, ModelProvider, Tool } from "./types";

// AgentEvent ist alles, was die Session nach außen meldet. Die UI entscheidet
// später nur noch, wie diese Events angezeigt werden.
export type AgentEvent =
  | { type: "user"; text: string }
  | { type: "assistant_delta"; text: string }
  | { type: "assistant"; text: string }
  | { type: "tool_call"; name: string; arguments: unknown }
  | { type: "tool_result"; name: string; result: string }
  | { type: "tool_error"; name: string; error: string };

// AgentSession ist die Runtime des Agents. Hier liegt der Loop, nicht in der UI.
export class AgentSession {
  // messages ist der Verlauf. Er bleibt über mehrere Nutzereingaben hinweg erhalten.
  private readonly messages: Message[] = [];

  // Im constructor bekommt die Session alles, was sie zum Arbeiten braucht:
  // Modell, Provider, Tools, Workspace und Stop-Kriterium.
  constructor(
    private readonly options: {
      model: string;
      instructions: string;
      provider: ModelProvider;
      tools: Tool<unknown>[];
      workspaceDir: string;
      maxTurns: number;
    },
  ) {}

  // reset leert den Verlauf. In der UI hängt das an /clear.
  reset(): void {
    this.messages.length = 0;
  }

  // ask verarbeitet eine neue Nutzerfrage.
  async ask(text: string, emit: (event: AgentEvent) => void): Promise<void> {
    // Zuerst speichern wir die Nutzerfrage im Verlauf.
    this.messages.push({ role: "user", content: text });

    // Dann melden wir sie an die UI.
    emit({ type: "user", text });

    // Das ist der agentische Loop: Modell fragen, Tools ausführen, Ergebnisse
    // zurückgeben, wieder Modell fragen, bis eine finale Antwort kommt.
    for (let turn = 0; turn < this.options.maxTurns; turn += 1) {
      // Ein Provider-Schritt liefert entweder finalen Text oder Tool Calls.
      const steps = await this.options.provider.run({
        model: this.options.model,
        instructions: this.options.instructions,
        messages: this.messages,
        tools: this.options.tools,
        onTextDelta: (delta) => emit({ type: "assistant_delta", text: delta }),
      });

      // Wir schauen, ob das Modell fertig ist.
      const final = steps.find((step) => step.type === "final");

      // Wenn es eine finale Antwort gibt, speichern und senden wir sie.
      if (final?.type === "final") {
        this.messages.push({ role: "assistant", content: final.text });
        emit({ type: "assistant", text: final.text });
        return;
      }

      // Wenn keine finale Antwort da ist, prüfen wir alle Tool Calls.
      for (const step of steps) {
        // Andere Step-Typen ignorieren wir hier.
        if (step.type !== "tool_call") continue;

        // Tool Call sichtbar an die UI melden.
        emit({ type: "tool_call", name: step.name, arguments: step.arguments });

        // Tool Call in den Verlauf schreiben, damit OpenAI ihn im nächsten Request kennt.
        this.messages.push({ role: "assistant", content: `Tool call: ${step.name}`, item: step.item });

        // Das angeforderte Tool in unserer Tool-Liste suchen.
        const tool = this.options.tools.find((candidate) => candidate.name === step.name);

        // Wenn das Modell ein unbekanntes Tool anfordert, geben wir diesen Fehler
        // zurück ins Modell, statt die App hart zu beenden.
        if (!tool) {
          await this.pushToolError(step.callId, step.name, `Unknown tool: ${step.name}`, emit);
          continue;
        }

        try {
          // Tool-Argumente validieren, Tool ausführen, echtes Ergebnis bekommen.
          const result = await tool.execute(tool.schema.parse(step.arguments), { workspaceDir: this.options.workspaceDir });

          // Tool-Ergebnis als function_call_output speichern. call_id verbindet
          // dieses Ergebnis mit dem ursprünglichen Tool Call.
          this.messages.push({
            role: "tool",
            content: result,
            item: { type: "function_call_output", call_id: step.callId, output: result },
          });

          // Tool-Ergebnis sichtbar an die UI melden.
          emit({ type: "tool_result", name: step.name, result });
        } catch (error) {
          // Auch Tool-Fehler sind Feedback aus der Umgebung.
          await this.pushToolError(step.callId, step.name, error instanceof Error ? error.message : String(error), emit);
        }
      }
    }

    // Wenn maxTurns erreicht ist, stoppen wir kontrolliert.
    emit({ type: "assistant", text: `Stopped after ${this.options.maxTurns} turns.` });
  }

  // Diese Hilfsfunktion schreibt Tool-Fehler in Verlauf und UI.
  private async pushToolError(
    callId: string,
    name: string,
    error: string,
    emit: (event: AgentEvent) => void,
  ): Promise<void> {
    // Fehler werden wie Tool-Ergebnisse behandelt, weil das Modell daraus lernen
    // kann: Pfad falsch, Tool unbekannt, Datei fehlt, usw.
    this.messages.push({
      role: "tool",
      content: error,
      item: { type: "function_call_output", call_id: callId, output: error },
    });

    // Zusätzlich zeigen wir den Fehler in der UI.
    emit({ type: "tool_error", name, error });
  }
}
