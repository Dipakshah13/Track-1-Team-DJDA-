/**
 * Console.tsx — Primary Dark Security Console Workstation
 * Houses Shield (Outbound Redaction) and Guard (Inbound Inspection) tabs.
 */
import { useState } from 'react'
import { Header } from '@/components/Header'
import { ShieldTab } from '@/components/ShieldTab'
import { GuardTab } from '@/components/GuardTab'
import { Shield, ShieldCheck, Lock, Activity } from 'lucide-react'

export default function Console() {
  const [activeTab, setActiveTab] = useState<'shield' | 'guard'>('shield')

  return (
    <div className="min-h-screen bg-ink text-paper flex flex-col font-sans selection:bg-signal selection:text-paper">
      <Header />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Workspace Title & Tab Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-paper/10 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-signal" />
              <span className="font-mono text-xs text-signal uppercase tracking-wider font-semibold">
                Two-Way Security Boundary
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-paper">
              Security Console
            </h1>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 bg-ink-2 p-1 rounded-sm border border-paper/10 font-mono text-xs">
            <button
              onClick={() => setActiveTab('shield')}
              className={`flex items-center gap-2 px-4 py-2 rounded-sm transition-all ${
                activeTab === 'shield'
                  ? 'bg-paper text-ink font-bold shadow'
                  : 'text-paper/60 hover:text-paper hover:bg-paper/5'
              }`}
            >
              <Shield size={14} className={activeTab === 'shield' ? 'text-signal' : 'text-paper/40'} />
              <span>Shield (Outbound PII)</span>
            </button>
            <button
              onClick={() => setActiveTab('guard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-sm transition-all ${
                activeTab === 'guard'
                  ? 'bg-paper text-ink font-bold shadow'
                  : 'text-paper/60 hover:text-paper hover:bg-paper/5'
              }`}
            >
              <ShieldCheck size={14} className={activeTab === 'guard' ? 'text-signal' : 'text-paper/40'} />
              <span>Guard (Inbound Injection)</span>
            </button>
          </div>
        </div>

        {/* Active Tab View */}
        {activeTab === 'shield' ? <ShieldTab /> : <GuardTab />}
      </main>
    </div>
  )
}
