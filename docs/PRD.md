# PRD: Gemma Aegis

Version 1.0 · Hackathon build (6 hours) · Owner: team lead

## 1. One-liner
A local-first, two-way AI firewall: **Shield** stops sensitive data leaving to cloud AI, **Guard** stops hidden attacks reaching AI agents, **Ledger** proves what happened. Powered by Gemma 4.

## 2. Problem
**Core problem:** people do not mean to leak data; they share *whole documents* when the task needs only part of them, often on behalf of *other people* (patients, students, clients) who never agreed. The safe path (manual redaction, enterprise AI) is slower and costlier than the unsafe path (paste and hope).

**Root cause:** the safe path is harder than the unsafe path, and small organisations now face DPDP obligations (full compliance due 13 May 2027) without the tooling.

**Problem statement:** "Anyone who handles other people's documents (clinic desk, school office, tax-filing assistant) now wants AI help, but the only free AI tools require sending the raw document to a third party. Aegis lets AI help with sensitive documents without ever seeing the sensitive parts, on the user's own device."

Supporting facts (cite sources, label vendor studies as such): LayerX 2025 (77% of GenAI-using employees paste data; 82% of pastes from personal accounts), Cyberhaven, DPDP Rules 2025 timeline. No India-specific paste-leak data was found; validate with our own poll (see `docs/VALIDATION.md`).

Also:
- People paste screenshots, statements and ID documents into cloud AI tools, leaking Aadhaar/PAN numbers, phone numbers, bank and UPI details, names and addresses.
- Organisations (schools, clinics, small firms) often *cannot* use cloud AI on client data.
- AI agents that read web pages, PDFs and emails can be hijacked by hidden instructions (prompt injection).
- Existing DLP tools are cloud-based, expensive and not multimodal.

## 3. Target users
| Persona | Pain | What Aegis gives them |
|---|---|---|
| **Everyday user** (student, freelancer) | Pastes personal documents into chatbots | One-click redaction before sending |
| **Small clinic / school / law-firm staff** | Cannot send client data to cloud AI | Local-first pipeline plus audit trail |
| **Developer building AI agents** | Agent reads untrusted documents | Inbound scan with verdict and flagged spans |

Primary pitch persona: **small clinic or school administrator who wants AI help but cannot expose client data.**

## 3b. Form factor
Aegis is a **local-first web app** (React on localhost:5173 + FastAPI on localhost:8000) running on the user's own device. The browser extension is an **optional stretch** that calls the same local backend. Do **not** deploy publicly; that would contradict the privacy promise.

## 3c. Why users adopt it
Organisations: liability and DPDP readiness, plus a Privacy Receipt as proof. Individuals: speed (seconds vs minutes of manual redaction) and peace of mind. It is as fast as paste-and-hope and as safe as manual redaction.

## 4. Goals
1. Redact sensitive data from text **and images** locally with high recall.
2. Detect common prompt-injection attacks in documents and images before an agent reads them.
3. Provide a **verifiable** audit trail (hash-chained ledger) containing **no raw secrets**.
4. Make Gemma's value obvious: local multimodal model plus cloud model for sanitized heavy work.
5. Be demo-able in 3 minutes with a visible “wow” moment.

## 5. Non-goals
- Production-grade compliance certification (GDPR/DPDP/HIPAA claims).
- Perfect injection detection.
- Mobile apps, multi-user accounts, cloud hosting.
- **Malware/antivirus detection.** Guard detects prompt injection, not malware. We only reduce file risk (allowlist, size limit, PDF active-content refusal, temp-dir processing).
- Training or fine-tuning models.

## 6. Features and priority

| ID | Feature | Priority | Notes |
|---|---|---|---|
| F1 | **Shield (text)**: regex + Gemma detection, redaction, placeholders | P0 | Regex covers structured IDs; Gemma covers names, addresses, context |
| F2 | **Shield (image)**: detection with boxes (box mode) or OCR + blur (text mode) | P0 | Mode chosen after 30-min test |
| F3 | **Router**: decide local vs cloud via function-calling-style JSON | P0 | Cloud only gets sanitized input |
| F4 | **Guard**: injection verdict, attack types, flagged spans | P0 | Docs (txt/pdf) and images |
| F5 | **Ledger**: SQLite hash chain, `/verify` endpoint, tamper demo | P0 | Never stores raw sensitive data |
| F6 | **Attack-then-defend demo flow** | P0 | Scripted fallback for reliability |
| F7 | **Red-team verifier** with risk score (Low/Medium/High) | P1 | Attacker tries to recover redacted values |
| F8 | **Judge CTF** page + attempt counter/leaderboard | P1 | Outbound filter blocks leaks |
| F9 | **Reversible pseudonyms** (Person_A ↔ real name, restored locally) | P1 | Mapping lives in session memory only |
| F10 | **Browser extension** (paste intercept, text only) | P2 stretch | Hard stop; cut if core not solid |
| F11 | Voice notes (E4B audio, ≤30 s) | P3 | Only if everything else is done |
| F12 | Policy modes (School/Clinic/General) | P3 | Prompt presets only |
| F13 | **Upload safety checks**: type allowlist, magic bytes, size/time limits, PDF active-content refusal | P0 | Cheap, high credibility |
| F14 | **Ablation + own validation data** (regex-only vs regex+Gemma; 20-person poll; timed redaction) | P0 | Answers "isn't this just regex?" |

## 7. User stories and acceptance criteria

**F1/F2 Shield**
- *As a user, I upload a photo of a bank statement and see sensitive items highlighted and blurred.* 
  AC: ≥85% of seeded fake items found on the test set; redacted image contains no readable seeded values; findings listed by category.
- *As a user, I paste text and see placeholders such as `[PHONE_1]`.* 
  AC: structured IDs (Aadhaar, PAN, phone, email, UPI, card, IFSC) detected by regex with ≥95% recall on the test set.

**F3 Router**
- *As a user, my request is answered locally when simple and escalated when hard, and I can see why.* 
  AC: every cloud request payload passes a “no raw findings present” check; the decision and reason appear in the trace.

**F4 Guard**
- *As a developer, I scan a document and get a verdict.* 
  AC: ≥5 of 6 seeded attack files flagged SUSPICIOUS or MALICIOUS; ≥90% of benign files SAFE; flagged spans shown.

**F5 Ledger**
- AC: `/api/ledger/verify` returns `valid: true` for an untouched chain and `valid: false` plus the first broken index after a manual edit; no entry contains raw sensitive strings.

**F7 Red-team**
- AC: after redaction, the attacker's recovered fraction produces a risk label: Low (<10%), Medium (10–40%), High (>40%); High triggers a more aggressive re-redaction pass.

**F8 CTF**
- AC: a judge can submit prompts; any response containing the vault secret is blocked and counted as a failed attempt; attempt count is visible.

## 8. Success metrics (shown in the pitch)
- Shield recall / precision on N fake-data items (target ≥85% / ≥85%).
- Injection block rate on seeded attacks (target ≥5/6).
- Zero raw secrets in cloud payloads and in the ledger (asserted by tests).
- End-to-end latency for a typical image through Shield (report honestly).
- Ledger tamper detection works live.

## 9. Demo scenarios (3 minutes)
1. **Airplane-mode Shield:** fake bank statement → boxes and blur → Privacy Receipt → Wi-Fi on → cloud answer from sanitized text only.
2. **Attack-then-defend:** poisoned PDF hijacks a naive agent; Aegis Guard blocks it.
3. **Tamper test:** edit one ledger row → verification fails.
4. **CTF invite:** hand the judge the CTF page.

## 10. Risks
| Risk | Mitigation |
|---|---|
| E4B box detection unreliable | Text mode: Gemma + OCR + regex + Pillow blur |
| Injection detection inconsistent | Heuristics + Gemma, narrow to ~6 reliable attack types, scripted demo fallback |
| API or Wi-Fi failure | `LOCAL_ONLY=true`, backup video |
| LLM non-determinism in demo | Pre-tested fixtures, fixed seeds/temperature 0, recorded backup |
| Scope creep | Cut line in ROADMAP; extension is stretch |
| Misleading compliance claims | State limitations openly in pitch and README |

## 11. Judging alignment (playbook evaluator code)
- *Problem understanding:* privacy leak plus agent hijack, named persona.
- *Technical excellence:* hybrid local/cloud, multimodal, hash-chained audit.
- *Innovation:* two-way firewall, red-team loop, CTF.
- *Impact and feasibility:* clinics/schools; runs on a laptop.
- *Execution and presentation:* measured numbers, live demo, backup.
- *UX:* one-screen console with live trace.

## 12. Open-source commitment
Public GitHub repo, Apache-2.0 license, README, reproducible eval, all test data fake.
