# Phase 6: Saubere Architektur mit Provider, Streaming und TUI

Das ist der Zielzustand fuer die Demo.

Start:

```sh
bun run phase:06
```

Architektur:

- `types.ts`: gemeinsame Contracts fuer Provider, Tools und Messages.
- `tools.ts`: lokale File-Tools mit Workspace-Schutz.
- `provider.ts`: OpenAI Responses API, Streaming und Response-Item-Sanitizer.
- `agent-session.ts`: Agent-Loop mit `maxTurns`.
- `index.ts`: OpenTUI-Oberflaeche.

Wichtigster Fix aus der Implementierung: Das OpenAI SDK haengt an Tool Calls interne Felder wie `parsed_arguments`.
Diese Felder duerfen nicht wieder als `input` an die Responses API gesendet werden. Deshalb bereinigt `sanitizeResponseItem`
alle SDK-only Felder, bevor die Session das Item speichert.
