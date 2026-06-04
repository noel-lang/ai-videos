# Phase 4: Tools definieren

Hier gibt es noch keinen Agenten. Wir definieren nur Werkzeuge, die spaeter vom Modell angefordert werden koennen.

## Start

```sh
bun run phase:04
```

## Unterschied zu Phase 3

Wir schauen noch nicht auf UI, sondern auf die Haende des Agents. Ein Tool ist bei uns ein kleines Objekt:

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

Das Programm ruft `write_file` und `read_file` noch manuell auf. In der Ausgabe sieht man die registrierten Tools, das Schreibresultat und den gelesenen Dateiinhalt.
