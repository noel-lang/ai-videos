# Live Demo: Wie funktionieren KI-Agenten?

Dieses Projekt ist die Vorlage fuer ein 12-15 Minuten YouTube-Video. Ziel ist ein sehr einfacher, einsteigerfreundlicher Durchstich: Wir gehen von einem normalen Chatbot aus und landen Schritt fuer Schritt bei einem kleinen KI-Agenten.

Die sechs Ordner unter `phases/` sind bewusst als Code-Snapshots gebaut. Man kann im Video pro Phase in einen Ordner springen und genau zeigen, was technisch neu dazugekommen ist.

## Start

```sh
bun install
bun run phase:01 "Was ist ein KI-Agent in einem Satz?"
bun run phase:04
bun run phase:06
```

Fuer echte Modellaufrufe braucht das Projekt eine `.env`:

```sh
cp .env.example .env
```

Beim lokalen Arbeiten wird zusaetzlich `~/DevTools/repos/plattform.env` als Fallback gelesen. Im Repo landet aber nur `.env.example`.

## Die sechs Code-Phasen

| Phase | Ordner | Kernidee |
| --- | --- | --- |
| 1 | `phases/01-chatbot-cli` | Einmal Eingabe, einmal Modellantwort |
| 2 | `phases/02-chat-loop-cli` | Verlauf im Speicher, interaktiver Chat |
| 3 | `phases/03-opentui-chat` | Gleicher Chat, aber als Terminal-UI |
| 4 | `phases/04-tools` | Tools als Name, Beschreibung, Schema, Execute |
| 5 | `phases/05-agent-loop` | Action -> Feedback -> Stop mit echten Tool Results |
| 6 | `phases/06-provider-streaming` | Provider-Pattern, Streaming, Markdown, Response-Item-Fix |

Phase 6 ist der Zielzustand fuer das Video. Die vorherigen Phasen sind nicht als perfekte Produktarchitektur gedacht, sondern als erklaerbare Zwischenstaende.

## Ziel des Videos

Zuschauer sollen am Ende verstehen:

- Ein Chatbot ist erstmal nur: Eingabe rein, Modellantwort raus.
- Ein interaktiver Chat ist noch nicht automatisch ein Agent.
- Ein Agent entsteht, wenn das Modell Tools nutzen kann und in einem Loop aus **Action -> Feedback -> Stop** arbeitet.
- Die technische Umsetzung ist oft simpel: Modell, Nachrichtenhistorie, Tools, Tool-Ergebnisse, maximale Iterationen.
- Das Spannende ist nicht Magie, sondern die Runtime um das Modell herum.

## Kernbotschaft

Ein KI-Agent ist ein LLM, das Werkzeuge nutzen darf und auf echtes Feedback aus seiner Umgebung reagiert.

Wichtig fuer die Erklaerung:

- Das Modell hat keine Haende.
- Tools sind die Haende.
- Tool-Ergebnisse sind Ground Truth.
- Der Loop macht es agentisch.
- Ein Stop-Kriterium haelt das System kontrollierbar.

## Scope

Wir bauen nur lokal:

- Bun
- TypeScript
- OpenAI SDK
- OpenTUI fuer die interaktive CLI
- lokale File-Tools

Nicht Teil dieses Videos:

- Discord
- Datenbank
- Auth-System
- Multi-User
- Docker-Sandbox
- komplexe Planner
- RAG
- Subagents

## Verhalten der finalen Demo

Die finale Demo soll sich so anfuehlen:

- Start mit genau einem Befehl: `bun start`
- Terminal-UI oeffnet sich direkt
- User kann fortlaufend schreiben
- Antworten streamen sichtbar von Anfang an
- Keine sichtbaren `system`-Nachrichten
- Keine sichtbaren `thinking`-Nachrichten
- Tool Calls sind sichtbar und klar erklaerbar
- Tool Ergebnisse sind sichtbar
- Markdown wird einfach gerendert:
  - bold
  - italic
  - inline code
  - fenced code blocks
- Fettgedruckte Markdown-Elemente werden in einem schoenen Pastellton dargestellt
- `/clear` leert UI und Kontext
- `/exit` beendet die App

## Code-Anforderungen

Der Code soll absichtlich einfach und erklaerbar sein.

Wichtige Prinzipien:

- Kleine Dateien
- Klare Namen
- Keine Framework-Magie
- Wenig Abstraktion
- Keine cleveren generischen Typ-Monster
- Kommentare nur dort, wo sie beim Erklaeren helfen
- Der Code soll im Video gut vorgelesen und gezeigt werden koennen

Gewuenschte Bausteine:

- `model-provider`: kapselt OpenAI Responses API
- `agent-session`: haelt Nachrichtenhistorie und Agent-Loop
- `tools`: definiert `read_file`, `write_file`, optional `list_files`
- `tui`: zeigt Chat, Streaming, Tool Calls und Tool Results
- `env`: laedt Modell und API-Key aus `.env`

## Phase 1: Minimaler Chatbot

Ziel:

Ein Programm, das einmalig eine Eingabe an das Modell sendet und eine Antwort ausgibt.

Anforderungen:

- Bun-Projekt initialisieren
- `.env` fuer `OPENAI_API_KEY` und `OPENAI_MODEL`
- Ein CLI-Befehl, z.B.:

```bash
bun run chat "Was ist ein KI-Agent in einem Satz?"
```

- Ausgabe ist nur Text
- Noch keine TUI
- Noch keine Tools
- Noch kein Agent-Loop

Erklaerpunkt:

Das ist ein Chatbot, kein Agent. Das Modell generiert nur Text.

## Phase 2: Interaktive CLI / TUI

Ziel:

Aus Eingabe -> Ausgabe wird ein fortlaufender Chat.

Anforderungen:

- OpenTUI verwenden
- `bun start` startet direkt die TUI
- User kann Nachricht eingeben und Enter druecken
- Antwort wird in der UI angezeigt
- Nachrichtenhistorie wird im Speicher gehalten
- Antwort soll streamen
- Keine sichtbaren System- oder Thinking-Zeilen
- `/clear`
- `/exit`

Erklaerpunkt:

Jetzt haben wir eine bessere Chat-Oberflaeche. Aber auch das ist noch nicht automatisch ein Agent.

## Phase 3: Tools definieren

Ziel:

Das Modell bekommt klar dokumentierte Werkzeuge.

Erste Tools:

- `write_file`
- `read_file`
- optional `list_files`

Anforderungen:

- Tools haben:
  - Name
  - Beschreibung
  - JSON Schema
  - `execute` Funktion
- Tools duerfen nur in einem lokalen `workspace/` arbeiten
- Keine absoluten Pfade
- Kein `..` aus dem Workspace heraus
- Tool Calls werden in der UI sichtbar angezeigt
- Tool Results werden in der UI sichtbar angezeigt

Erklaerpunkt:

Das Modell schreibt keine Datei. Es bittet die Runtime, das Tool aufzurufen. Unsere Runtime entscheidet und fuehrt aus.

## Phase 4: Aus Chatbot wird Agent

Ziel:

Der Agent kann mehrstufig arbeiten.

Agentischer Loop:

1. User gibt Ziel
2. Modell entscheidet: final antworten oder Tool call
3. Runtime fuehrt Tool aus
4. Tool Result geht zurueck ans Modell
5. Modell bewertet naechsten Schritt
6. Loop wiederholt sich
7. Stop bei finaler Antwort oder `maxTurns`

Anforderungen:

- `maxTurns` als Stop-Kriterium
- Tool-Ergebnisse muessen wieder in den Modellkontext
- Mehrere Tool Calls in einer Aufgabe muessen moeglich sein
- Beispiel muss bewusst mehrstufig sein:

```txt
Erstelle eine Datei agent.txt mit einer kurzen Erklaerung, lies sie danach wieder und fasse zusammen, was drinsteht.
```

Erwarteter Ablauf:

- `write_file`
- Tool Result: Datei geschrieben
- `read_file`
- Tool Result: Dateiinhalt
- finale Antwort

Erklaerpunkt:

Ab hier ist es agentisch: Das Modell handelt, bekommt Feedback aus der Umgebung und entscheidet weiter.

## Phase 5: Fehler und Ground Truth

Ziel:

Zeigen, warum Tool-Ergebnisse und Fehler wichtig sind.

Anforderungen:

- Wenn ein Tool fehlschlaegt, wird der Fehler als Tool Result zurueck ans Modell gegeben
- Der Agent darf darauf reagieren
- Beispiel:

```txt
Lies eine Datei, die es noch nicht gibt, und repariere das Problem sinnvoll.
```

Moeglicher Ablauf:

- `read_file` schlaegt fehl
- Fehler geht zurueck ans Modell
- Modell erstellt die Datei oder erklaert den Blocker
- finale Antwort

Erklaerpunkt:

Agenten arbeiten nicht blind. Sie brauchen Ground Truth aus der Umgebung, um Fortschritt zu bewerten.

## Phase 6: Polishing fuer Video

Ziel:

Die Demo soll ruhig, lesbar und nicht ueberladen sein.

Anforderungen:

- Markdown Rendering:
  - bold
  - italic
  - inline code
  - code fences
- Bold in Pastellton
- Tool Calls kompakt, aber sichtbar
- Keine Tabellen notwendig
- Keine sichtbaren System-Prompts
- Keine sichtbaren Thinking-Nachrichten
- Header mit Modellname
- Input unten
- Chat/Log oben

Erklaerpunkt:

Die UI soll beim Verstehen helfen, nicht vom Kern ablenken.

## Spannungsbogen fuer 12-15 Minuten

### 0:00-1:00 Problem

"Alle reden von KI-Agenten. Klingt nach Magie. Ist technisch aber viel greifbarer."

Zeigen:

- Zielbild: kleine Terminal-App
- These: Agent = LLM + Tools + Feedback Loop

### 1:00-3:00 Chatbot

Baue:

- Einmalige Anfrage an Modell

Erklaeren:

- `input`
- `instructions`
- Modell antwortet
- Noch kein Agent

### 3:00-5:00 Interaktiver Chat

Baue:

- TUI
- Eingabe/Ausgabe
- Streaming

Erklaeren:

- Conversation History
- UI ist nur Transport
- Noch immer kein Agent

### 5:00-8:00 Tools

Baue:

- `read_file`
- `write_file`
- Tool Schema

Erklaeren:

- Das Modell sieht Tool-Beschreibung und Schema
- Runtime fuehrt Tool aus
- Tool-Result kommt zurueck

### 8:00-11:00 Agent Loop

Baue:

- Mehrere Turns
- Tool Result zurueck ins Modell
- `maxTurns`

Demo:

- Datei schreiben
- Datei lesen
- final antworten

Erklaeren:

- Action
- Feedback
- Stop

### 11:00-13:00 Fehlerbehandlung

Baue oder zeige:

- Tool Fehler wird Modellkontext
- Agent kann reagieren

Erklaeren:

- Ground Truth
- Recovery
- Warum Agenten mehr sind als reine Textgeneratoren

### 13:00-15:00 Zusammenfassung

Takeaways:

- Chatbot: Text rein, Text raus
- Agent: Ziel rein, Aktionen mit Feedback, Stop
- Tools muessen klar beschrieben sein
- Ein einfacher Agent braucht nicht viel Code
- Komplexitaet entsteht durch Sicherheit, Permissions, Sandboxing, Multi-User, Integrationen

## Definition fuer das Video

Arbeitsdefinition:

> Ein KI-Agent ist ein LLM, das in einem kontrollierten Loop Werkzeuge nutzt, Feedback aus der Umgebung bekommt und eigenstaendig mehrere Schritte bis zu einem Stop-Kriterium ausfuehrt.

Kurze Formel:

```txt
Agent = Model + Instructions + Tools + Memory + Loop + Stop
```

## Gute Demo-Prompts

Einfach:

```txt
Erklaere in zwei Saetzen, was ein KI-Agent ist.
```

Markdown:

```txt
Antworte mit **einem fettgedruckten Satz**, *einem kursiven Satz* und einem kurzen TypeScript-Codeblock.
```

Tool:

```txt
Erstelle eine Datei agent.txt mit einer kurzen Erklaerung, lies sie danach wieder und fasse den Inhalt zusammen.
```

Fehler:

```txt
Lies missing.txt. Wenn das nicht klappt, erstelle die Datei mit einem sinnvollen Inhalt und lies sie danach nochmal.
```

Mehrstufig:

```txt
Erstelle eine kleine Notiz ueber KI-Agenten, lies sie, verbessere sie und gib mir am Ende die finale Version aus.
```

## Was der Code am Ende zeigen soll

Beim Code-Walkthrough sollen diese Stellen leicht erklaerbar sein:

- Wo die OpenAI-Anfrage passiert
- Wo Streaming-Deltas an die UI gehen
- Wo Tools definiert werden
- Wo Tool Calls erkannt werden
- Wo Tool Results zurueck in den Kontext gehen
- Wo der Loop stoppt
- Warum `maxTurns` wichtig ist

## Akzeptanzkriterien

Die finale Demo ist fertig, wenn:

- `bun start` die TUI startet
- Modell und Provider aus `.env` kommen
- Antworten streamen
- Kein `system` und kein `thinking` im Chat sichtbar sind
- Markdown grundlegend gerendert wird
- `write_file` und `read_file` funktionieren
- Tool Calls und Tool Results sichtbar sind
- Eine Aufgabe mit mindestens zwei Tool-Schritten funktioniert
- Fehler aus Tools als Feedback in den Agent-Loop gehen
- Der Code fuer Einsteiger in 5 Minuten erklaerbar ist
