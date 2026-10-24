/**
 * ShieldScene — Scene 3: 3D Perspective Outbound PII Redaction
 * 3D Tilting synthetic statement with laser sweep, live bounding tags, and before/after scrubber.
 */
import { useRef, useState } from 'react'
import { motion, useReducedMotion, useInView } from 'framer-motion'
import { Reveal } from '@/components/Reveal'
import { Card3D } from '@/components/Card3D'
import { Shield, ShieldCheck, Eye, EyeOff, Layers, Terminal } from 'lucide-react'

const STATEMENT_FIELDS = [
  { label: 'Account holder', value: 'James Harrington', category: 'NAME', placeholder: '[NAME-1]' },
  { label: 'Account number', value: 'GB29NWBK60161331926819', category: 'IBAN', placeholder: '[IBAN-1]' },
  { label: 'Sort code', value: '60-16-13', category: 'OTHER', placeholder: '[SORT-1]' },
  { label: 'Phone', value: '+44 7911 123456', category: 'PHONE', placeholder: '[PHONE-1]' },
  { label: 'Address', value: '14 Elm Street, EC1A', category: 'ADDRESS', placeholder: '[ADDR-1]' },
]

export function ShieldScene() {
  const shouldReduceMotion = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-15% 0px' })
  const [revealedCount, setRevealedCount] = useState(STATEMENT_FIELDS.length)
  const [sliderPos, setSliderPos] = useState(50)
  const [unmaskedIdx, setUnmaskedIdx] = useState<number | null>(null)

  return (
    <div className="section-paper py-32 px-6 md:px-12 lg:px-20 border-t border-paper/10 relative overflow-hidden" ref={ref}>
      {/* Background illumination */}
      <div
        className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 pointer-events-none rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,75,43,0.05) 0%, transparent 70%)' }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        <Reveal>
          <div className="flex items-center gap-3 mb-6">
            <span className="w-8 h-px bg-signal" />
            <span className="font-mono text-xs text-signal tracking-widest uppercase font-bold">
              Outbound Firewall · Shield Engine
            </span>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <h2
            className="font-display text-paper mb-4"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', lineHeight: '1.02', letterSpacing: '-0.03em' }}
          >
            Redacts on your device, <br className="hidden sm:inline" />
            before anything leaves.
          </h2>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="font-sans text-paper/70 text-base leading-relaxed max-w-2xl mb-16">
            Paste prompts, documents, or scanned IDs. Aegis executes local regex and Gemma 4 E4B inference
            directly on your hardware, substituting sensitive fields with cryptographic placeholders.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: 3D Tilting Document Card (7 cols) */}
          <div className="lg:col-span-7">
            <Card3D glowColor="rgba(255,75,43,0.2)">
              <div className="border border-paper/20 rounded-sm bg-ink-2 p-6 sm:p-8 font-mono text-xs shadow-2xl relative overflow-hidden border-glow-signal">
                {/* Header Strip */}
                <div className="flex items-center justify-between border-b border-paper/15 pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Terminal size={14} className="text-signal" />
                    <span className="font-bold tracking-widest text-paper text-xs uppercase">
                      BANK STATEMENT — LOCAL OCR BUFFER
                    </span>
                  </div>
                  <span className="bg-safe/15 text-safe border border-safe/30 px-2 py-0.5 rounded text-[10px] font-bold">
                    AIR-GAP CLEANSED
                  </span>
                </div>

                {/* Laser scan line animation */}
                <motion.div
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-signal to-transparent pointer-events-none"
                  animate={{ top: ['15%', '85%', '15%'] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Fields List */}
                <div className="space-y-4">
                  {STATEMENT_FIELDS.map((field, i) => (
                    <div
                      key={field.label}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded bg-ink/70 border border-paper/10 hover:border-signal/40 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-paper/40 text-[11px] w-32">{field.label}:</span>
                        <span className="font-semibold text-paper/90">
                          {unmaskedIdx === i ? field.value : field.value.replace(/./g, '•')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        {/* Redaction Tag */}
                        <motion.span
                          className="bg-ink border border-signal/50 text-signal font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow"
                          initial={{ scale: 0.9 }}
                          animate={{ scale: 1 }}
                        >
                          {field.placeholder}
                        </motion.span>
                        <button
                          onClick={() => setUnmaskedIdx(unmaskedIdx === i ? null : i)}
                          className="text-paper/40 hover:text-paper p-1"
                          title="Inspect original locally"
                        >
                          {unmaskedIdx === i ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Card Footer Telemetry */}
                <div className="mt-6 pt-4 border-t border-paper/10 flex items-center justify-between text-[10px] text-paper/40">
                  <span>Inference: Gemma 4 E4B (Int4 Quantized)</span>
                  <span className="text-safe">0 Bytes Leaked to Remote Cloud</span>
                </div>
              </div>
            </Card3D>
          </div>

          {/* Right: Live Interactive Findings & Before/After Slider (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Findings List Card */}
            <div className="border border-paper/15 bg-ink-2 rounded-sm p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-paper/10 pb-3">
                <span className="font-mono text-xs font-bold text-paper uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck size={14} className="text-safe" />
                  <span>Sanitized Tokens ({STATEMENT_FIELDS.length})</span>
                </span>
                <span className="font-mono text-[10px] text-safe font-bold">100% RECALLED</span>
              </div>

              <div className="space-y-2">
                {STATEMENT_FIELDS.map((field) => (
                  <div
                    key={field.label}
                    className="flex items-center justify-between p-2 rounded bg-ink border border-paper/5 font-mono text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="bg-signal/15 text-signal border border-signal/30 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {field.category}
                      </span>
                      <span className="text-paper/80 text-[11px]">{field.label}</span>
                    </div>
                    <span className="text-safe text-[11px] font-semibold">REDACTED</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Before/After Split Scrubber */}
            <div className="border border-paper/15 bg-ink-2 rounded-sm p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="font-bold text-paper flex items-center gap-1.5">
                  <Layers size={13} className="text-signal" />
                  <span>Interactive Visual Scrubber</span>
                </span>
                <span className="text-paper/40 text-[10px]">Slide to Inspect</span>
              </div>

              {/* Visual Scrubber Window */}
              <div className="relative h-28 bg-ink border border-paper/15 rounded overflow-hidden select-none font-mono text-xs p-3">
                {/* Original View (Underneath) */}
                <div className="text-signal leading-relaxed">
                  <div>Account: James Harrington (GB29NWBK60161331926819)</div>
                  <div>Phone: +44 7911 123456 | Sort: 60-16-13</div>
                  <div>Address: 14 Elm Street, EC1A</div>
                </div>

                {/* Redacted View (Overlaid with clip-path) */}
                <div
                  className="absolute inset-0 bg-ink-2 p-3 text-safe leading-relaxed border-l-2 border-paper"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="whitespace-nowrap">
                    Account: [NAME-1] ([IBAN-1])
                  </div>
                  <div className="whitespace-nowrap">
                    Phone: [PHONE-1] | Sort: [SORT-1]
                  </div>
                  <div className="whitespace-nowrap">
                    Address: [ADDR-1]
                  </div>
                </div>
              </div>

              {/* Slider Control */}
              <input
                type="range"
                min="10"
                max="90"
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="w-full accent-signal cursor-pointer"
              />
              <div className="flex justify-between font-mono text-[10px] text-paper/40">
                <span>Original Raw Data</span>
                <span>Sanitized Egress Output</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
