// Wir importieren das OpenAI SDK. Das ist die Bibliothek, mit der unser Programm
// mit dem Modell sprechen kann.
import OpenAI from "openai";

// Diese kleinen Helfer lesen Konfiguration aus der Umgebung, zum Beispiel den
// API-Key und den Modellnamen. Dadurch steht kein geheimer Key im Code.
import { readConfig, requireConfig } from "../../shared/env";

// Der Client ist unser technischer Zugang zur OpenAI API. Ohne API-Key könnte
// das Programm keine Anfrage an das Modell schicken.
const client = new OpenAI({ apiKey: requireConfig("OPENAI_API_KEY") });

// Das Modell kommt aus der Env. Wenn dort nichts steht, nehmen wir ein Default-
// Modell, damit die Demo mit möglichst wenig Setup startet.
const model = readConfig("OPENAI_MODEL", "gpt-5.4-mini");

// process.argv enthält die Wörter, die man beim Start hinter den Befehl schreibt.
// Aus `bun run phase:01 "Hallo"` wird hier der Prompt, den das Modell bekommt.
const input = process.argv.slice(2).join(" ") || "Was ist ein KI-Agent in einem Satz?";

// Das ist der kleinste mögliche LLM-Durchstich: ein Prompt geht rein, eine
// Antwort kommt raus. Es gibt noch keinen Chat-Verlauf und keine Werkzeuge.
const response = await client.responses.create({
  // model sagt der API, welches Modell antworten soll.
  model,

  // input ist die eigentliche Frage oder Aufgabe für das Modell.
  input,
});

// output_text ist die fertige Textantwort. Wir schreiben sie einfach ins Terminal
// und beenden danach das Programm.
console.log(response.output_text);
