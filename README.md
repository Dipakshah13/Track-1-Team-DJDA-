# 🛡️ Gemma Aegis

**A local-first, two-way AI firewall powered by Gemma 4.**
Stops secrets going *out* to cloud AI. Stops attacks coming *in* to AI agents. Runs on your own device.

> Built for Hacktober (6-hour hackathon) · Track: *Best Use of Gemma 4* · License: Apache-2.0

---

## Why this exists

People paste screenshots, bank statements and ID documents into cloud AI every day, and AI agents read
web pages, PDFs and emails that can contain hidden instructions. Aegis sits between you and the cloud:

| Direction | Module | What it does |
|---|---|---|
| **Outbound** | **Shield** | Finds sensitive data (IDs, phone numbers, bank details, names, addresses) in text, images and documents **locally**, redacts it, and only then lets a cloud model see the safe version. |
| **Inbound** | **Guard** | Scans documents and images for hidden prompt-injection attacks **before** an AI agent reads them. |
| **Proof** | **Ledger** | Every action is written to a tamper-evident, hash-chained audit log (“Privacy Receipt”). No raw secrets are ever stored in it. |

Extras: **Red-team verifier** (a Gemma attacker tries to re-identify the redacted data and gives a risk score),
**Judge CTF** (try to make Aegis leak a secret), and a **browser extension** that intercepts paste into AI chat sites.

## What it is
A **local-first web app** that runs on your own device (React on `localhost:5173`, FastAPI on `localhost:8000`). An optional browser extension (stretch) calls the same local backend. It is not meant to be hosted publicly.

## Why Gemma 4 (and not just any model)

- **Open weights → local.** Gemma 4 E4B runs on your laptop via Ollama, so raw data never leaves the device.
- **Multimodal.** One model reads text *and* images (screenshots, scanned documents).
- **Function calling / structured output.** The router decides local vs cloud with typed JSON.
- **Hybrid.** Local E4B for private work, Gemma 31B via the Gemini API for heavy reasoning on **sanitized** input only.
- **Works offline.** `LOCAL_ONLY=true` runs the whole pipeline with no cloud at all.

## Architecture

```
 React UI ──REST + SSE──▶ FastAPI backend
 (Console, Attack Demo,     ├─ Guard   (local E4B + heuristics)  → verdict
  Ledger, CTF)              ├─ Shield  (regex + local E4B)       → findings, redaction
                            ├─ Router  (function-call JSON)      → local | cloud
                            ├─ Cloud   (Gemma 31B, sanitized only)
                            ├─ RedTeam (31B attacker, or local)  → risk score
                            └─ Ledger  (SQLite hash chain)
 Browser extension ───────▶ POST /api/shield/text (localhost)
```

See [`docs/TRD.md`](docs/TRD.md) for full detail.

## Quick start (Windows / macOS / Linux)

**Prerequisites:** Python 3.11+, Node 20+, [Ollama](https://ollama.com), a Gemini API key from https://aistudio.google.com/apikey

```bash
# 1. local model
ollama pull gemma4:e4b

# 2. backend
cd backend
python -m venv .venv
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
copy ..\.env.example .env        # macOS/Linux: cp ../.env.example .env  (then add your key)
uvicorn app.main:app --reload --port 8000

# 3. frontend (new terminal)
cd frontend
npm install
npm run dev                      # http://localhost:5173
```

### Environment (`.env`)

| Var | Default | Meaning |
|---|---|---|
| `OLLAMA_URL` | `http://localhost:11434` | Local Ollama server |
| `LOCAL_MODEL` | `gemma4:e4b` | Local Gemma model tag |
| `CLOUD_MODEL` | `gemma-4-31b-it` | Cloud model (verify exact name in AI Studio) |
| `GEMINI_API_KEY` | – | Needed unless `LOCAL_ONLY=true` |
| `LOCAL_ONLY` | `false` | Never call the cloud |
| `DETECTION_MODE` | `auto` | `auto` \| `box` \| `text` |
| `DB_PATH` | `./aegis.db` | SQLite ledger |

## Using it

1. **Console → Shield:** drop an image / paste text → see findings, redacted output and the Privacy Receipt.
2. **Console → Guard:** drop a document → get a SAFE / SUSPICIOUS / MALICIOUS verdict with flagged spans.
3. **Attack Demo:** watch a naive agent get hijacked by a poisoned file, then watch Aegis stop it.
4. **Ledger:** inspect and **verify** the hash chain (tamper with a row to see verification fail).
5. **CTF:** try to extract the vault secret through the Aegis-protected assistant.

## Evaluation

```bash
cd eval && python run_eval.py     # writes eval/results.md
```
Reports: detection recall/precision on `testdata/`, injection block rate, red-team re-identification risk.

## Repo structure

```
gemma-aegis/
├── README.md  AGENTS.md  LICENSE  .env.example
├── docs/            PRD.md  TRD.md  ROADMAP.md  TASKS.md  VALIDATION.md
├── .agents/         rules/ + skills/aegis-dev/SKILL.md   (Antigravity)
├── backend/         FastAPI app (api/ core/ services/ prompts/ tests/)
├── frontend/        React + Vite + TypeScript + Tailwind
├── extension/       Chrome MV3 extension (stretch)
├── testdata/        fake sensitive images/docs + attack files (ALL FAKE DATA)
└── eval/            run_eval.py
```

## Honest limitations

- Detection is probabilistic; tiny or low-contrast text is weaker. Regex rules back up the model for structured IDs.
- Injection defence **reduces risk, it does not eliminate it.**
- Not legal or compliance advice. Policy modes are aids, not certification.
- Guard detects prompt injection, **not malware**. Aegis is not antivirus; it restricts file types and refuses PDFs with active content.
- All test data in this repo is fake.

## License

Apache-2.0 (add the full `LICENSE` file via GitHub "Add license" or copy from apache.org). Gemma models are used under their own license terms.
