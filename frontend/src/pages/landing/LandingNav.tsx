/** LandingNav — minimal navbar: wordmark, anchor links, CTAs */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Github } from 'lucide-react'

const NAV_ANCHORS = [
  { href: '#console',     label: 'Console' },
  { href: '#shield',      label: 'Shield' },
  { href: '#guard',       label: 'Guard' },
  { href: '#attack-demo', label: 'Attack Simulator' },
  { href: '#ledger',      label: 'Ledger' },
  { href: '#ctf',         label: 'CTF Arena' },
  { href: '#academy',     label: 'Academy' },
  { href: '#extension',   label: 'Extension' },
]

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      className="navbar"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        borderBottomColor: scrolled ? 'rgba(244,240,230,0.1)' : 'transparent',
      }}
    >
      {/* Wordmark */}
      <Link to="/" className="flex flex-col leading-none" aria-label="Gemma Aegis home">
        <span className="font-display font-bold text-paper text-sm tracking-tight">Gemma</span>
        <span className="font-mono text-signal text-xs tracking-widest uppercase">AEGIS</span>
      </Link>

      {/* Anchors — hidden on mobile */}
      <nav className="hidden md:flex items-center gap-6" aria-label="Page sections">
        {NAV_ANCHORS.map(({ href, label }) => (
          <a
            key={href}
            href={href}
            className="font-mono text-xs text-paper/60 hover:text-paper transition-colors tracking-wide"
          >
            {label}
          </a>
        ))}
      </nav>

      {/* CTAs */}
      <div className="flex items-center gap-3">
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-paper/60 hover:text-paper transition-colors"
          aria-label="GitHub repository"
        >
          <Github size={14} />
          <span>Read the code</span>
        </a>
        <a href="#console" className="btn btn-primary text-xs">
          Open the console
        </a>
      </div>
    </motion.header>
  )
}
