// Diese Funktionen kommen aus Node/Bun und arbeiten mit Dateien und Ordnern.
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";

// path hilft uns, Dateipfade sauber und plattformunabhängig zusammenzubauen.
import path from "node:path";

// zod ist eine Validierungsbibliothek. Damit prüfen wir, ob Tool-Argumente die
// erwartete Form haben.
import { z } from "zod";

// Ein Tool ist in dieser Demo ein normales TypeScript-Objekt mit Vertrag.
// TArgs beschreibt, welche Argumente das Tool erwartet.
type Tool<TArgs> = {
  // name ist der technische Name, den später auch das Modell sieht.
  name: string;

  // description erklärt dem Modell, wofür das Tool gedacht ist.
  description: string;

  // jsonSchema beschreibt maschinenlesbar, welche Argumente erlaubt sind.
  jsonSchema: Record<string, unknown>;

  // parse prüft unbekannte Eingaben und macht daraus saubere Tool-Argumente.
  parse(args: unknown): TArgs;

  // execute führt die echte Arbeit aus, zum Beispiel eine Datei schreiben.
  execute(args: TArgs): Promise<string>;
};

// Alle Dateioperationen passieren in diesem lokalen Demo-Ordner.
const workspaceDir = path.join(process.cwd(), "workspace");

// Diese Funktion ist unsere einfache Sicherheitsgrenze. Sie verhindert, dass ein
// Tool außerhalb des Workspace liest oder schreibt.
function resolveWorkspacePath(relativePath: string): string {
  // Absolute Pfade wie /Users/... sind verboten, weil das Tool relativ arbeiten soll.
  if (path.isAbsolute(relativePath)) {
    throw new Error("Absolute paths are not allowed");
  }

  // path.resolve baut aus Workspace und relativem Pfad einen vollständigen Pfad.
  const fullPath = path.resolve(workspaceDir, relativePath);

  // Wenn der fertige Pfad nicht mehr im Workspace liegt, blocken wir ihn.
  // Das schützt zum Beispiel vor Pfaden wie ../secret.txt.
  if (!fullPath.startsWith(`${workspaceDir}${path.sep}`) && fullPath !== workspaceDir) {
    throw new Error("Path escapes workspace");
  }

  // Nur sichere Pfade kommen hier durch.
  return fullPath;
}

// Das write_file Tool erwartet genau zwei Argumente: path und content.
const writeFileArgs = z.object({
  path: z.string(),
  content: z.string(),
});

// write_file ist unser erstes echtes Werkzeug.
const writeFileTool: Tool<z.infer<typeof writeFileArgs>> = {
  // Dieser Name wird später im Tool Call auftauchen.
  name: "write_file",

  // Diese Beschreibung hilft dem Modell, das richtige Tool auszuwählen.
  description: "Write text into a file inside the workspace.",

  // Das JSON Schema ist der Vertrag, den das Modell sieht: welche Argumente
  // sind erlaubt, welche sind Pflicht, und was bedeuten sie.
  jsonSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Relative file path inside workspace" },
      content: { type: "string", description: "Text content" },
    },
    required: ["path", "content"],
    additionalProperties: false,
  },

  // parse validiert zur Laufzeit, dass wirklich path und content vorhanden sind.
  parse: (args) => writeFileArgs.parse(args),

  // execute ist der eigentliche "Arm" des Agents. Erst hier passiert echte Arbeit
  // in der Umgebung, nicht im Modell selbst.
  async execute(args) {
    // Aus dem relativen Pfad wird ein sicherer vollständiger Pfad.
    const fullPath = resolveWorkspacePath(args.path);

    // Falls ein Unterordner fehlt, legen wir ihn an.
    await mkdir(path.dirname(fullPath), { recursive: true });

    // Jetzt wird die Datei wirklich geschrieben.
    await writeFile(fullPath, args.content, "utf8");

    // Das Tool gibt eine kurze Rückmeldung zurück.
    return `Wrote ${args.path}`;
  },
};

// read_file braucht nur einen Pfad.
const readFileArgs = z.object({ path: z.string() });

// read_file liest Text aus dem Workspace.
const readFileTool: Tool<z.infer<typeof readFileArgs>> = {
  name: "read_file",
  description: "Read a UTF-8 file from the workspace.",
  jsonSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Relative file path inside workspace" },
    },
    required: ["path"],
    additionalProperties: false,
  },
  parse: (args) => readFileArgs.parse(args),
  async execute(args) {
    // Auch beim Lesen prüfen wir zuerst den Pfad.
    const fullPath = resolveWorkspacePath(args.path);

    // Danach lesen wir den Dateiinhalt als UTF-8 Text.
    return await readFile(fullPath, "utf8");
  },
};

// list_files bekommt einen Ordnerpfad oder null für die Workspace-Wurzel.
const listFilesArgs = z.object({ path: z.string().nullable() });

// list_files zeigt, welche Dateien im Workspace liegen.
const listFilesTool: Tool<z.infer<typeof listFilesArgs>> = {
  name: "list_files",
  description: "List files in a workspace directory.",
  jsonSchema: {
    type: "object",
    properties: {
      path: { type: ["string", "null"], description: "Relative directory or null for root" },
    },
    required: ["path"],
    additionalProperties: false,
  },
  parse: (args) => listFilesArgs.parse(args),
  async execute(args) {
    // null bedeutet: Nimm den Workspace selbst.
    const directory = resolveWorkspacePath(args.path ?? ".");

    // readdir liest die Einträge im Ordner.
    const entries = await readdir(directory, { withFileTypes: true });

    // Wir formatieren die Liste so, dass man file und dir unterscheiden kann.
    return entries.map((entry) => `${entry.isDirectory() ? "dir " : "file"} ${entry.name}`).join("\n");
  },
};

// Alle Tools liegen in einer Liste. Später geben wir genau so eine Liste dem Modell.
const tools = [writeFileTool, readFileTool, listFilesTool];

// Der Workspace muss existieren, bevor Tools darin arbeiten.
await mkdir(workspaceDir, { recursive: true });

// Manualer Tool-Aufruf: Das Modell kommt erst in der nächsten Phase dazu.
// Damit kann man isoliert zeigen: Tools sind normale Funktionen mit Validierung.
const writeResult = await writeFileTool.execute(
  writeFileTool.parse({ path: "demo.txt", content: "Tools sind Funktionen mit Schema.\n" }),
);

// Danach lesen wir dieselbe Datei wieder, um zu zeigen: Das Tool hat wirklich gearbeitet.
const readResult = await readFileTool.execute(readFileTool.parse({ path: "demo.txt" }));

// Ausgabe für die Demo: Welche Tools gibt es?
console.log(`registered tools: ${tools.map((tool) => tool.name).join(", ")}`);

// Ausgabe für die Demo: Was hat write_file zurückgegeben?
console.log(writeResult);

// Ausgabe für die Demo: Was steht wirklich in der Datei?
console.log(readResult);
