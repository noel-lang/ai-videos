// readline ist die eingebaute Node/Bun-Funktion für Texteingabe im Terminal.
// Damit können wir den Nutzer immer wieder nach einer Nachricht fragen.
import { createInterface } from "node:readline/promises";

// Das OpenAI SDK spricht mit dem Modell.
import OpenAI from "openai";

// Diese Helfer lesen API-Key und Modellname aus der Umgebung.
import { readConfig, requireConfig } from "../../shared/env";

// Eine Message ist eine einzelne Chat-Nachricht. role sagt, von wem sie kommt:
// user ist der Mensch, assistant ist das Modell.
type Message = { role: "user" | "assistant"; content: string };

// Der API-Client ist die Verbindung zum Modell.
const client = new OpenAI({ apiKey: requireConfig("OPENAI_API_KEY") });

// Der Modellname bleibt konfigurierbar, damit man ihn nicht im Code ändern muss.
const model = readConfig("OPENAI_MODEL", "gpt-5.4-mini");

// Diese Liste ist unser Chat-Gedächtnis. Jede neue Anfrage bekommt den bisherigen
// Verlauf mit, damit das Modell auf vorherige Nachrichten Bezug nehmen kann.
const messages: Message[] = [];

// rl steht für "readline interface". Es verbindet unsere Terminal-Eingabe
// process.stdin mit der Terminal-Ausgabe process.stdout.
const rl = createInterface({
  // stdin ist das, was der Mensch eintippt.
  input: process.stdin,

  // stdout ist das, was unser Programm ins Terminal schreibt.
  output: process.stdout,
});

// Eine kleine Startnachricht, damit der Nutzer weiß, was er tun kann.
console.log("Schreib eine Nachricht. /exit beendet den Chat.\n");

// while (true) bedeutet: Diese Schleife läuft so lange, bis wir sie mit break
// verlassen. Genau dadurch wird aus einem Einmal-Programm ein Chat.
while (true) {
  // ask zeigt "you> " an und wartet, bis der Nutzer Enter drückt.
  const userInput = await ask("you> ");

  // Wenn die Eingabe geschlossen wurde, beenden wir den Chat sauber.
  if (userInput === undefined) break;

  // trim entfernt Leerzeichen am Anfang und Ende. So wird " /exit " auch erkannt.
  const text = userInput.trim();

  // /exit ist unser einfacher Befehl zum Beenden.
  if (text === "/exit") break;

  // Eine leere Nachricht ignorieren wir, weil das Modell sonst nichts Sinnvolles
  // bekommt.
  if (!text) continue;

  // Wir speichern die Nutzer-Nachricht im Verlauf.
  messages.push({ role: "user", content: text });

  // Noch immer kein Agent: Das Modell bekommt nur den Verlauf und antwortet mit
  // Text. Es kann hier keine Aktion in der echten Umgebung auslösen.
  const response = await client.responses.create({
    // Welches Modell soll antworten?
    model,

    // Der ganze bisherige Chat geht als Kontext mit.
    input: messages,
  });

  // output_text ist die fertige Antwort des Modells.
  const answer = response.output_text;

  // Auch die Modellantwort speichern wir, damit die nächste Runde den Verlauf kennt.
  messages.push({ role: "assistant", content: answer });

  // Zum Schluss zeigen wir die Antwort im Terminal an.
  console.log(`agent> ${answer}\n`);
}

// Wenn die Schleife endet, schließen wir readline sauber.
rl.close();

// Diese Funktion kapselt eine Terminal-Frage. Sie macht den Code im Loop lesbarer
// und fängt den Fall ab, dass stdin bei automatisierten Tests schon geschlossen ist.
async function ask(prompt: string): Promise<string | undefined> {
  try {
    // rl.question zeigt den Prompt an und wartet auf eine Zeile Eingabe.
    return await rl.question(prompt);
  } catch (error) {
    // Wenn stdin geschlossen ist, behandeln wir das wie "Chat ist vorbei".
    if (error && typeof error === "object" && "code" in error && error.code === "ERR_USE_AFTER_CLOSE") {
      return undefined;
    }

    // Alle anderen Fehler sind echte Fehler und sollen sichtbar bleiben.
    throw error;
  }
}
