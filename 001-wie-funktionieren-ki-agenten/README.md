# 001 - Wie funktionieren KI-Agenten?

Ein kleiner Bun-POC, der einen KI-Agenten ohne Framework-Magie zeigt:

- ein Agent-Loop
- ein Model-Provider fuer OpenAI Responses API
- ein Mock-Provider fuer reproduzierbare Tests
- simple Tools: `read_file`, `write_file`, `list_files`
- ein lokaler Workspace, damit Tools nicht beliebig auf dem Rechner schreiben

## Messages vs. Responses API

Chat Completions nutzt klassisch:

```ts
await client.chat.completions.create({
  model: "gpt-5.5",
  messages: [
    { role: "system", content: "You are helpful." },
    { role: "user", content: "Hello!" },
  ],
});
```

Die neuere Responses API nutzt:

```ts
await client.responses.create({
  model: "gpt-5.5",
  instructions: "You are helpful.",
  input: "Hello!",
});
```

Sie kann aber auch eine Message-Liste in `input` aufnehmen. Wichtig fuer Agents:
Die Antwort ist kein einzelnes `message`, sondern `output` Items, z.B. `message`
oder `function_call`.

## Tool Calls als Loop

Ein Tool-Call ist zweiteilig:

1. Das Modell gibt ein `function_call` Item aus.
2. Unsere Runtime fuehrt das Tool aus und gibt ein `function_call_output` Item mit derselben `call_id` zurueck.

Vereinfacht:

```ts
const response = await client.responses.create({
  model: "gpt-5.4-mini",
  instructions: "Du bist ein kleiner Agent.",
  input: [{ role: "user", content: "Schreib demo.txt" }],
  tools: [
    {
      type: "function",
      name: "write_file",
      description: "Write a file inside the workspace.",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
          content: { type: "string" },
        },
        required: ["path", "content"],
        additionalProperties: false,
      },
    },
  ],
});

const call = response.output.find((item) => item.type === "function_call");
const result = await writeFileTool.execute(JSON.parse(call.arguments), context);

const next = await client.responses.create({
  model: "gpt-5.4-mini",
  instructions: "Du bist ein kleiner Agent.",
  input: [
    { role: "user", content: "Schreib demo.txt" },
    call,
    { type: "function_call_output", call_id: call.call_id, output: result },
  ],
  tools,
});
```

Das ist der Kern eines Agents: Modell fragt nach einer Aktion, Runtime fuehrt sie
aus, Ergebnis geht zurueck ins Modell, bis eine finale Antwort kommt.

## Lokal laufen lassen

Direktstart:

```bash
bun start
```

Die Defaults stehen in `.env`:

```env
AGENT_PROVIDER=openai
OPENAI_MODEL=gpt-5.4-mini
```

```bash
bun run demo
```

Ohne API-Key laeuft der Mock-Provider.

Live mit OpenAI:

```bash
OPENAI_MODEL=gpt-5.4-mini bun run demo:live
```

Interaktive TUI:

```bash
bun run tui
```

Die TUI nutzt automatisch OpenAI, wenn ein `OPENAI_API_KEY` gefunden wird.
Reproduzierbar ohne API:

```bash
bun run tui:mock
```

Commands in der TUI:

- `/clear` leert Anzeige und Session-Kontext
- `/exit` beendet die TUI

Der Loader sucht `OPENAI_API_KEY` in:

- aktueller Environment
- `.env` im Projekt
- `~/DevTools/repos/plattform.env`
- `~/DevTools/repos/plattform/.env`

## Tests

```bash
bun test
bun run typecheck
```
