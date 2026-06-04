# Phase 2: Chat-Loop in der CLI

Jetzt behalten wir Nachrichten im Speicher und koennen fortlaufend schreiben.

## Start

```sh
bun run phase:02
```

Beenden:

```txt
/exit
```

## NEU in dieser Phase: Kontext

Phase 1 war ein einzelner Request. Phase 2 fuegt einen Loop und eine Nachrichtenliste hinzu:

```ts
const messages: Message[] = [];

while (true) {
  const text = await rl.question("you> ");
  messages.push({ role: "user", content: text });
  const response = await client.responses.create({ model, input: messages });
  messages.push({ role: "assistant", content: response.output_text });
}
```

Damit kann das Modell auf vorherige Nachrichten Bezug nehmen.

Additiv bedeutet hier:

- Phase 1 bleibt erhalten: Modellaufruf.
- Neu dazu kommt: Verlauf im Speicher.
- Noch nicht dabei: TUI, Tools, Agent-Loop.

## Host-Notizen

Zeige im Code:

- `readline/promises` ist nur die Eingabeschleife.
- `messages` ist unser einfacher In-Memory-Kontext.
- Jede User-Nachricht und jede Assistant-Antwort wird wieder in `messages` gelegt.

Guter Satz fuer die Moderation:

> Jetzt haben wir Chat. Aber Chat ist noch nicht Agentik, weil das Modell immer noch nur redet.

## Erwartetes Verhalten

Du kannst zwei Fragen nacheinander stellen und die zweite kann sich auf die erste beziehen. Es gibt aber noch keine Tools und keine Aktionen.
