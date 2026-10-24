/**
 * Scene 6: ExtensionScene — Browser extension zero-click intercept demo
 */
import { useState, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { Reveal } from '@/components/Reveal'
import { chipVariants, dur, ease } from '@/lib/motion'
import { Shield, ShieldAlert, Check, ChevronDown, ChevronUp, RefreshCw, ExternalLink } from 'lucide-react'

type ExtensionMode = 'intercepted' | 'redacted' | 'original'

export function ExtensionScene() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-15% 0px' })
  const [activeSite, setActiveSite] = useState<'chatgpt' | 'claude' | 'gemini'>('chatgpt')
  const [mode, setMode] = useState<ExtensionMode>('intercepted')
  const [showDetails, setShowDetails] = useState<boolean>(false)

  const sites = {
    chatgpt: {
      name: 'ChatGPT',
      url: 'https://chatgpt.com',
      aiName: 'ChatGPT',
      placeholder: 'Message ChatGPT...',
    },
    claude: {
      name: 'Claude',
      url: 'https://claude.ai/new',
      aiName: 'Claude 3.5 Sonnet',
      placeholder: 'Reply to Claude...',
    },
    gemini: {
      name: 'Gemini',
      url: 'https://gemini.google.com/app',
      aiName: 'Gemini 1.5 Pro',
      placeholder: 'Ask Gemini...',
    },
  }

  const site = sites[activeSite]

  return (
    <div className="section-paper py-32 px-6 md:px-12 lg:px-20 border-t border-paper/10 relative overflow-hidden" ref={ref} id="extension">
      <div className="max-w-4xl mx-auto relative z-10">
        <Reveal>
          <div className="flex items-center gap-3 mb-6">
            <span className="w-8 h-px bg-signal" />
            <span className="font-mono text-xs text-signal tracking-widest uppercase font-bold">Browser Extension</span>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <h2
            className="font-display text-paper mb-4"
            style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', lineHeight: '1.0', letterSpacing: '-0.03em' }}
          >
            Zero-click interception in your browser.
          </h2>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="font-sans text-paper/70 text-base leading-relaxed max-w-xl mb-12">
            The Aegis extension intercepts your clipboard before it touches the prompt box.
            Runs on Chrome MV3, contacts <span className="font-mono text-paper font-bold text-xs bg-ink-2 px-1.5 py-0.5 rounded border border-paper/15">localhost:8000</span> only,
            and never sends a single byte to remote analytics.
          </p>
        </Reveal>

        {/* 3D Browser Mock Container */}
        <div className="mb-12">
          <div className="browser-chrome shadow-2xl border border-paper/20 bg-ink-2">
            {/* Top chrome bar */}
            <div className="browser-bar justify-between bg-ink border-b border-paper/10">
              <div className="flex items-center gap-2">
                <div className="browser-dot bg-paper/20" />
                <div className="browser-dot bg-paper/20" />
                <div className="browser-dot bg-paper/20" />
              </div>

              {/* URL bar */}
              <div className="flex items-center gap-2 bg-ink-2 px-4 py-1.5 rounded text-xs font-mono text-paper/80 border border-paper/15 max-w-sm w-full mx-4">
                <span className="text-safe text-[10px]">🔒</span>
                <span className="truncate">{site.url}</span>
              </div>

              {/* Site switcher tabs */}
              <div className="flex items-center gap-1 font-mono text-xs">
                {(['chatgpt', 'claude', 'gemini'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setActiveSite(s)}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      activeSite === s
                        ? 'bg-paper text-ink font-bold shadow'
                        : 'text-paper/40 hover:text-paper'
                    }`}
                  >
                    {s === 'chatgpt' ? 'ChatGPT' : s === 'claude' ? 'Claude' : 'Gemini'}
                  </button>
                ))}
              </div>
            </div>

            {/* Browser inner viewport */}
            <div className="p-6 md:p-8 bg-ink min-h-[380px] flex flex-col justify-between border-t border-paper/5">
              {/* Mock chat conversation header */}
              <div className="border-b border-paper/10 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-signal flex items-center justify-center font-display font-bold text-ink text-sm">
                    {site.name[0]}
                  </div>
                  <div>
                    <div className="font-sans font-semibold text-xs text-paper">{site.aiName}</div>
                    <div className="font-mono text-[10px] text-paper/40">Direct Session Intercepted</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-safe font-bold">Aegis Guard active</span>
                  <span className="w-2 h-2 rounded-full bg-safe animate-pulse" />
                </div>
              </div>

              {/* Mock conversation body */}
              <div className="py-6 space-y-4 font-sans text-xs">
                <div className="bg-ink-2 border border-paper/10 p-3.5 rounded-sm max-w-md text-paper/90 leading-relaxed">
                  Paste any customer correspondence or diagnostic log below to analyze root causes.
                </div>
              </div>

            {/* Composer area with Aegis intercept chip */}
            <div className="relative mt-auto pt-4">
              {/* THE AEGIS CHIP OVERLAY */}
              <AnimatePresence>
                {mode === 'intercepted' && (
                  <motion.div
                    className="absolute -top-14 left-4 right-4 md:right-auto z-20 flex flex-wrap items-center gap-2 bg-ink text-paper px-3 py-2 rounded-sm shadow-xl border border-line"
                    variants={chipVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <div className="flex items-center gap-1.5 font-mono text-xs">
                      <ShieldAlert size={14} className="text-signal" />
                      <span className="font-semibold text-signal">3 items found</span>
                      <span className="text-paper/50 text-[11px]">(NAME, PHONE, SSN)</span>
                    </div>

                    <div className="h-4 w-px bg-paper/20 mx-1 hidden sm:block" />

                    <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                      <button
                        onClick={() => setMode('redacted')}
                        className="bg-signal hover:bg-signal/90 text-paper font-mono text-[11px] font-semibold px-2.5 py-1 rounded-sm transition-all flex items-center gap-1"
                      >
                        Redact and paste
                      </button>
                      <button
                        onClick={() => setMode('original')}
                        className="hover:bg-paper/10 text-paper/70 hover:text-paper font-mono text-[11px] px-2 py-1 rounded-sm transition-colors"
                      >
                        Paste original
                      </button>
                      <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="text-paper/50 hover:text-paper p-1 transition-colors"
                        title="Show diff details"
                      >
                        {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Status banner when redacted or bypassed */}
              {mode === 'redacted' && (
                <div className="mb-2 flex items-center justify-between text-[11px] font-mono text-safe bg-safe/10 border border-safe/20 px-3 py-1.5 rounded-sm">
                  <div className="flex items-center gap-1.5">
                    <Check size={13} />
                    <span>Redacted locally with Gemma 4 E4B · Safe to submit to {site.name}</span>
                  </div>
                  <button
                    onClick={() => setMode('intercepted')}
                    className="text-muted hover:text-ink flex items-center gap-1 text-[10px]"
                  >
                    <RefreshCw size={10} /> Reset
                  </button>
                </div>
              )}

              {mode === 'original' && (
                <div className="mb-2 flex items-center justify-between text-[11px] font-mono text-signal bg-signal/10 border border-signal/20 px-3 py-1.5 rounded-sm">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert size={13} />
                    <span>Unredacted original pasted (User override)</span>
                  </div>
                  <button
                    onClick={() => setMode('intercepted')}
                    className="text-muted hover:text-ink flex items-center gap-1 text-[10px]"
                  >
                    <RefreshCw size={10} /> Reset
                  </button>
                </div>
              )}

              {/* Diff Popover if toggled */}
              <AnimatePresence>
                {showDetails && mode === 'intercepted' && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute -top-44 left-4 right-4 md:right-auto md:w-96 z-30 bg-ink-2 border border-paper/20 rounded-sm shadow-2xl p-3 font-mono text-xs"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-paper/10 mb-2 text-paper font-semibold">
                      <span>Inspection details</span>
                      <span className="text-[10px] text-paper/40">Local diff</span>
                    </div>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between text-paper">
                        <span className="line-through text-signal">John Miller</span>
                        <span className="text-safe">[NAME-1]</span>
                      </div>
                      <div className="flex justify-between text-paper">
                        <span className="line-through text-signal">415-555-0198</span>
                        <span className="text-safe">[PHONE-1]</span>
                      </div>
                      <div className="flex justify-between text-paper">
                        <span className="line-through text-signal">000-12-3456</span>
                        <span className="text-safe">[SSN-1]</span>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-paper/10 text-[10px] text-paper/40">
                      Text never leaves device until you approve redaction.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mock input box */}
              <div className="relative border border-paper/20 rounded-sm bg-ink-2 p-3 min-h-[90px] font-mono text-xs text-paper leading-relaxed flex flex-col justify-between focus-within:border-paper transition-colors">
                <div>
                  {mode === 'intercepted' && (
                    <span className="text-paper/40">
                      Paste intercepted. Waiting for action...
                    </span>
                  )}
                  {mode === 'original' && (
                    <span>
                      Please review diagnostic report for patient <span className="bg-signal/15 text-signal font-semibold px-1 rounded">John Miller</span>, phone <span className="bg-signal/15 text-signal font-semibold px-1 rounded">415-555-0198</span>, SSN <span className="bg-signal/15 text-signal font-semibold px-1 rounded">000-12-3456</span> before tomorrow morning.
                    </span>
                  )}
                  {mode === 'redacted' && (
                    <span>
                      Please review diagnostic report for patient{' '}
                      <span className="inline-block bg-ink text-paper font-mono text-[11px] px-1.5 py-0.5 rounded-sm mx-0.5">[NAME-1]</span>
                      , phone{' '}
                      <span className="inline-block bg-ink text-paper font-mono text-[11px] px-1.5 py-0.5 rounded-sm mx-0.5">[PHONE-1]</span>
                      , SSN{' '}
                      <span className="inline-block bg-ink text-paper font-mono text-[11px] px-1.5 py-0.5 rounded-sm mx-0.5">[SSN-1]</span>
                      {' '}before tomorrow morning.
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2 text-[11px] text-muted border-t border-line/40">
                  <span>Press ↵ to send</span>
                  <span className="text-[10px] font-sans">Aegis v0.1.0 (MV3)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Technical specs strip */}
        <Reveal delay={0.3}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 border-t border-line pt-8">
            <div className="space-y-1">
              <div className="font-mono text-xs font-semibold text-ink">Manifest V3</div>
              <div className="font-sans text-xs text-muted">Declarative background worker, isolated shadow DOM</div>
            </div>
            <div className="space-y-1">
              <div className="font-mono text-xs font-semibold text-ink">3 Domains Only</div>
              <div className="font-sans text-xs text-muted">openai.com, claude.ai, gemini.google.com</div>
            </div>
            <div className="space-y-1">
              <div className="font-mono text-xs font-semibold text-ink">No &lt;all_urls&gt;</div>
              <div className="font-sans text-xs text-muted">Never asks for blanket browser history or tabs</div>
            </div>
            <div className="space-y-1">
              <div className="font-mono text-xs font-semibold text-ink">Zero Telemetry</div>
              <div className="font-sans text-xs text-muted">No external pings, no Google Fonts, no trackers</div>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
