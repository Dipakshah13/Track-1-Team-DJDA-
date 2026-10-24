# VALIDATION: why Aegis, and proof we asked real people

## Problem statement
Anyone who handles other people's documents (clinic desk, school office, tax-filing assistant) now wants AI help, but the only free AI tools require sending the raw document to a third party. Aegis lets AI help with sensitive documents without ever seeing the sensitive parts, on the user's own device.

## Root cause (five whys)
1. AI is useful for document tasks, so people feed it whole documents.
2. Free AI tools accept everything with no friction or redaction.
3. Manual redaction is slow; users don't know what is hidden in a screenshot/PDF.
4. Safe options (enterprise or self-hosted AI) are costly or technical, so small orgs use personal accounts.
5. DPDP makes organisations accountable (full compliance 13 May 2027) but small orgs lack tooling.
**Main cause: the safe path is harder than the unsafe path.**

## Evidence (label sources; vendor studies have incentives)
- LayerX Enterprise AI & SaaS Data Security Report 2025: 45% of enterprise employees use GenAI; 77% of those paste data; 82% of pastes from personal accounts.
- Cyberhaven Labs (earlier study): 4.7% of employees pasted confidential data; sensitive = 11% of pastes. (2026 figure of 39.7% is from a secondary summary: verify original.)
- Samsung temporarily banned ChatGPT after a 2023 incident.
- DPDP Rules 2025: full compliance 13 May 2027; up to ₹250 crore for failing reasonable security safeguards; graded penalties for small businesses.
- India fraud context (NOT causal): ₹19,812.96 crore lost, 21.77 lakh complaints in 2025; UPI fraud ₹805 crore Jan–Nov 2025. Shows value of personal data to criminals only.
- GAP: no India-specific paste-leak data found. Our own poll fills it.

## Honest weaknesses
Enterprise DLP competitors exist (our edge: free, open source, local, multimodal, Indian IDs/languages); adoption by small Indian orgs is a hypothesis; stats are vendor-sourced; Guard is a second story: keep Shield as the hero.

## Poll (20 people, 5 minutes) — record results here
1. Have you pasted a bank statement, ID, marks card or medical report into ChatGPT/Gemini/another AI? (Y/N)
2. Did you remove anything first? (Y/N)
3. Did you know it could contain details beyond what you needed? (Y/N)
4. Would you use a tool that removes sensitive parts on your device first? (Y/N)
5. What would stop you? (free text)
Result: ___ of 20 said yes to Q1; ___ removed anything; ___ would use it.

## Interviews (3 people who handle others' documents)
Ask: Do you use AI at work? What documents? What stops you? What would you need? Keep one quote (with permission).

## Timed test
Manual redaction of one fake bank statement: ___ s. Aegis: ___ s.

## Pitch lines
- "AI can help with your documents. It doesn't need your Aadhaar number to do it."
- "The person pasting the document is rarely the person it belongs to."
- If "they chose to share": "They chose to share a bank statement to get a summary, not the account number, address and phone printed on it."
- Not antivirus: "Guard protects the AI from hidden instructions. For files we allowlist types, never execute content, refuse PDFs with embedded scripts, and process in a temp folder."
