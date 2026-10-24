/**
 * Scene 7: LocalOnlyScene — Interactive LOCAL_ONLY toggle and network boundary diagram
 */
import { useState, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { Reveal } from '@/components/Reveal'
import { Laptop, Cloud, ShieldCheck, ArrowRight, XCircle, CheckCircle2, Lock } from 'lucide-react'

export function LocalOnlyScene() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-15% 0px' })
  const [localOnly, setLocalOnly] = useState<boolean>(true)

  return (
    <div className="section-paper py-32 px-6 md:px-12 lg:px-20 border-t border-paper/10" ref={ref}>
      <div className="max-w-4xl mx-auto">
        <Reveal>
          <div className="flex items-center gap-3 mb-6">
            <span className="w-8 h-px bg-signal" />
            <span className="font-mono text-xs text-signal tracking-widest uppercase font-bold">Data Sovereignty</span>
          </div>
        </Reveal>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <Reveal delay={0.1}>
              <h2
                className="font-display text-paper mb-4"
                style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', lineHeight: '1.0', letterSpacing: '-0.03em' }}
              >
                You control the boundary.
              </h2>
            </Reveal>

            <Reveal delay={0.2}>
              <p className="font-sans text-paper/70 text-base leading-relaxed max-w-xl">
                Flip the local-only switch to cut all network calls. Redact and scan with
                on-device Gemma 4 E4B models, or allow cloud AI to process sanitized tokens only.
              </p>
            </Reveal>
          </div>

          {/* Master Toggle */}
          <Reveal delay={0.3}>
            <div className="bg-ink-2 border border-paper/15 p-3 rounded-sm flex items-center gap-4 self-start md:self-auto shadow-xl">
              <div>
                <div className="font-mono text-xs font-bold text-paper">LOCAL_ONLY</div>
                <div className="font-sans text-[11px] text-paper/60">
                  {localOnly ? 'Air-gapped mode active' : 'Hybrid sanitization mode'}
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={localOnly}
                onClick={() => setLocalOnly(!localOnly)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-signal ${
                  localOnly ? 'bg-safe' : 'bg-paper/20'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-paper shadow ring-0 transition duration-200 ease-in-out ${
                    localOnly ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </Reveal>
        </div>

        {/* Interactive Architecture Diagram */}
        <div className="border border-paper/15 rounded-sm bg-ink-2 p-6 md:p-10 mb-12 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-11 gap-6 items-center">
            {/* Left: Local Device Node */}
            <div className="md:col-span-5 border border-paper/15 bg-ink rounded-sm p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Laptop size={18} className="text-paper" />
                  <span className="font-mono text-xs font-bold text-paper">YOUR WORKSTATION</span>
                </div>
                <span className="font-mono text-[10px] text-safe bg-safe/10 border border-safe/30 px-2 py-0.5 rounded font-bold">
                  LOCAL INSTANCE
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="border border-paper/10 bg-ink-2 p-3 rounded-sm">
                  <div className="text-paper/40 text-[10px] uppercase tracking-wider mb-1">Local Model</div>
                  <div className="font-bold text-paper flex items-center justify-between">
                    <span>Gemma 4 E4B (Int4 quantized)</span>
                    <span className="text-[10px] text-paper/50 font-normal">~2.4 GB VRAM</span>
                  </div>
                </div>

                <div className="border border-paper/10 bg-ink-2 p-3 rounded-sm">
                  <div className="text-paper/40 text-[10px] uppercase tracking-wider mb-1">Local Storage</div>
                  <div className="text-paper flex items-center justify-between">
                    <span>SQLite Ledger (Append-only)</span>
                    <span className="text-safe text-[10px] font-bold">No raw PII</span>
                  </div>
                </div>

                <div className="border border-paper/10 bg-ink-2 p-3 rounded-sm">
                  <div className="text-paper/40 text-[10px] uppercase tracking-wider mb-1">Execution Surface</div>
                  <div className="text-paper/90">CLI daemon at localhost:8000</div>
                </div>
              </div>
            </div>

            {/* Middle: Firewall Boundary */}
            <div className="md:col-span-2 flex flex-col items-center justify-center py-4 text-center">
              <div className="h-8 w-px bg-line mb-2" />
              <div
                className={`p-2.5 rounded-full border transition-colors ${
                  localOnly
                    ? 'border-safe bg-safe/10 text-safe'
                    : 'border-muted/30 bg-paper-2 text-ink'
                }`}
              >
                {localOnly ? <Lock size={18} /> : <ArrowRight size={18} />}
              </div>
              <div className="font-mono text-[10px] uppercase font-bold tracking-wider mt-2">
                {localOnly ? (
                  <span className="text-safe">AIR GAP</span>
                ) : (
                  <span className="text-muted">SANITIZED EGRESS</span>
                )}
              </div>
              <div className="h-8 w-px bg-line mt-2" />
            </div>

            {/* Right: Cloud Node */}
            <div
              className={`md:col-span-4 border rounded-sm p-6 transition-all duration-300 relative ${
                localOnly
                  ? 'border-line/40 bg-paper-2/40 opacity-40 grayscale'
                  : 'border-line bg-paper/50 opacity-100'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Cloud size={18} className="text-ink" />
                  <span className="font-mono text-xs font-bold text-ink">REMOTE AI</span>
                </div>
                {localOnly ? (
                  <span className="font-mono text-[10px] text-signal bg-signal/10 border border-signal/20 px-2 py-0.5 rounded">
                    BLOCKED
                  </span>
                ) : (
                  <span className="font-mono text-[10px] text-caution bg-caution/10 border border-caution/20 px-2 py-0.5 rounded">
                    SANITIZED ONLY
                  </span>
                )}
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="border border-line/60 bg-surface/80 p-3 rounded-sm">
                  <div className="text-muted text-[10px] uppercase tracking-wider mb-1">Provider</div>
                  <div className="font-semibold text-ink">Cloud API (Claude, OpenAI, Gemini)</div>
                </div>

                <div className="border border-line/60 bg-surface/80 p-3 rounded-sm">
                  <div className="text-muted text-[10px] uppercase tracking-wider mb-1">Payload Sent</div>
                  <div className="text-ink">
                    {localOnly ? (
                      <span className="text-signal">0 bytes (connection severed)</span>
                    ) : (
                      <span className="text-safe">[REDACTED] tokens only</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Policy Banner */}
          <div className="mt-8 border-t border-line pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs">
            <div className="flex items-center gap-2">
              {localOnly ? (
                <>
                  <CheckCircle2 size={16} className="text-safe flex-shrink-0" />
                  <span className="text-ink">
                    Air-gapped guarantee: Zero network egress. All redactions and scans run via local Gemma.
                  </span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} className="text-caution flex-shrink-0" />
                  <span className="text-ink">
                    Two-way firewall active: Secrets redacted locally before egress; LLM responses scanned on return.
                  </span>
                </>
              )}
            </div>
            <div className="text-muted text-[11px] font-sans">
              Rule enforced by local proxy listener
            </div>
          </div>
        </div>

        {/* Feature comparison table */}
        <Reveal delay={0.4}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse font-sans text-xs text-left">
              <thead>
                <tr className="border-b border-line font-mono text-[11px] text-muted">
                  <th className="py-2.5 pr-4 uppercase tracking-wider">Property</th>
                  <th className="py-2.5 px-4 uppercase tracking-wider">Local-Only Mode</th>
                  <th className="py-2.5 pl-4 uppercase tracking-wider">Cloud Hybrid Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60 font-mono text-xs">
                <tr>
                  <td className="py-3 pr-4 font-semibold text-ink">Network Access</td>
                  <td className="py-3 px-4 text-safe font-bold">100% Offline (0 bytes)</td>
                  <td className="py-3 pl-4 text-muted">TLS to whitelisted providers</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-semibold text-ink">Data Scrubbing</td>
                  <td className="py-3 px-4 text-ink">Gemma 4 E4B + Regex Regexes</td>
                  <td className="py-3 pl-4 text-ink">Gemma 4 E4B + Regex Regexes</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-semibold text-ink">Prompt Ingestion</td>
                  <td className="py-3 px-4 text-ink">Local inference runner</td>
                  <td className="py-3 pl-4 text-ink">Target cloud model receives [TAGS]</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-semibold text-ink">Audit Verification</td>
                  <td className="py-3 px-4 text-ink">Local SHA-256 Hash Chain</td>
                  <td className="py-3 pl-4 text-ink">Local SHA-256 Hash Chain</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
