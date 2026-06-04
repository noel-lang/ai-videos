# Phase 3: OpenTUI als Oberflaeche

Die Logik bleibt ein Chat. Neu ist nur die bessere Terminal-UI.

## Start

```sh
bun run phase:03
```

Beenden:

```txt
/exit
```

## Unterschied zu Phase 2

Der Chat-Loop bleibt gleich. Wir ersetzen nur die rohe CLI durch eine Terminal-Oberflaeche:

```ts
const renderer = await createCliRenderer({ consoleMode: "disabled" });
const input = new InputRenderable(renderer, { placeholder: "Nachricht schreiben..." });
const log = new ScrollBoxRenderable(renderer, { stickyScroll: true });
```

Das ist wichtig fuer das Video: Eine schoene UI macht noch keinen Agenten.

## Host-Notizen

Zeige im Code:

- `renderer.root.flexDirection = "column"` baut das Layout.
- `ScrollBoxRenderable` ist der Chat-Verlauf.
- `InputRenderableEvents.ENTER` startet den Modellaufruf.
- Die Nachrichtenhistorie ist weiter nur `messages`.

Guter Satz fuer die Moderation:

> Wir haben jetzt ein Interface, aber die Architektur ist immer noch Chatbot: Eingabe, Modell, Ausgabe.

## Erwartetes Verhalten

Die TUI oeffnet sich, du kannst schreiben, Enter druecken und eine Antwort erscheint im Log. `/exit` beendet die App.
