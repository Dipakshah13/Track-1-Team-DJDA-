/**
 * AppShell — left rail nav + top DataLocationBar for all console routes.
 */
import { NavLink, useNavigate } from 'react-router-dom'
import { Shield, FileSearch, Zap, BookOpen, Flag, ExternalLink } from 'lucide-react'
import { DataLocationBar } from '@/components/DataLocationBar'
import type { DataLocation } from '@/lib/api'

interface AppShellProps {
  children: React.ReactNode
  dataLocation?: DataLocation
}

const NAV_ITEMS = [
  { to: '/console',      label: 'Shield',       icon: Shield,      title: 'Shield — redact outbound text' },
  { to: '/guard',        label: 'Guard',        icon: FileSearch,  title: 'Guard — detect inbound injections' },
  { to: '/attack-demo',  label: 'Attack Demo',  icon: Zap,         title: 'Attack Demo — naive vs protected agent' },
  { to: '/ledger',       label: 'Ledger',       icon: BookOpen,    title: 'Ledger — tamper-evident audit log' },
  { to: '/ctf',          label: 'CTF',          icon: Flag,        title: 'CTF — prompt injection challenge' },
]

export function AppShell({ children, dataLocation = 'LOCAL_ONLY' }: AppShellProps) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Data Location Bar */}
      <DataLocationBar location={dataLocation} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left rail navigation */}
        <nav
          className="w-48 flex-shrink-0 border-r border-line bg-paper-2 flex flex-col"
          aria-label="Console navigation"
        >
          {/* Wordmark */}
          <button
            onClick={() => navigate('/')}
            className="px-5 py-5 text-left border-b border-line hover:bg-paper transition-colors"
          >
            <span className="font-display font-bold text-ink text-sm tracking-tight leading-none block">
              Gemma
            </span>
            <span className="font-mono text-xs text-signal tracking-widest uppercase">
              AEGIS
            </span>
          </button>

          {/* Nav links */}
          <ul className="flex-1 py-4" role="list">
            {NAV_ITEMS.map(({ to, label, icon: Icon, title }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  title={title}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-5 py-3 text-sm font-sans
                    transition-colors relative
                    ${isActive
                      ? 'text-ink font-semibold bg-paper border-r-2 border-signal'
                      : 'text-muted hover:text-ink hover:bg-paper'
                    }
                  `}
                >
                  <Icon size={15} aria-hidden="true" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Bottom: GitHub link */}
          <div className="px-5 py-4 border-t border-line">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-muted hover:text-ink transition-colors font-mono"
            >
              <ExternalLink size={11} />
              Read the code
            </a>
            <p className="font-mono text-xs text-muted mt-2 opacity-60">Apache-2.0</p>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-auto" id="main-content">
          {children}
        </main>
      </div>
    </div>
  )
}
