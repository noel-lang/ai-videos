# Phase 5: Aus Chatbot wird Agent

Jetzt entscheidet das Modell zwischen finaler Antwort und Tool Call. Die Runtime fuehrt Tools aus und gibt echte Ergebnisse zurueck.

Start:

```sh
bun run phase:05 "Erstelle agent.txt, lies die Datei danach wieder und sag kurz, was drinsteht."
```

Erklaerpunkt: Agentisch wird es durch den Loop aus **Action -> Feedback -> Stop**.
