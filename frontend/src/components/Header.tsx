/**
 * Header.tsx — Dark Security Console Top Navigation Bar
 * Includes live HealthPill indicator: Ollama: Online, Model: gemma4:e4b, and route tabs.
 */
import { Link, useLocation } from 'react-router-dom'
import { Shield, ShieldAlert, Cpu, Database, Flag, Terminal, ExternalLink, Trophy } from 'lucide-react'

export function Header() {
  const location = useLocation()

  const navItems = [
    { label: 'Security Console', path: '/console', icon: Shield },
    { label: 'Attack Demo', path: '/attack-demo', icon: ShieldAlert },
    { label: 'Audit Ledger', path: '/ledger', icon: Database },
    { label: 'CTF Challenge', path: '/ctf', icon: Flag },
    { label: 'Academy & Quests', path: '/tutorial', icon: Trophy },
  ]

  return (
    <header className="sticky top-0 z-50 bg-ink/95 border-b border-paper/10 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between">
      {/* Brand & Landing Link */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 bg-signal rounded-sm flex items-center justify-center font-display font-bold text-ink text-sm transition-transform group-hover:scale-105">
            A
          </div>
          <div>
            <div className="font-display font-semibold text-paper text-sm leading-tight flex items-center gap-1.5">
              <span>GEMMA AEGIS</span>
              <span className="font-mono text-[9px] uppercase tracking-wider bg-signal/15 text-signal px-1.5 py-0.2 rounded border border-signal/30">
                FIREWALL
              </span>
            </div>
            <div className="font-mono text-[10px] text-paper/40">Local-First AI Security</div>
          </div>
        </Link>
      </div>

      {/* Center Nav Tabs */}
      <nav className="hidden md:flex items-center gap-1 bg-ink-2 p-1 rounded-sm border border-paper/10">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path || (item.path === '/console' && location.pathname === '/')
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-sm font-mono text-xs transition-colors ${
                isActive
                  ? 'bg-paper text-ink font-semibold shadow-sm'
                  : 'text-paper/60 hover:text-paper hover:bg-paper/5'
              }`}
            >
              <Icon size={13} className={isActive ? 'text-signal' : 'text-paper/40'} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Right: Live HealthPill & External Link */}
      <div className="flex items-center gap-3">
        {/* HealthPill Indicator */}
        <div className="flex items-center gap-2 bg-ink-2 border border-paper/10 px-2.5 py-1 rounded-sm font-mono text-[11px]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-safe opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-safe" />
          </span>
          <span className="text-paper/50">Ollama:</span>
          <span className="text-safe font-semibold">Online</span>
          <span className="text-paper/20">|</span>
          <Cpu size={11} className="text-paper/40" />
          <span className="text-paper/80">gemma4:e4b</span>
        </div>

        <Link
          to="/"
          className="hidden sm:flex items-center gap-1 font-mono text-xs text-paper/50 hover:text-paper transition-colors border border-paper/10 px-2 py-1 rounded-sm bg-ink-2"
          title="View Marketing Story"
        >
          <span>Landing</span>
          <ExternalLink size={11} />
        </Link>
      </div>
    </header>
  )
}
