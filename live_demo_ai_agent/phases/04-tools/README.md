# Phase 4: Tools definieren

Hier gibt es noch keinen Agenten. Wir definieren nur Werkzeuge, die spaeter vom Modell angefordert werden koennen.

## Start

```sh
bun run phase:04
```

## NEU in dieser Phase: Tools

Wir behalten die OpenTUI-Oberflaeche aus Phase 3 und fuegen Werkzeuge hinzu. Ein Tool ist bei uns ein kleines Objekt:

```ts
type Tool<TArgs> = {
  name: string;
  description: string;
  jsonSchema: Record<string, unknown>;
  parse(args: unknown): TArgs;
  execute(args: TArgs): Promise<string>;
};
```

Das ist didaktisch der wichtigste Shift: Das Modell schreibt keine Datei. Unsere Runtime schreibt sie.

Additiv bedeutet hier:

- Phase 1 bleibt erhalten: Modellaufruf.
- Phase 2 bleibt erhalten: Kontext.
- Phase 3 bleibt erhalten: OpenTUI.
- Neu dazu kommt: Tool-Definitionen und manuelle Tool-Demo.
- Noch nicht dabei: Das Modell entscheidet noch nicht selbst, welches Tool es nutzt.

## Host-Notizen

Zeige im Code:

- Ein Tool ist Name, Beschreibung, JSON Schema und `execute`.
- Das Modell fuehrt nichts selbst aus.
- Die Runtime validiert Argumente und schuetzt den Workspace.
- `resolveWorkspacePath` verhindert absolute Pfade und `..` aus dem Workspace heraus.
- `zod` validiert die Tool-Argumente, bevor etwas ausgefuehrt wird.

Guter Satz fuer die Moderation:

> Tools sind keine Magie. Tools sind Funktionen mit Vertrag.

## Erwartetes Verhalten

Die TUI oeffnet sich. Du kannst normal chatten oder die Tool-Demo manuell ausloesen:

```txt
/tools
/write-demo
/read-demo
```

Das ist noch nicht agentisch, weil der Mensch diese Tool-Befehle ausloest.
