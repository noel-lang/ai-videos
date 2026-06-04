# Phase 4: Tools definieren

Hier gibt es noch keinen Agenten. Wir definieren nur Werkzeuge, die spaeter vom Modell angefordert werden koennen.

Start:

```sh
bun run phase:04
```

Erklaerpunkte:

- Ein Tool ist Name, Beschreibung, JSON Schema und `execute`.
- Das Modell fuehrt nichts selbst aus.
- Die Runtime validiert Argumente und schuetzt den Workspace.
