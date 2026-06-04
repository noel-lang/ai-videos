// Das OpenAI SDK spricht mit dem Modell.
import OpenAI from "openai";

// OpenTUI ist unsere Terminal-UI-Bibliothek. Damit bauen wir Textflächen,
// Eingabefelder und Layout direkt im Terminal.
import {
  BoxRenderable,
  createCliRenderer,
  InputRenderable,
  InputRenderableEvents,
  ScrollBoxRenderable,
  TextRenderable,
} from "@opentui/core";

// Diese Helfer lesen API-Key und Modellname aus der Umgebung.
import { readConfig, requireConfig } from "../../shared/env";

// Eine Chat-Nachricht hat eine Rolle und Textinhalt.
type Message = { role: "user" | "assistant"; content: string };

// Der OpenAI Client ist unsere Verbindung zum Modell.
const client = new OpenAI({ apiKey: requireConfig("OPENAI_API_KEY") });

// Das Modell bleibt konfigurierbar.
const model = readConfig("OPENAI_MODEL", "gpt-5.4-mini");

// messages ist weiter unser Chat-Gedächtnis.
const messages: Message[] = [];

// lines sind die sichtbaren Zeilen in der Terminal-UI.
const lines: string[] = [];

// NEU in Phase 3: Eine echte Terminal-Oberfläche. Der Renderer ist die
// Zeichenmaschine von OpenTUI. consoleMode disabled heißt:
// normale console.log-Ausgaben stören unsere UI nicht.
const renderer = await createCliRenderer({
  // Beim Beenden soll das Terminal wieder aufgeräumt werden.
  clearOnShutdown: true,

  // Ctrl+C beendet die App.
  exitOnCtrlC: true,

  // Wir nutzen die Konsole als UI-Fläche, nicht für Logs.
  consoleMode: "disabled",
});

// column bedeutet: Elemente werden untereinander angeordnet.
renderer.root.flexDirection = "column";

// Der log-Bereich ist der große Chat-Verlauf oben.
const log = new ScrollBoxRenderable(renderer, {
  // id ist nur ein Name für diese UI-Komponente.
  id: "log",

  // flexGrow: 1 bedeutet: Dieser Bereich nimmt den freien Platz ein.
  flexGrow: 1,

  // border zeichnet einen Rahmen.
  border: true,

  // paddingX gibt links und rechts etwas Innenabstand.
  paddingX: 1,

  // scrollY erlaubt vertikales Scrollen.
  scrollY: true,

  // stickyScroll hält den Verlauf unten, wenn neue Nachrichten dazukommen.
  stickyScroll: true,
  stickyStart: "bottom",
});

// TextRenderable ist ein einfaches Textfeld. Dort schreiben wir den Chatverlauf rein.
const textView = new TextRenderable(renderer, {
  id: "text",
  content: "",
  width: "100%",
});

// Das Textfeld liegt im Scrollbereich.
log.content.add(textView);

// footer ist der untere Bereich für die Eingabe.
const footer = new BoxRenderable(renderer, {
  id: "footer",
  height: 3,
  border: true,
  paddingX: 1,
});

// input ist das Textfeld, in das der Nutzer seine Nachricht tippt.
const input = new InputRenderable(renderer, {
  id: "input",
  placeholder: "Nachricht schreiben. /exit beendet.",
  width: "100%",
});

// Das Eingabefeld wird in den Footer gelegt.
footer.add(input);

// Jetzt hängen wir Log und Footer an die Root-Fläche.
renderer.root.add(log);
renderer.root.add(footer);

// renderer.start() startet die Terminal-UI.
renderer.start();

// Fokus bedeutet: Der Cursor ist direkt im Eingabefeld.
input.focus();
renderer.focusRenderable(input);

// Wenn der Nutzer Enter drückt, geben wir den Text an handleInput weiter.
input.on(InputRenderableEvents.ENTER, (raw: string) => {
  // void heißt: Wir starten die async Funktion, ohne hier auf das Promise zu warten.
  void handleInput(raw);
});

// Diese Funktion verarbeitet eine einzelne Nutzereingabe.
async function handleInput(raw: string): Promise<void> {
  // trim entfernt Leerzeichen außen.
  const userText = raw.trim();

  // Nach Enter leeren wir das Eingabefeld.
  input.value = "";

  // /exit beendet die App.
  if (userText === "/exit") process.exit(0);

  // Leere Eingaben ignorieren wir.
  if (!userText) return;

  // Die Nutzereingabe wird zuerst im sichtbaren Chat angezeigt.
  append(`you\n${userText}`);

  // Dann speichern wir sie im Modellverlauf.
  messages.push({ role: "user", content: userText });

  // Auch in der TUI bleibt es ein normaler Chatbot-Request: bisherige Messages rein,
  // Antwort raus, danach rendern wir die Antwort nur schöner im Terminal.
  const response = await client.responses.create({
    model,
    input: messages,
  });

  // Die Modellantwort wird ebenfalls Teil des Verlaufs.
  messages.push({ role: "assistant", content: response.output_text });

  // Und sie wird sichtbar in die UI geschrieben.
  append(`agent\n${response.output_text}`);
}

// append fügt eine neue sichtbare Chat-Zeile hinzu.
function append(line: string): void {
  // Neue Zeile in den Speicher der UI legen.
  lines.push(line);

  // Alle Zeilen als Text zusammenbauen.
  textView.content = lines.join("\n\n");

  // OpenTUI bitten, die Oberfläche neu zu zeichnen.
  renderer.requestRender();
}
