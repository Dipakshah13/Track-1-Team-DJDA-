# TASKS: Gemma Aegis

How to use with Antigravity: open **Manager**, start one agent per track, set mode to **Planning**, paste the task text (ID, goal, files, acceptance). Review the plan before approving. Read `AGENTS.md` and `docs/TRD.md` first. Mark tasks done here as you go.

Legend: **P0** must ship · **P1** strong extra · **P2** stretch

---

## Track 0: Setup (everyone, 0:00–0:30)

- [ ] **T0.1 (P0) Repo + env.** Create public GitHub repo `gemma-aegis`, add Apache-2.0 `LICENSE`, `.gitignore` (venv, node_modules, .env, aegis.db), `.env.example` (see README table).
- [ ] **T0.2 (P0) Verify-first checks** (TRD §20): Ollama E4B text + image, `box_2d` quality on 5 images, `format` JSON schema, tool calling, cloud model name. Record results in `docs/G0_RESULTS.md` (3 lines each).
- [ ] **T0.3 (P0) Scaffold.** Backend: `python -m venv`, `requirements.txt` (fastapi, uvicorn[standard], pydantic, httpx, google-genai, pillow, pypdf, rapidocr-onnxruntime, sse-starlette, python-multipart, pytest). Frontend: `npm create vite@latest frontend -- --template react-ts`, add tailwindcss, react-router-dom, lucide-react.
- [ ] **T0.4 (P0) Decide `DETECTION_MODE`** from T0.2 and write it into `.env.example`.

---

## Track A: Backend / Models (`backend/`)

- [ ] **A1 (P0) Core + config.** `app/main.py`, `app/core/config.py` (env settings), `app/core/models.py` (all Pydantic models from TRD §4), CORS, `/api/health`.
  *Accept:* `GET /api/health` returns Ollama + cloud status.
- [ ] **A2 (P0) Ollama + cloud clients.** `services/ollama_client.py` (chat with images, JSON schema `format`, timeout, retry-once), `services/cloud_client.py` (google-genai, `LOCAL_ONLY` guard, `assert_no_raw_findings`).
  *Accept:* unit test with mocked HTTP; cloud client raises if a raw finding is present in payload.
- [ ] **A3 (P0) Shield text + regex.** `services/shield.py`: regex layer (Aadhaar, PAN, phone, email, UPI, IFSC, card+Luhn), Gemma layer, merge, placeholders, `/api/shield/text`.
  *Accept:* ≥95% recall on structured IDs in `testdata/`; placeholder map restores original text.
- [ ] **A3b (P0) Shield image.** Box mode (`box_2d` → pixels → blur) and text mode (RapidOCR boxes + classification), auto fallback, downscale to ≤1600 px, `/api/shield/image`.
  *Accept:* redacted image has no readable seeded values; returns base64 + findings with bboxes.
- [ ] **A4 (P0) Guard.** `services/guard.py` heuristics + Gemma classifier, PDF text extraction (`pypdf`) incl. hidden-text checks, image input via Gemma, `/api/guard/scan`.
  *Accept:* ≥5/6 attack files flagged; benign files SAFE.
- [ ] **A5 (P0) Router.** `services/router.py`: tool call or JSON `RouteDecision`; override to local when `LOCAL_ONLY` or cloud unhealthy.
- [ ] **A6 (P0) Orchestrator + SSE.** `services/pipeline.py` implementing TRD §3, `core/events.py` (async queue per run), `POST /api/secure-chat`, `GET /api/events/{run_id}`, `GET /api/runs/{run_id}`.
  *Accept:* a full run emits events for guard→shield→router→model→restore→ledger.
- [ ] **A7 (P0) Ledger.** `services/ledger.py` per TRD §10, `/api/ledger`, `/api/ledger/verify`; meta allowlist enforced.
  *Accept:* tamper test fails verification at the right id; no raw secrets stored (test).
- [ ] **A8 (P0) Naive-agent demo.** `services/naive_agent.py` with mock tools and `DEMO_SCRIPTED` fallback, `POST /api/demo/naive-agent`.
- [ ] **A9 (P1) Red-team verifier.** `services/redteam.py` per TRD §9, `POST /api/redteam/{run_id}`, risk score, one re-redaction pass.
- [ ] **A10 (P1) CTF.** `services/ctf.py` + `/api/ctf/attempt`, `/api/ctf/leaderboard`, outbound filter, rate limit.
- [ ] **A12 (P0) Upload validation.** Type allowlist, magic bytes, 10 MB cap, timeout, temp-dir cleanup, PDF active-content refusal (`ACTIVE_CONTENT`), per TRD §16b.
  *Accept:* docx/zip/exe rejected; a PDF containing `/JavaScript` is refused with a clear message; test added.
- [ ] **A11 (P1) Reversible pseudonyms.** Consistent `Person_A` mapping per session, restore locally in answers.

---

## Track B: Frontend (`frontend/`)

- [ ] **B1 (P0) App shell.** Router (`/`, `/attack-demo`, `/ledger`, `/ctf`), dark security-console theme (Tailwind), `HealthPill`, `lib/api.ts` typed client mirroring TRD §4.
- [ ] **B2 (P0) Console: Shield tab.** `DropZone`, text input, `BeforeAfterImage` (bbox overlay + blurred result), `FindingsTable` (mask raw values by default, “reveal” toggle local only).
- [ ] **B3 (P0) Privacy Receipt.** Panel showing: what was found (counts per category), what was removed, what left the device (exact cloud payload preview), route decision + reason, ledger hash.
- [ ] **B4 (P0) Console: Guard tab + `VerdictCard`.** Verdict colour, attack types, flagged spans highlighted in the document text.
- [ ] **B5 (P0) `LiveTrace`.** `useSSE` hook, step timeline with status and durations, monospace.
- [ ] **B6 (P0) Attack Demo page.** Two-column: “Naive agent” (shows HIJACKED) vs “With Aegis” (shows BLOCKED + why); one-button “Run attack”.
- [ ] **B7 (P1) Ledger page.** Table of entries, **Verify** button, red highlight on the first broken row.
- [ ] **B8 (P1) CTF page + `RiskBadge`.** Handle input, prompt box, blocked counter, leaderboard; Risk badge component also used on the Console.
- [ ] **B9 (P1) Polish.** Empty/loading/error states, keyboard-friendly, demo mode (prefilled sample buttons).

---

## Track C: Data / Eval / Security (`testdata/`, `eval/`, `backend/tests/`)

- [ ] **C1 (P0) Fake data kit.** 15–20 items in `testdata/images` and `testdata/docs`: fake bank statement, ID card mock-ups, UPI screenshot, handwritten-style note, multilingual (Hindi/Marathi) doc. **All fake.** `testdata/manifest.json` lists ground-truth secrets per file.
- [ ] **C2 (P0) Attack files.** 6 files in `testdata/attacks`: instruction override, role hijack, exfiltration request, hidden/white text PDF, tool-abuse, benign look-alike (false-positive check) + 4 benign docs.
- [ ] **C3 (P0) Leak tests.** pytest: run pipeline with mocked cloud, assert zero raw findings in payloads, ledger and logs.
- [ ] **C4 (P0) `eval/run_eval.py`.** Shield recall/precision, Guard block/FP rate, red-team risk, latency → `eval/results.md`. Run at 5:00 and paste numbers into the deck.

---

- [ ] **C5 (P0) Ablation.** Add to `eval/run_eval.py`: regex-only vs regex+Gemma recall by category; put the table in `eval/results.md`.
- [ ] **C6 (P0) Own validation data.** Run the 20-person poll, 3 short interviews and the timed manual-vs-Aegis redaction (see `docs/VALIDATION.md`). Record results there.

---

## Track D: Pitch / Docs

- [ ] **D1 (P0) README final** with screenshots/GIF, real eval numbers, limitations.
- [ ] **D2 (P0) Deck** (≤12 slides, playbook structure). Include architecture diagram and the Privacy Receipt screenshot.
- [ ] **D3 (P0) Backup demo video** (≤3 min) + screenshots, recorded at 5:00–5:30.
- [ ] **D4 (P0) Rehearsal.** 3 timed runs; assign speaker per section; Q&A drill using ROADMAP questions.

---

## Track E: Browser extension (`extension/`, P2 stretch, hard stop 5:00)

- [ ] **E1 (P2) MV3 skeleton.** `manifest.json` (host_permissions for chat sites and `http://localhost:8000/*`), `content.js`, `background.js`.
- [ ] **E2 (P2) Paste intercept.** Capture-phase listener, send text to background, call `/api/shield/text`, overlay with original vs redacted.
- [ ] **E3 (P2) Insert/copy.** “Insert redacted” via `execCommand('insertText')`; fallback “Copy redacted”. Text only.

---

## Definition of done (core)
- [ ] Shield works on text and images; cloud payload never contains raw findings (tested).
- [ ] Guard blocks ≥5/6 seeded attacks.
- [ ] Ledger verifies and fails on tamper.
- [ ] Attack-then-defend flow works (live or scripted fallback).
- [ ] README, eval numbers, backup video exist.

## Copy-paste starter prompts for Antigravity (Planning mode)

**Backend agent:** “Read AGENTS.md, docs/TRD.md and docs/TASKS.md. Implement tasks A1 and A2 only. Follow the stack in TRD §1. Write pytest tests with mocked HTTP. Show me the plan first. Do not add dependencies beyond `requirements.txt` without asking.”

**Frontend agent:** “Read AGENTS.md, docs/TRD.md §4, §5, §14 and docs/TASKS.md. Implement B1 and B2 with a typed API client that mirrors the Pydantic models. Use mock data until the backend endpoints exist. Dark security-console style.”

**Data agent:** “Read docs/TASKS.md Track C. Generate synthetic **fake** test images and documents with Python (Pillow/reportlab) and a `testdata/manifest.json` ground-truth file. Never use real personal data.”
