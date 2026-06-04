# Phase 6: Saubere Architektur mit Provider, Streaming und TUI

Das ist der Zielzustand fuer die Demo.

## Start

```sh
bun run phase:06
```

Beenden:

```txt
/exit
```

Kontext loeschen:

```txt
/clear
```

## Unterschied zu Phase 5

Phase 5 war absichtlich eine Datei mit allem drin. Phase 6 trennt die Verantwortlichkeiten:

- `types.ts`: gemeinsame Contracts fuer Provider, Tools und Messages.
- `tools.ts`: lokale File-Tools mit Workspace-Schutz.
- `provider.ts`: OpenAI Responses API, Streaming und Response-Item-Sanitizer.
- `agent-session.ts`: Agent-Loop mit `maxTurns`.
- `index.ts`: OpenTUI-Oberflaeche.

## Code-Anker fuer das Video

Provider-Pattern:

```ts
export type ModelProvider = {
  run(input: ModelInput): Promise<ModelStep[]>;
};
```

Dadurch ist der Agent-Loop nicht direkt an OpenAI gebunden. Discord, CLI oder TUI sind ebenfalls nur Adapter-Ideen um dieselbe Session.

Streaming:

```ts
if (event.type === "response.output_text.delta") {
  streamedText += event.delta;
  input.onTextDelta?.(streamedText);
}
```

Die UI wartet nicht auf die finale Antwort, sondern rendert laufend den aktuellen Text.

Response-Item-Fix:

```ts
if (key === "parsed_arguments" || key === "parsed" || key === "output_parsed") continue;
```

Das OpenAI SDK haengt an Tool Calls interne Felder wie `parsed_arguments`. Diese Felder duerfen nicht wieder als `input` an die Responses API gesendet werden. Deshalb bereinigt `sanitizeResponseItem` alle SDK-only Felder, bevor die Session das Item speichert.

## Host-Notizen

Zeige im Code:

- `AgentSession` ist die Runtime: Verlauf, Tool-Ausfuehrung, Stop-Kriterium.
- `OpenAiProvider` ist nur Modellzugriff plus API-spezifisches Mapping.
- `index.ts` ist nur UI: Events rein, Markdown raus.
- Tool Calls und Tool Results sind sichtbar, aber `system` und `thinking` nicht.
- Fettgedrucktes Markdown ist pastel eingefaerbt.

Guter Satz fuer die Moderation:

> Die finale Architektur ist nicht kompliziert. Sie trennt nur Modell, Agent-Loop, Tools und UI sauber voneinander.

## Erwartetes Verhalten

Die TUI startet mit `bun run phase:06`. Ein Prompt wie dieser sollte mehrstufig laufen:

```txt
Erstelle demo.txt mit einer kurzen Agent-Erklaerung, lies sie danach wieder und fasse den Inhalt zusammen.
```

Man sollte Tool Call, Tool Result und danach eine finale Antwort sehen.
