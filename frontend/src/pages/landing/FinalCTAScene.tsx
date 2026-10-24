/**
 * Scene 9: FinalCTAScene — Full dark ink finish with primary actions & transparent footer
 */
import { Link } from 'react-router-dom'
import { ArrowRight, Github, Chrome, Shield, Terminal } from 'lucide-react'
import { Reveal } from '@/components/Reveal'

export function FinalCTAScene() {
  return (
    <footer className="bg-ink cyber-matrix-grid text-paper py-28 px-6 md:px-12 lg:px-20 border-t border-paper/10 relative overflow-hidden">
      <div className="max-w-4xl mx-auto">
        {/* Main CTA Block */}
        <div className="text-center sm:text-left mb-24">
          <Reveal>
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-6">
              <span className="w-8 h-px bg-signal" />
              <span className="font-mono text-xs text-signal tracking-widest uppercase">
                Take Control
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h2
              className="font-display text-paper mb-6 font-normal tracking-tight"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 5.5rem)', lineHeight: '1.02', letterSpacing: '-0.03em' }}
            >
              See what leaves <br className="hidden sm:inline" />
              your device.
            </h2>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="font-sans text-paper/70 text-lg leading-relaxed max-w-xl mb-10">
              Run the full Aegis test harness locally. Inspect your clipboard, verify the append-only ledger,
              and watch prompt injections get blocked before touching your workflows.
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
              <a href="#console" className="btn btn-primary gap-2 text-sm px-6 py-3">
                Open the console
                <ArrowRight size={15} />
              </a>
              <a
                href="#extension"
                className="btn btn-ghost-light gap-2 text-sm px-5 py-3"
              >
                <Chrome size={15} />
                Get the extension
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost-light gap-2 text-sm px-5 py-3"
              >
                <Github size={15} />
                Read the code
              </a>
            </div>
          </Reveal>
        </div>

        {/* Console Command Quick Start */}
        <Reveal delay={0.4}>
          <div className="border border-paper/10 bg-ink-2 p-4 sm:p-5 rounded-sm font-mono text-xs mb-20">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-paper/10 text-paper/40">
              <span className="flex items-center gap-2">
                <Terminal size={14} className="text-signal" />
                <span>CLI Quick Start</span>
              </span>
              <span>Local Daemon</span>
            </div>
            <div className="text-paper/90 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-paper/40 select-none">$</span>
                <span>git clone https://github.com/team-djda/gemma-aegis</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-paper/40 select-none">$</span>
                <span>cd gemma-aegis &amp;&amp; make run-local</span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Footer Navigation & Credits */}
        <div className="border-t border-paper/10 pt-12 grid grid-cols-1 md:grid-cols-4 gap-8 font-sans text-xs text-paper/60">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-signal rounded-sm flex items-center justify-center font-display text-ink font-bold text-xs">
                A
              </div>
              <span className="font-display font-semibold text-paper text-sm">Gemma Aegis</span>
            </div>
            <p className="max-w-sm text-paper/60 text-xs leading-relaxed">
              A local-first, two-way firewall for AI. Inspects outbound prompts for PII and inbound responses for indirect prompt injection.
            </p>
            <div className="font-mono text-[11px] text-paper/40">
              Apache-2.0 License · Powered by Gemma 4 by Google DeepMind
            </div>
          </div>

          <div className="space-y-2 font-mono text-xs">
            <div className="text-paper font-semibold uppercase tracking-wider text-[11px] mb-3">
              Surfaces
            </div>
            <div>
              <Link to="/console" className="hover:text-paper transition-colors">
                Shield (Outbound)
              </Link>
            </div>
            <div>
              <Link to="/guard" className="hover:text-paper transition-colors">
                Guard (Inbound)
              </Link>
            </div>
            <div>
              <Link to="/demo" className="hover:text-paper transition-colors">
                Attack Simulator
              </Link>
            </div>
            <div>
              <Link to="/ledger" className="hover:text-paper transition-colors">
                Audit Ledger
              </Link>
            </div>
            <div>
              <Link to="/ctf" className="hover:text-paper transition-colors">
                CTF Playground
              </Link>
            </div>
          </div>

          <div className="space-y-2 font-mono text-xs">
            <div className="text-paper font-semibold uppercase tracking-wider text-[11px] mb-3">
              Transparency
            </div>
            <div>
              <a href="#limits" className="hover:text-paper transition-colors">
                Honest Limits
              </a>
            </div>
            <div>
              <a href="#local" className="hover:text-paper transition-colors">
                Data Sovereignty
              </a>
            </div>
            <div>
              <a href="#leaks" className="hover:text-paper transition-colors">
                Two Leaks Model
              </a>
            </div>
            <div className="pt-2 text-[10px] text-paper/40">
              Reduces risk. Does not eliminate it.
            </div>
          </div>
        </div>

        {/* Final tiny bar */}
        <div className="mt-12 pt-6 border-t border-paper/5 flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono text-paper/40 gap-2">
          <div>No cookies. No telemetry. Zero external calls.</div>
          <div>Gemma Aegis © 2026 Team DJDA Hacktoberfest</div>
        </div>
      </div>
    </footer>
  )
}
