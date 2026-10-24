# ROADMAP: Gemma Aegis (6-hour build)

Assumes a team of up to 4. Adjust if judging time is inside the 6 hours. Task IDs refer to `TASKS.md`.

## Roles
| Role | Owns |
|---|---|
| **A: Backend/Models** | Shield, Guard, Router, Cloud, Red-team (Track A) |
| **B: Frontend** | React console, trace, ledger, CTF UI (Track B) |
| **C: Data/Eval/Security** | Fake data kit, attack files, tests, eval numbers (Track C) |
| **D: Pitch/Extension** | Deck, demo script, README polish, extension if time (Tracks D/E) |
If you have 3 people: merge C+D. If 2: A+C and B+D, and drop the CTF.

## Timeline

| Time | Block | Goal | Tasks | Gate |
|---|---|---|---|---|
| 0:00–0:30 | **Kickoff + G0 checks** | Repo, env, verify-first checklist, decide box vs text mode | T0.1–T0.4 | **G0**: E4B works, boxes tested, cloud call works |
| 0:30–1:30 | **Shield core** | Text + image redaction end to end, UI upload + before/after | A1–A3, B1–B3, C1 | **G1**: redacted image shown in UI |
| 1:30–2:30 | **Guard + Router + Cloud** | Verdicts, local/cloud decision, sanitized cloud call | A4–A6, B4, C2 | **G2**: cloud payload leak test passes |
| 2:30–3:15 | **Ledger + live trace + attack demo** | Hash chain, SSE trace, naive agent vs Guard | A7–A8, B5–B6, C3 | **G3**: full flow demo-able (**core complete**) |
| 3:15–4:00 | **Red-team + CTF** | Risk score badge, CTF page | A9–A10, B7–B8 | **G4**: P1 features working |
| 4:00–5:00 | **Extension OR polish** | If G3+G4 solid → extension. Else polish/eval/bugs. **Hard stop 5:00.** | E1–E3 or P1–P3 | – |
| 5:00–5:30 | **Freeze** | Feature freeze, run eval, README, backup video | C4, D1–D3 | **G5**: backup video recorded |
| 5:30–6:00 | **Rehearse** | 3 timed run-throughs, Q&A drill | D4 | – |

## Gates (go / no-go)
- **G0 (0:30):** If E4B boxes are unreliable → set `DETECTION_MODE=text` and do not look back. If cloud model name fails → fix in AI Studio before continuing. If Ollama tool calling fails → use JSON router.
- **G1 (1:30):** If image redaction isn't working, do text-only demo and keep image as “in progress”; do not start Guard until Shield text works.
- **G3 (3:15):** Core must be done. If not, **cancel Red-team/CTF/extension** and finish Core + polish.
- **G5 (5:30):** No new features after this point. Only bug fixes.

## Cut line (drop in this order if behind)
1. Extension (E-track)
2. Reversible pseudonyms polish
3. CTF leaderboard (keep the basic CTF page)
4. Red-team re-redaction loop (keep the risk score)
5. Image Guard (keep text/PDF Guard)

**Never cut:** Shield, Guard, Ledger verify, attack-then-defend flow, README, backup video.

## Working rules (from the Hackathon Playbook)
- Plan before coding; build the core first; test continuously.
- Ship the 3 features that solve 80% of the pain; add-ons only if they boost the core.
- Don't vibe-code blindly: every teammate must be able to explain their module without the code.
- Prepare backup demo, screenshots and an offline alternative.
- Assign speaking parts early; rehearse Q&A.

## Demo script (3 min)
1. Hook (20 s): “People paste IDs and bank details into AI every day.”
2. Shield (60 s): airplane mode, fake bank statement, boxes and blur, Privacy Receipt, then Wi-Fi on and sanitized cloud answer.
3. Attack-then-defend (60 s): naive agent hijacked, Aegis blocks.
4. Proof (20 s): eval numbers and ledger tamper → verify fails.
5. Close (20 s): “It runs on your device, so you don't have to trust the cloud or the web.” Name one limitation yourself.

## Likely judge questions to rehearse
- What happens if the API goes down? → `LOCAL_ONLY`, local E4B.
- What is the model actually doing vs your regex? → Hybrid: regex for structured IDs, Gemma for context, names, handwriting, images, injection reasoning.
- Who is your first customer? → A small clinic or school admin that can't send data to cloud AI.
- How does it make money? → Self-hosted licence or per-seat browser extension + support.
- What didn't you build? → Be specific and honest.
- What happens after the hackathon? → Open-source project, policy packs, local fine-tuning.
