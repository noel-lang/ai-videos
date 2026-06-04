# Phase 5: Aus Chatbot wird Agent

Jetzt entscheidet das Modell zwischen finaler Antwort und Tool Call. Die Runtime fuehrt Tools aus und gibt echte Ergebnisse zurueck.

## Start

```sh
bun run phase:05 "Erstelle agent.txt, lies die Datei danach wieder und sag kurz, was drinsteht."
```

## NEU in dieser Phase: Agentischer Loop

Phase 4 hatte Tools, aber noch kein Modell, das sie selbst anfordert. Phase 5 verbindet Modell, Tools, Kontext und TUI in einem Loop:

```ts
for (let turn = 1; turn <= maxTurns; turn += 1) {
  const response = await client.responses.create({ input: toResponseInput(messages), tools });
  const calls = outputItems.filter((item) => item.type === "function_call");
  // Runtime fuehrt Tool aus und gibt function_call_output zurueck.
}
```

Das ist der Moment, ab dem wir sinnvoll von Agent sprechen koennen.

Additiv bedeutet hier:

- Phase 1 bleibt erhalten: Modellaufruf.
- Phase 2 bleibt erhalten: Kontext.
- Phase 3 bleibt erhalten: OpenTUI.
- Phase 4 bleibt erhalten: Tools.
- Neu dazu kommt: Das Modell darf selbst Tool Calls auswaehlen.

## Host-Notizen

Zeige im Code:

- `maxTurns` ist unser Stop-Kriterium.
- Das Modell kann `function_call` Items liefern.
- Die Runtime sucht das passende Tool und fuehrt es aus.
- Das Ergebnis geht als `function_call_output` mit gleicher `call_id` zurueck.
- Danach darf das Modell neu entscheiden: weiteres Tool oder finale Antwort.
- Fertig ist der Agent, wenn das Modell keine `function_call` Items mehr liefert.
- Falls das nicht passiert, beendet `maxTurns` den Loop kontrolliert.
- "Selbst denken" heisst hier technisch: Das Modell bekommt Ziel plus Tool-Feedback und waehlt den naechsten Schritt.

Guter Satz fuer die Moderation:

> Agentisch ist nicht der erste Tool Call, sondern der Loop: handeln, echtes Feedback bekommen, weiterentscheiden.

## Erwartetes Verhalten

Bei einem guten Demo-Prompt sieht man ungefaehr:

Die TUI zeigt ungefaehr:

- `status`: welcher Turn laeuft
- `tool call`: welches Tool das Modell will
- `tool result`: echtes Feedback aus der Umgebung
- `agent`: finale Antwort

Wenn ein Tool scheitert, sollte der Fehler wieder als Tool-Ergebnis in den Kontext gehen. Genau dadurch bekommt das Modell Ground Truth aus der Umgebung.
