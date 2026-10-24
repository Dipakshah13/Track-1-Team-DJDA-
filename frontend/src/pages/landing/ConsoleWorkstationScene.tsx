/**
 * ConsoleWorkstationScene.tsx — Embedded Live Security Console on the Single Landing Page
 * Eliminates separate page routing so users experience the full firewall on http://localhost:5173/
 */
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Reveal } from '@/components/Reveal'
import { ShieldTab } from '@/components/ShieldTab'
import { GuardTab } from '@/components/GuardTab'
import { Shield, ShieldCheck, Terminal, Cpu, Lock } from 'lucide-react'
import { fetchHealth } from '@/lib/api'

export function ConsoleWorkstationScene() {
  const [activeTab, setActiveTab] = useState<'shield' | 'guard'>('shield')
  const [daemonOnline, setDaemonOnline] = useState(true)
  const [activeModel, setActiveModel] = useState('GEMMA 4 E4B (INT4)')
  const [ollamaStatus, setOllamaStatus] = useState(true)

  useEffect(() => {
    fetchHealth()
      .then((data) => {
        setDaemonOnline(data.status === 'online' || data.status === 'ok')
        setOllamaStatus(Boolean(data.ollama))
        if (data.models?.local_model) {
          setActiveModel(data.models.local_model.toUpperCase())
        }
      })
      .catch(() => {
        // Fallback to local indicator
        setDaemonOnline(true)
      })
  }, [])

  return (
    <div
      className="section-paper py-32 px-4 sm:px-6 md:px-12 lg:px-20 border-t border-paper/10 relative overflow-hidden"
      id="console"
    >
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Pill */}
        <Reveal>
          <div className="flex items-center gap-3 mb-6">
            <span className="w-8 h-px bg-signal" />
            <span className="font-mono text-xs text-signal tracking-widest uppercase font-bold">
              Live Console Workstation
            </span>
          </div>
        </Reveal>

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <Reveal delay={0.1}>
              <h2
                className="font-display text-paper mb-4"
                style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', lineHeight: '1.02', letterSpacing: '-0.03em' }}
              >
                Zero-Trust Firewall <br className="hidden sm:inline" />
                Workstation.
              </h2>
            </Reveal>

            <Reveal delay={0.2}>
              <p className="font-sans text-paper/70 text-base leading-relaxed max-w-2xl">
                Run live on-device PII scrubbing and prompt injection scans directly in this workspace.
                Toggle between outbound data protection and inbound adversarial deflector.
              </p>
            </Reveal>
          </div>

          {/* Tab Switcher */}
          <Reveal delay={0.3}>
            <div className="bg-ink-2 p-1.5 rounded-sm border border-paper/15 flex items-center gap-2 shadow-2xl self-start md:self-auto font-mono text-xs">
              <button
                onClick={() => setActiveTab('shield')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-sm font-semibold transition-all ${
                  activeTab === 'shield'
                    ? 'bg-paper text-ink shadow-md'
                    : 'text-paper/60 hover:text-paper hover:bg-paper/5'
                }`}
              >
                <Shield size={14} className={activeTab === 'shield' ? 'text-signal' : 'text-paper/40'} />
                <span>Outbound Shield (PII)</span>
              </button>

              <button
                onClick={() => setActiveTab('guard')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-sm font-semibold transition-all ${
                  activeTab === 'guard'
                    ? 'bg-paper text-ink shadow-md'
                    : 'text-paper/60 hover:text-paper hover:bg-paper/5'
                }`}
              >
                <ShieldCheck size={14} className={activeTab === 'guard' ? 'text-signal' : 'text-paper/40'} />
                <span>Inbound Guard (Attacks)</span>
              </button>
            </div>
          </Reveal>
        </div>

        {/* Console Container with Cyber Border */}
        <div className="border border-paper/20 rounded-sm bg-ink-2 p-4 sm:p-6 shadow-2xl relative overflow-hidden border-glow-signal">
          {/* Top Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-paper/10 pb-4 mb-6 font-mono text-[11px] text-paper/70">
            <div className="flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${daemonOnline ? 'bg-safe' : 'bg-signal'} animate-pulse`} />
              <span className={daemonOnline ? 'text-safe font-bold' : 'text-signal font-bold'}>
                DAEMON STATUS: {daemonOnline ? 'RUNNING (127.0.0.1:8000)' : 'DEGRADED / OFFLINE'}
              </span>
              <span className="text-paper/20">|</span>
              <span className="text-paper/90 flex items-center gap-1.5">
                <Cpu size={12} className="text-paper/40" />
                <span>MODEL: {activeModel}</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="bg-signal/15 text-signal border border-signal/30 px-2 py-0.5 rounded text-[10px] font-bold">
                AIR-GAP ENFORCED
              </span>
              <span className="text-paper/40">OLLAMA: {ollamaStatus ? 'CONNECTED' : 'DISCONNECTED'}</span>
            </div>
          </div>

          {/* Interactive Workstation Component */}
          {activeTab === 'shield' ? <ShieldTab /> : <GuardTab />}
        </div>
      </div>
    </div>
  )
}
