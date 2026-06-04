# KI-Modelle 2026: Arbeitsrecherche fuer YouTube

Stand: 4. Juni 2026

Ziel: handlungsorientierter Ueberblick fuer Zuschauer, die wissen wollen, welches LLM sie wofuer nutzen sollten. Keine wissenschaftliche Ausarbeitung, sondern eine klare Marktkarte mit qualitativen Meinungen, Preisen und Einordnung von Modellen, Produkten und Routern.

## Arbeitsthese

2026 geht es nicht mehr um "das eine beste Modell". Es geht um den passenden Stack:

- Modell: der eigentliche Generator, z. B. GPT-5.5, Claude Opus, Gemini, DeepSeek, Qwen, Kimi, GLM.
- Produkt: fertige Nutzererfahrung, z. B. ChatGPT, Claude, Gemini App, Grok, Perplexity, Codex, Claude Code.
- Plattform/Router: Infrastruktur/API-Schicht, z. B. OpenRouter, Vertex AI, Bedrock, Azure AI Foundry, Fireworks, Hugging Face Inference Providers.

Die einfache Botschaft fuer das Video:

- ChatGPT/OpenAI: bester Allround-/Produkt-Stack.
- Claude/Anthropic: sehr stark fuer Schreiben, Denken, Coding und "Thought Partner"-Gefuehl.
- Gemini/Google: stark bei Kontext, Multimodalitaet, Google-Integration, Recherche.
- Grok/xAI: X-/Realtime-nahe, stark polarisiert.
- DeepSeek/Qwen/Kimi/GLM/MiniMax: Preis-Leistung und Coding/Agenten setzen Druck auf die US-Labs.
- Mistral/Llama/Gemma: Open-/Self-hosted-/EU-nahe Alternativen.
- Perplexity/Sonar: Rechercheprodukt mit Quellen, nicht automatisch Wahrheitsmaschine.

## Einfache Taxonomie

1. Allrounder
   - ChatGPT/GPT, Claude, Gemini, Grok.
   - Frage: "Was nutze ich jeden Tag?"

2. Reasoning und schwierige Aufgaben
   - GPT mit reasoning effort, Claude Opus/Sonnet Thinking, Gemini Deep Think, Grok reasoning, DeepSeek/Kimi/GLM thinking.
   - Frage: "Was nehme ich, wenn es wirklich nachdenken soll?"

3. Coding und Agenten
   - Codex, Claude Code, Cursor, Gemini CLI, OpenCode mit Kimi/Qwen/GLM/DeepSeek/MiniMax, Mistral Devstral/Codestral.
   - Frage: "Was baut, refactort, testet und reviewt am besten?"

4. Recherche und Web
   - Perplexity Sonar, ChatGPT Search/Deep Research, Gemini mit Google, Grok/X, Kimi Web Search, Claude mit Web.
   - Frage: "Was hilft bei aktuellen Fakten und Quellen?"

5. Guenstig, offen, self-hosted
   - DeepSeek, Qwen, Kimi, GLM, MiniMax, Mistral, Llama, Gemma, Cohere, Nemotron, Granite, Phi.
   - Frage: "Wann brauche ich nicht das teuerste Frontier-Modell?"

## Modell- und Anbieterkarte

| Anbieter | Modelle/Familien | Produktzugang | Herkunft | Video-Einordnung |
|---|---|---|---|---|
| OpenAI | GPT-5.5, GPT-5.4, GPT-5.4 mini/nano, GPT-5.3-Codex | ChatGPT, Codex, API, teils Bedrock/Azure | USA | Allround, Coding, Produkt-Oekosystem |
| Anthropic | Claude Opus 4.8, Sonnet 4.6, Haiku | Claude, Claude Code, API, Bedrock, Vertex, Foundry | USA | Schreiben, Coding, komplexe Denkaufgaben |
| Google DeepMind | Gemini 3.5 Flash, Gemini 3.1 Pro, Deep Think, Flash-Lite, Gemma 4 | Gemini App, AI Studio, Vertex/Gemini Enterprise, API | USA/UK | Kontext, Multimodal, Google, Recherche |
| xAI | Grok 4.3, Grok reasoning/non-reasoning, Grok Build | Grok, X, API | USA | Realtime/X, polarisiert |
| DeepSeek | DeepSeek V4 Pro, V4 Flash | Chat, API, OpenAI-/Anthropic-kompatibel, Open Weights | China | extrem guenstig, stark, Datenschutz/China-Thema |
| Alibaba/Qwen | Qwen3 Max/Flash/Turbo, Qwen Coder, Qwen VL/Omni | Qwen, Alibaba Model Studio, Hugging Face/ModelScope | China | Open-/Coding-Oekosystem, Preis-Leistung |
| Moonshot/Kimi | Kimi K2.6/K2.5 | Kimi App, API, Hugging Face/Open Weights | China | Agentic Coding, lange Aufgaben, oft langsamer |
| Z.ai/GLM | GLM-5.1, GLM-5, GLM-4.7 | Z.ai API, Coding Plan, Open Weights | China | "Chinese Opus"-Narrativ fuer lange Engineering-Loops |
| MiniMax | MiniMax M3, M2.7, M2.5 | MiniMax Agent, API, Token Plan | China | Coding/Agenten, 1M Kontext, sehr guenstig |
| Mistral | Mistral Large 3, Medium 3.5, Small 4, Magistral, Devstral, Codestral | Mistral Vibe/Studio/API, Open Weights | Frankreich/EU | EU/open/enterprise Alternative |
| Meta | Llama 4 Scout/Maverick | Meta AI, Hugging Face, Self-host | USA | Open weights, local/enterprise, viel Reichweite |
| Google | Gemma 4 | Hugging Face, AI Studio, Self-host | USA/UK | offene kleine/mittlere Modelle, starke Google-Basis |
| Cohere | Command A/A+, Command R, Aya | API, Enterprise, Model Vault | Kanada | RAG, Enterprise, Multilingual |
| Microsoft | Phi | Azure AI Foundry, Hugging Face, Ollama | USA | kleine/on-device Modelle, Edge |
| NVIDIA | Nemotron | NIM, build.nvidia.com, Hugging Face | USA | Open/Enterprise/Inference-Oekosystem |
| IBM | Granite | watsonx, Hugging Face | USA | Enterprise, open, RAG, Safety |
| Perplexity | Sonar, Sonar Pro, Sonar Reasoning, Deep Research | Perplexity App/API | USA | Suche/Recherche, Quellen UX |
| Honorable Mentions | Baidu ERNIE, Tencent Hunyuan, ByteDance Seed/Doubao, StepFun, AI21, Reka, Aleph Alpha, Apple Foundation Models, OLMo, EXAONE, xLAM | unterschiedlich | gemischt | nur erwaehnen, wenn es in den Kontext passt |

## Use-Case-Empfehlungen

| Use Case | Starte mit | Gute Alternative | Achtung |
|---|---|---|---|
| Alltag/Allround | ChatGPT/GPT | Gemini, Claude | Wenn Fakten aktuell sein muessen, Websuche/Quellen aktivieren. |
| Schreiben/Denken | Claude Sonnet/Opus | GPT-5.5, Gemini Pro | Opus/Flagship wird teuer; Sonnet/Medium oft besserer Sweet Spot. |
| Coding/Agenten | Claude Code oder Codex | Cursor, Gemini CLI, OpenCode + Kimi/GLM/Qwen/DeepSeek | Agenten verbrennen Tokens. Immer Tests, Git-Diff und Scope kontrollieren. |
| Recherche/Web | Perplexity, ChatGPT Deep Research, Gemini Deep Research | Claude/Grok/Kimi mit Web | Quellen pruefen. Zitationen sind kein Wahrheitsbeweis. |
| Lange Dokumente | Gemini Pro/Deep Think, GPT-5.5, Claude mit langem Kontext | Kimi, DeepSeek, MiniMax, Llama Scout fuer Experimente | Long Context ist kein Gedaechtnis. Fuer Produktion RAG/Chunking nutzen. |
| Guenstige API/Volumen | DeepSeek V4 Flash, Gemini Flash-Lite, Mistral Small, MiniMax | Qwen/GLM/Kimi ueber Router/Provider | Billig kann durch mehr Output, Retry oder Fehler teurer werden. |
| Datenschutz/EU | Mistral, Azure/Bedrock/Vertex mit Vertrag, OpenAI/Anthropic Enterprise-Optionen | Self-hosted Mistral/Llama/Gemma/Qwen | Consumer-Chat ist nicht automatisch DSGVO-tauglich. |
| Open/Self-hosted | Mistral, Llama, Gemma | Qwen, DeepSeek, Kimi, GLM, Nemotron, Granite | Open weights sparen nicht automatisch Kosten; Betrieb und Compliance bleiben. |

## Qualitative Meinungen und Narrative

Das sind keine harten Fakten, sondern wiederkehrende Stimmungsbilder aus Reviews, Every, YouTube, Hacker News, Reddit und technischen Blogs.

### OpenAI / GPT / Codex

Wiederkehrendes Bild:

- bester Allround- und Produkt-Stack;
- starkes Oekosystem aus ChatGPT, API, Codex, Tools, Search, Images, Agents;
- Codex hat 2026 wieder deutlich Momentum bei Coding-Agenten;
- Kritik: teuer, manchmal weniger "menschlich" oder kollaborativ als Claude, teils sehr tokenintensiv.

Gute Videoformulierung:

> OpenAI ist oft nicht das Modell mit der romantischsten Fanbase, aber der Stack, der fuer die meisten Leute am ehesten alles kann.

### Anthropic / Claude / Claude Code

Wiederkehrendes Bild:

- Claude Code hat extrem viel Entwickler-Mindshare;
- Claude wird oft als besserer Schreib-, Review- und Denkpartner beschrieben;
- stark bei Kontext, Refactoring, "catcht Dinge, die du nicht gefragt hast";
- Kritik: teuer, Limits und Quotas nerven Power User.

Gute Videoformulierung:

> Claude fuehlt sich fuer viele eher wie ein sehr guter Kollege an, waehrend Codex eher wie ein Agent ist, dem man saubere Tickets gibt.

### Google / Gemini

Wiederkehrendes Bild:

- stark bei langem Kontext, Multimodalitaet, Google-Integration, Recherche;
- Gemini Flash/Flash-Lite sehr wichtig fuer Preis/Speed;
- Deep Think als Spezialmodus fuer harte wissenschaftlich-technische Aufgaben;
- Kritik: UX/Produkt wirkt fuer manche inkonsistent, Flash-Qualitaet polarisiert.

Gute Videoformulierung:

> Gemini ist besonders spannend, wenn Kontext, Google-Suche, Workspace oder Multimodalitaet wichtiger sind als das reine Chatbot-Gefuehl.

### Grok / xAI

Wiederkehrendes Bild:

- starkes X-/Realtime-Narrativ, eigener Ton, guenstige API-Story;
- interessant fuer Leute, die X-Daten/Realtime-Perspektive wollen;
- Kritik: sehr polarisiert, Trust/Safety und Qualitaetsschwankungen.

Gute Videoformulierung:

> Grok ist weniger der neutrale Office-Assistent und mehr das Modell mit Meinung, X-Naehe und entsprechend viel Reibung.

### DeepSeek

Wiederkehrendes Bild:

- Preis-Leistungs-Symbol;
- stark fuer API-Volumen, Coding, Reasoning;
- hat die Erwartung verschoben, wie guenstig gute Inferenz sein kann;
- Kritik: China, Datenschutz, Zensur, IP-/Distillation-Vorwuerfe.

Gute Videoformulierung:

> DeepSeek ist das Modell, das die Preisdebatte veraendert hat. Aber genau deshalb muss man Herkunft, Datenfluss und Compliance mitdenken.

### Qwen / Kimi / GLM / MiniMax

Wiederkehrendes Bild:

- "China Stack" fuer Coding-Agenten und guenstige API;
- Kimi: stark fuer agentic coding und lange Aufgaben, aber Speed/Providerwahl wichtig;
- GLM: starkes Narrativ fuer ausdauernde Engineering-Agenten;
- Qwen: breites Open-Model-Oekosystem, solide Coding-Modelle;
- MiniMax: guenstig, agentisch, mit M3 starkem 1M-Kontext-Narrativ;
- Kritik: Plattformzugang, Provider-Unterschiede, Datenschutz, Lizenzen, Zensur.

Gute Videoformulierung:

> Wenn du nur ChatGPT, Claude und Gemini vergleichst, verpasst du 2026 die Preis-Leistungs-Revolution aus China.

### Mistral / Llama / Gemma

Wiederkehrendes Bild:

- Mistral: europaeische/open/enterprise Alternative, keine typische Consumer-Lieblingsapp;
- Llama: wichtig durch Open-Weights und riesiges Oekosystem, aber nicht immer gefeierter Qualitaetsleader;
- Gemma: stark fuer offene kleinere/mittlere Modelle und Google-nahe Infrastruktur;
- Kritik: Self-hosted ist mehr Arbeit, nicht automatisch billiger.

Gute Videoformulierung:

> Open Models sind nicht immer die besten Chatbots, aber sie geben dir Kontrolle: Kosten, Deployment, Datenschutz, Finetuning, Edge.

### Perplexity / Sonar

Wiederkehrendes Bild:

- schnellste Antwortmaschine mit Quellen;
- API fuer Search/Research interessant;
- Produkt kann auch fremde Modelle einbinden, ist also eher Produkt/Recherche-Schicht als nur Modell;
- Kritik: Limits, Routing, fragwuerdige Zitate, Vertrauen.

Gute Videoformulierung:

> Perplexity ist kein reines Modellrennen, sondern ein Rechercheprodukt. Seine Staerke ist die Such- und Quellen-UX, seine Schwachstelle ist genau dort auch Vertrauen.

## Coding-Agenten: Claude Code vs Codex vs Cursor vs OpenCode

Wiederkehrende qualitative Unterscheidung:

- Claude Code: synchroner Pair-Programmer, stark bei Kontext, Refactoring, Planung, Pushback.
- Codex: staerker in asynchronen Aufgaben, GitHub/PR/Cloud-Sandbox, klaren Tickets, Terminal-/OpenAI-Workflows.
- Cursor: IDE-/Team-Workflow, schnell im Editor, gut fuer Teams und Cloud Runner.
- OpenCode: modellagnostisch, gut wenn man Kimi/GLM/Qwen/DeepSeek/MiniMax ausprobieren will.

Pragmatische Empfehlung:

- Wenn du nur eins testest: Claude Code oder Codex.
- Wenn du Dev bist: wahrscheinlich beide testen, weil sie unterschiedliche Jobs machen.
- Wenn du nicht-technisch bist: Produkt-UX wichtiger als Modellname.
- Wenn du sparen willst: OpenCode + guenstige China-/Open-Modelle testen.

## Plattformen und Router

| Plattform | Was es ist | Wann sinnvoll | Risiko |
|---|---|---|---|
| OpenRouter | Multi-Provider-Router | schnell viele Modelle testen, Fallbacks, BYOK/ZDR-Filter | Provider pinnen, sonst Verhalten/Speed schwankt |
| Hugging Face Inference Providers | HF-Router zu Partner-Providern | Open-Models schnell ausprobieren | Provider-/Billing-Details pruefen |
| Fireworks | schnelle Serverless/Dedicated-Inference | Kimi, DeepSeek, GLM, MiniMax und Open Models performant nutzen | Serverless-Versionen koennen wechseln |
| Together AI | Open-Model-Inference und Dedicated Endpoints | Open-Source-Produktion, Finetuning | Performance/Preis pro Modell testen |
| GroqCloud | sehr schnelle Inferenz auf LPU | niedrige Latenz, offene Modelle | Modellauswahl/Rate Limits |
| Cerebras/SambaNova | Spezialhardware-Inferenz | sehr schnelle oder Enterprise-Inferenz | kleineres Modellangebot |
| Replicate/Baseten | Modellhosting/Deployments | eigene oder Community-Modelle, Media-Modelle | Produktionsreife/SLAs pruefen |
| Cloudflare Workers AI / AI Gateway | Edge/Serverless + Gateway | Apps nahe am Cloudflare-Stack | Logging/Gateway-Datenschutz bewusst setzen |
| AWS Bedrock | Enterprise-Modellplattform | IAM, VPC, Guardrails, AWS-Vertraege | teurer/traeger, Modellverfuegbarkeit regional |
| Google Vertex / Gemini Enterprise | Google-Cloud-Modellplattform | Gemini, Claude, Mistral, Agenten, Google-Stack | Namens-/Produktwechsel, Enterprise-Komplexitaet |
| Azure AI Foundry | Microsoft-Modellkatalog | Azure Governance, OpenAI/DeepSeek/Mistral/Meta usw. | Verfuegbarkeit/Preis je Region |
| GitHub Models | Developer-Modellkatalog | Prototyping in GitHub-Workflows | Limits, nicht fuer alle Produktionsfaelle |
| Perplexity API | Search-/Research-API | Webantworten mit Zitaten | keine neutrale Modellrouting-Schicht |

Merksatz:

> Ein Router ist praktisch zum Testen und Routinen bauen. Fuer sensible Produktion willst du Provider, Modellversion, Region und Datenpolicy explizit festnageln.

## Preisliche Einordnung

Keine exakte Ranking-Tabelle, weil Preise, Discounts, Cache, Batch und Long-Context-Stufen sich laufend aendern. Fuer das Video reicht diese Einordnung:

- Premium teuer: OpenAI Flagship/Pro, Claude Opus, manche Deep Research/Agenten-Workflows.
- Premium mittig: Claude Sonnet, GPT-5.4/5.5 Standard, Gemini Pro/Flash je nach Modus.
- Preis-Leistung stark: DeepSeek, Qwen, Kimi, GLM, MiniMax, Mistral Small/Large 3.
- Sehr guenstig fuer Volumen: Flash/Mini/Nano/Small/Lite-Modelle.
- Versteckte Kosten: Output-Tokens, Reasoning-Tokens, Tool Calls, Web Search, Code Execution, Context Cache Writes, Retries, Agent-Loops.

Wichtig fuer Video:

> Der billigere Tokenpreis gewinnt nicht automatisch. Ein Modell, das dreimal so viel redet, fuenfmal retryt oder staendig Tools nutzt, kann effektiv teurer sein.

## Dramaturgie fuer das Video

Moeglicher Titel:

- Welche KI soll ich 2026 nutzen? ChatGPT, Claude, Gemini, Grok, DeepSeek & Co. erklaert
- ChatGPT vs Claude vs Gemini vs DeepSeek: Welches KI-Modell ist wofuer gut?
- Es gibt nicht "das beste KI-Modell" - so waehlst du 2026 richtig

Moegliche Struktur:

1. Hook
   - "ChatGPT, Claude, Gemini, Grok, DeepSeek, Qwen, Kimi, Mistral ... alle reden ueber Modelle. Aber die eigentliche Frage ist: Was soll ich wofuer nutzen?"

2. Begriffe entwirren
   - Modell vs Produkt vs Plattform/Router.
   - Beispiel: Perplexity ist Produkt + Search + ggf. fremde Modelle; Codex ist Produkt/Agent plus OpenAI-Modelle; OpenRouter ist kein Modell.

3. Die fuenf Modelltypen
   - Allround, Reasoning, Coding/Agenten, Recherche/Web, Guenstig/Open/Self-hosted.

4. Die grossen Anbieter kurz
   - OpenAI, Anthropic, Google, xAI.
   - Danach Preis-Leistungs-Challenger: DeepSeek, Qwen, Kimi, GLM, MiniMax, Mistral.
   - Danach Open/Self-hosted: Llama, Gemma, Mistral, Qwen/DeepSeek.

5. Empfehlungen nach Use Case
   - Alltag, Schreiben, Coding, Recherche, lange Dokumente, guenstige API, Datenschutz, Open/self-hosted.

6. Qualitative Realitaet
   - Benchmarks sind nuetzlich, aber Workflow entscheidet.
   - Claude vs Codex: nicht "wer gewinnt", sondern synchroner Pair-Programmer vs asynchroner Agent.
   - China-Modelle: Preis-Leistung stark, aber Datenschutz/Herkunft bewusst.

7. Schluss
   - "Starte mit einem Allrounder, teste fuer deinen Use Case, route erst spaeter."

## Quellenbasis

Primaerquellen:

- [OpenAI API Pricing](https://openai.com/api/pricing/)
- [OpenAI API Models](https://developers.openai.com/api/docs/models)
- [OpenAI Codex Pricing](https://developers.openai.com/codex/pricing)
- [Anthropic Claude Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- [Claude Opus 4.8](https://www.anthropic.com/claude/opus)
- [Claude Sonnet 4.6](https://www.anthropic.com/claude/sonnet)
- [Google Gemini Models](https://deepmind.google/models/gemini/)
- [Gemini Enterprise / Google Models](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/google-models)
- [Google Vertex/Gemini Pricing](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing)
- [xAI Models](https://docs.x.ai/developers/models)
- [xAI Pricing](https://docs.x.ai/developers/pricing)
- [DeepSeek Pricing](https://api-docs.deepseek.com/quick_start/pricing)
- [DeepSeek Thinking Mode](https://api-docs.deepseek.com/guides/thinking_mode)
- [Qwen / Alibaba Model Studio Pricing](https://www.alibabacloud.com/help/en/model-studio/model-pricing)
- [Kimi K2.6 Pricing](https://platform.kimi.ai/docs/pricing/chat-k26)
- [Moonshot/Kimi Platform](https://platform.moonshot.ai/)
- [Z.ai GLM-5.1](https://docs.z.ai/guides/llm/glm-5.1)
- [Z.ai Pricing](https://docs.z.ai/guides/overview/pricing)
- [MiniMax M3](https://www.minimax.io/blog/minimax-m3)
- [MiniMax API Pricing](https://platform.minimax.io/docs/guides/pricing-paygo)
- [Mistral Pricing](https://mistral.ai/pricing/)
- [Mistral Models Overview](https://docs.mistral.ai/getting-started/models/)
- [Mistral Large 3](https://docs.mistral.ai/models/mistral-large-3-25-12)
- [Meta Llama 4](https://ai.meta.com/blog/llama-4-multimodal-intelligence/)
- [Gemma 4](https://deepmind.google/models/gemma/gemma-4/)
- [Cohere Models](https://docs.cohere.com/docs/models)
- [Perplexity Pricing](https://docs.perplexity.ai/getting-started/pricing)
- [Perplexity Sonar](https://docs.perplexity.ai/docs/sonar/models/sonar)

Router/Plattformen:

- [OpenRouter Providers](https://openrouter.ai/providers/)
- [OpenRouter Pricing](https://openrouter.ai/pricing)
- [Hugging Face Inference Providers Pricing](https://huggingface.co/docs/api-inference/en/pricing)
- [Fireworks Serverless Pricing](https://docs.fireworks.ai/serverless/pricing)
- [Groq Pricing](https://groq.com/pricing)
- [AWS Bedrock Endpoint Availability](https://docs.aws.amazon.com/bedrock/latest/userguide/models-endpoint-availability.html)
- [Azure AI Foundry Models](https://azure.microsoft.com/en-us/products/ai-model-catalog/)

Qualitative Quellen / Stimmungsbild:

- [Every: Chain of Thought](https://every.to/chain-of-thought?sort=newest)
- [Every: Compound Engineering](https://every.to/chain-of-thought/compound-engineering-how-every-codes-with-agents)
- [Every: The Great AI Unbundling](https://every.to/chain-of-thought/the-great-ai-unbundling)
- [LMArena Leaderboard](https://lmarena.ai/leaderboard/)
- [LiveBench](https://livebench.ai/)
- [Hacker News: Kimi K2.6 coding discussion](https://news.ycombinator.com/item?id=47993235)
- [Milvus: Claude vs Gemini vs Codex vs Qwen vs MiniMax Code Review](https://milvus.io/blog/ai-code-review-gets-better-when-models-debate-claude-vs-gemini-vs-codex-vs-qwen-vs-minimax.md)
- [Village Global: Claude Code vs Codex vs Gemini](https://www.youtube.com/watch?v=LEAquXi1Qes)
- [Nate Herk: 100 Hours Testing Claude Code vs ChatGPT Codex](https://www.youtube.com/watch?v=RLjaUES9P8A)
- [Theo: Claude Code vs Codex vs Cursor](https://www.youtube.com/watch?v=JMYspR42HFM)

## Offene Punkte fuer naechste Runde

- Konkrete Preis-Snapshot-Tabelle bauen: Input/Output/Context fuer 15-20 Kernmodelle.
- Thumbnail-/Titel-Pakete testen.
- Script-Outline mit Hook, Kapiteln, B-Roll-Ideen und Beispielprompts schreiben.
- Eigene kleine Tests definieren: Alltag, Recherche, Coding, Long Context, Billigmodell.
- Entscheiden, wie scharf Datenschutz/China im Video formuliert wird.
