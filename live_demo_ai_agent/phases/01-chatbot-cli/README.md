# Phase 1: Minimaler Chatbot

Einmal Eingabe, einmal Antwort. Noch kein Verlauf, keine Tools, kein Agent-Loop.

## Start

```sh
bun run phase:01 "Was ist ein KI-Agent in einem Satz?"
```

## Was ist neu?

Das ist der kleinste moegliche LLM-Durchstich:

```ts
const response = await client.responses.create({
  model,
  input,
});
```

Wir geben dem Modell Text und bekommen Text zurueck. Es gibt keine gespeicherte Unterhaltung und keine Verbindung zur Umwelt.

## Host-Notizen

Zeige im Code:

- `OpenAI` Client wird erstellt.
- `OPENAI_MODEL` kommt aus der Env.
- `process.argv.slice(2)` macht aus CLI-Argumenten den Prompt.
- `response.output_text` ist die fertige Antwort.

Guter Satz fuer die Moderation:

> Das ist noch kein Agent. Das ist nur: Prompt rein, Text raus.

## Erwartetes Verhalten

Die App beendet sich direkt nach der Antwort. Das ist absichtlich so, weil wir hier nur den Modellaufruf isolieren.
