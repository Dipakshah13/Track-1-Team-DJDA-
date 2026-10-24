/**
 * HeroScene — Scene 1: Dark ink, full viewport.
 * Left: headline word-by-word masked reveal, sub, CTAs.
 * Right: live loop of chat composer with scan → redact animation.
 * Loops every ~9s, pauses off-screen and under reduced motion.
 */
import { useState, useEffect, useRef } from 'react'
import { motion, useReducedMotion, useInView, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Github } from 'lucide-react'
import { wordMaskVariants, staggerContainerVariants, dur, ease } from '@/lib/motion'

// A/B headline option A: "Your secrets stop here."
// A/B headline option B: "Redact before you send."
const HEADLINE_WORDS = ['Your', 'secrets', 'stop', 'here.']

// Fake chat composer content — synthetic data, no real PII
const COMPOSER_TEXT = `Hi, can you draft a dispute letter? My name is James Harrington, account GB29NWBK60161331926819. Call me on +44 7911 123456.`

interface Span {
  text: string
  label?: string
  isRedacted?: boolean
}

// Parsed spans for the composer text
const SPANS_ORIGINAL: Span[] = [
  { text: 'Hi, can you draft a dispute letter? My name is ' },
  { text: 'James Harrington', label: 'NAME' },
  { text: ', account ' },
  { text: 'GB29NWBK60161331926819', label: 'IBAN' },
  { text: '. Call me on ' },
  { text: '+44 7911 123456', label: 'PHONE' },
  { text: '.' },
]

type LoopState = 'typing' | 'scanning' | 'redacting' | 'done' | 'idle'

const CHAR_DELAY = 30 // ms per character

export function HeroScene() {
  const shouldReduceMotion = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { amount: 0.3 })

  const [loopState, setLoopState] = useState<LoopState>('idle')
  const [typedLength, setTypedLength] = useState(0)
  const [showScan, setShowScan] = useState(false)
  const [redactedIndices, setRedactedIndices] = useState<number[]>([])
  const [sentCount, setSentCount] = useState<number | null>(null)
  const loopRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // If reduced motion, just show the final redacted state
  useEffect(() => {
    if (shouldReduceMotion) {
      setTypedLength(COMPOSER_TEXT.length)
      setRedactedIndices([1, 3, 5])
      setSentCount(0)
      setLoopState('done')
    }
  }, [shouldReduceMotion])

  const runLoop = async () => {
    if (!isInView || shouldReduceMotion) return

    // Reset
    setLoopState('typing')
    setTypedLength(0)
    setShowScan(false)
    setRedactedIndices([])
    setSentCount(null)

    // Type out the text
    for (let i = 0; i <= COMPOSER_TEXT.length; i++) {
      if (!isInView) return
      setTypedLength(i)
      await new Promise(r => { loopRef.current = setTimeout(r, CHAR_DELAY) })
    }

    // Pause then scan
    await new Promise(r => { loopRef.current = setTimeout(r, 600) })
    setLoopState('scanning')
    setShowScan(true)
    await new Promise(r => { loopRef.current = setTimeout(r, 1200) })

    // Redact spans one by one
    setLoopState('redacting')
    setShowScan(false)
    for (let i = 0; i < SPANS_ORIGINAL.length; i++) {
      if (SPANS_ORIGINAL[i].label) {
        setRedactedIndices(prev => [...prev, i])
        await new Promise(r => { loopRef.current = setTimeout(r, 300) })
      }
    }

    // Show "sent" state
    await new Promise(r => { loopRef.current = setTimeout(r, 400) })
    setSentCount(0)
    setLoopState('done')

    // Wait then restart
    await new Promise(r => { loopRef.current = setTimeout(r, 4000) })
    runLoop()
  }

  useEffect(() => {
    if (isInView && !shouldReduceMotion) {
      const t = setTimeout(runLoop, 800)
      return () => {
        clearTimeout(t)
        if (loopRef.current) clearTimeout(loopRef.current)
      }
    }
  }, [isInView, shouldReduceMotion])

  const displayedText = COMPOSER_TEXT.slice(0, typedLength)

  return (
    <div
      ref={containerRef}
      className="section-ink cyber-matrix-grid min-h-screen pt-24 pb-16 px-6 md:px-12 lg:px-20 relative overflow-hidden flex items-center"
    >
      {/* Dynamic Cyber Radar & Tactical Coordinate Lines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle 800px at 50% 30%, rgba(255,75,43,0.06) 0%, transparent 75%)',
        }}
        aria-hidden="true"
      />

      {/* Floating Tactical Coordinate Badges */}
      <div className="absolute top-28 right-12 hidden lg:flex items-center gap-3 font-mono text-[10px] text-paper/30 select-none">
        <span>LOC: LOCALHOST:8000</span>
        <span className="w-1 h-1 rounded-full bg-safe" />
        <span>SHA-256 VERIFIED</span>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* LEFT: Copy */}
        <div>
          {/* Eyebrow */}
          <motion.div
            className="font-mono text-xs text-paper/50 tracking-widest uppercase mb-8 flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <span className="w-8 h-px bg-signal inline-block" />
            <span>Local-first AI Firewall · Gemma 4</span>
            <span className="text-signal bg-signal/15 px-2 py-0.5 rounded text-[10px] border border-signal/30 font-bold">
              TWO-WAY
            </span>
          </motion.div>

          {/* Headline — word-by-word masked reveal */}
          <motion.h1
            className="font-display text-paper mb-8"
            style={{
              fontSize: 'clamp(3.5rem, 8vw, 7rem)',
              lineHeight: '0.92',
              letterSpacing: '-0.04em',
              fontVariationSettings: "'opsz' 144",
            }}
            variants={staggerContainerVariants}
            initial="hidden"
            animate="visible"
            aria-label="Your secrets stop here."
          >
            {HEADLINE_WORDS.map((word, i) => (
              <motion.span
                key={word}
                className="block overflow-hidden"
                variants={{
                  hidden: {},
                  visible: {},
                }}
              >
                <motion.span
                  className="block"
                  variants={wordMaskVariants}
                  custom={i}
                >
                  {word === 'stop' ? (
                    <span>{word} <span className="text-signal">here.</span></span>
                  ) : word === 'here.' ? null : word}
                  {word === 'here.' && null}
                </motion.span>
              </motion.span>
            ))}
          </motion.h1>

          {/* Sub */}
          <motion.p
            className="font-sans text-paper/70 text-lg leading-relaxed max-w-xl mb-10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            Aegis is a two-way firewall for AI. It runs on your device, redacts what you
            shouldn't share, and blocks what shouldn't reach your agents.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-wrap items-center gap-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <a href="#console" className="btn btn-primary gap-2 text-sm">
              Open the console
              <ArrowRight size={14} />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost-light gap-2 text-sm"
            >
              <Github size={14} />
              Read the code
            </a>
          </motion.div>

          {/* Meta line */}
          <motion.div
            className="mt-8 flex items-center gap-2 font-mono text-xs text-paper/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <span>Open source</span>
            <span className="w-px h-3 bg-paper/20" />
            <span>Apache-2.0</span>
            <span className="w-px h-3 bg-paper/20" />
            <span>Runs on Gemma 4</span>
            <span className="w-px h-3 bg-paper/20" />
            <span>Works offline</span>
          </motion.div>
        </div>

        {/* RIGHT: High-Impact Cyber-Security Firewall HUD */}
        <motion.div
          className="relative tactical-crosshair"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          aria-label="Live Aegis Firewall Boundary Telemetry"
          role="region"
        >
          {/* Top Live Telemetry Bar */}
          <div className="mb-2 flex items-center justify-between font-mono text-[10px] text-paper/70 bg-ink-2 px-3 py-1.5 rounded-t-sm border-t border-x border-paper/15 shadow-md">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-safe animate-pulse" />
              <span className="text-safe font-bold tracking-wide">DAEMON: ACTIVE</span>
              <span className="text-paper/20">|</span>
              <span className="text-paper/90">127.0.0.1:8000</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-signal font-bold">AIR-GAP: ENFORCED</span>
              <span className="text-paper/20">|</span>
              <span className="text-paper/90 font-semibold">GEMMA 4 E4B</span>
            </div>
          </div>

          {/* Main Tactical Box with vermilion border glow */}
          <div className="relative border border-paper/20 rounded-sm overflow-hidden bg-ink-2 shadow-2xl border-glow-signal">
            {/* HUD Header Bar */}
            <div className="px-4 py-2.5 border-b border-paper/10 flex items-center justify-between bg-ink">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-signal" />
                <span className="font-mono text-xs font-bold text-paper tracking-wider">
                  AEGIS PROTOCOL ENGINE v2.4
                </span>
              </div>

              {/* Mode indicator */}
              <div className="flex items-center gap-1 font-mono text-[10px]">
                <span className="bg-signal/20 text-signal border border-signal/40 px-2 py-0.5 rounded font-semibold uppercase">
                  {loopState === 'redacting' ? 'Scrubbing...' : loopState === 'done' ? 'Sanitized' : 'Intercepting'}
                </span>
              </div>
            </div>

            {/* Live Packet Waveform Bar */}
            <div className="h-1 bg-ink flex overflow-hidden">
              <motion.div
                className="h-full bg-signal"
                animate={{
                  width: ['10%', '65%', '100%', '40%', '85%'],
                  opacity: [0.4, 1, 0.7, 0.9, 0.5],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>

            {/* Prompt Interception Display Area */}
            <div className="relative p-5 min-h-[170px] bg-ink/90 font-mono text-xs text-paper/90 leading-relaxed border-b border-paper/10">
              <div className="text-[10px] text-paper/40 uppercase tracking-widest mb-2 flex items-center justify-between">
                <span>Outbound Prompt Stream</span>
                <span>Buffer: 100% In-Memory</span>
              </div>

              {loopState === 'typing' || loopState === 'idle' ? (
                <div>
                  <span className="text-paper/90">{displayedText}</span>
                  <span className="inline-block w-1.5 h-4 bg-signal ml-1 animate-pulse align-middle" />
                </div>
              ) : (
                <div className="space-y-1">
                  {SPANS_ORIGINAL.map((span, i) => {
                    if (span.label && redactedIndices.includes(i)) {
                      // Signature tactile RedactionBar
                      return (
                        <motion.span
                          key={i}
                          className="inline-flex items-center bg-ink border border-paper/30 text-paper font-mono text-xs px-2 py-0.5 mx-1 rounded-sm shadow-md font-bold"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          style={{ minWidth: '4.5em', transformOrigin: 'left center', display: 'inline-flex' }}
                          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <span className="text-signal text-[10px] mr-1">■</span>
                          {span.label}
                        </motion.span>
                      )
                    } else if (span.label && !redactedIndices.includes(i) && loopState === 'redacting') {
                      return (
                        <span key={i} className="text-signal bg-signal/20 px-1 py-0.5 rounded-sm font-semibold">
                          {span.text}
                        </span>
                      )
                    } else {
                      return <span key={i}>{span.text}</span>
                    }
                  })}
                </div>
              )}

              {/* Scanning Laser Beam */}
              <AnimatePresence>
                {showScan && (
                  <motion.div
                    className="absolute left-0 right-0 h-0.5 pointer-events-none"
                    style={{
                      background: 'linear-gradient(to right, transparent, #FF4B2B 30%, #FF4B2B 70%, transparent)',
                      boxShadow: '0 0 16px #FF4B2B',
                    }}
                    initial={{ top: '0%', opacity: 0 }}
                    animate={{ top: '100%', opacity: [0, 1, 1, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.0, ease: 'easeInOut' }}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Real-time Telemetry Stats Grid */}
            <div className="p-4 bg-ink-2 grid grid-cols-3 gap-3 border-t border-paper/10 text-left font-mono">
              <div className="border border-paper/10 bg-ink p-2 rounded-sm">
                <div className="text-[9px] text-paper/40 uppercase tracking-wider">PII Entities</div>
                <div className="text-sm font-bold text-signal flex items-center justify-between mt-0.5">
                  <span>3 Scanned</span>
                  <span className="text-[10px] text-safe font-normal">100% Redacted</span>
                </div>
              </div>

              <div className="border border-paper/10 bg-ink p-2 rounded-sm">
                <div className="text-[9px] text-paper/40 uppercase tracking-wider">Cloud Egress</div>
                <div className="text-sm font-bold text-safe flex items-center justify-between mt-0.5">
                  <span>0 Bytes Raw</span>
                  <span className="text-[10px] text-paper/40 font-normal">Air-Gapped</span>
                </div>
              </div>

              <div className="border border-paper/10 bg-ink p-2 rounded-sm">
                <div className="text-[9px] text-paper/40 uppercase tracking-wider">SHA-256 Stamp</div>
                <div className="text-xs font-semibold text-paper/70 truncate mt-1">
                  #3f8e1d2c...
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="px-4 py-3 bg-ink border-t border-paper/10 flex items-center justify-between font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-safe" />
                <span className="text-paper/70">
                  {loopState === 'done'
                    ? 'Payload sanitized · Safe for cloud inference'
                    : 'Aegis active · Monitoring clipboard & prompt'}
                </span>
              </div>
              <Link
                to="/console"
                className="bg-signal text-paper font-bold px-3 py-1.5 rounded-sm hover:bg-signal/90 transition-all flex items-center gap-1 text-[11px]"
              >
                <span>Launch Console</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {/* Real-time Detected Chips */}
          <AnimatePresence>
            {loopState === 'redacting' || loopState === 'done' ? (
              <motion.div
                className="flex flex-wrap items-center gap-2 mt-3 font-mono text-xs"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-[10px] text-paper/40 uppercase tracking-widest">
                  Neutralized:
                </span>
                {['NAME: John Miller', 'IBAN: DE89 3704 0044', 'PHONE: +1 (415) 555-0198'].map((label, i) => (
                  <motion.span
                    key={label}
                    className="bg-ink border border-signal/40 text-signal font-mono text-[10px] px-2 py-0.5 rounded-sm shadow"
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.1, type: 'spring', stiffness: 400, damping: 28 }}
                  >
                    ✓ {label}
                  </motion.span>
                ))}
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Corner crop marks decoration */}
          <div
            className="absolute -top-2 -left-2 w-4 h-4 border-t border-l border-paper/20"
            aria-hidden="true"
          />
          <div
            className="absolute -top-2 -right-2 w-4 h-4 border-t border-r border-paper/20"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-2 -left-2 w-4 h-4 border-b border-l border-paper/20"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-2 -right-2 w-4 h-4 border-b border-r border-paper/20"
            aria-hidden="true"
          />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-paper/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        aria-hidden="true"
      >
        <span className="font-mono text-xs tracking-widest uppercase">Scroll</span>
        <motion.div
          className="w-px h-8 bg-gradient-to-b from-paper/30 to-transparent"
          animate={{ scaleY: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </div>
  )
}
