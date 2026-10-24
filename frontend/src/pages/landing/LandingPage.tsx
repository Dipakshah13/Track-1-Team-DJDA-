/**
 * LandingPage — Full Unified All-in-One Experience for Gemma Aegis
 * Every tool, workstation, benchmark, ledger, CTF challenge, and gamified academy lives in this one link!
 */
import { useRef, useEffect } from 'react'
import { LandingNav } from './LandingNav'
import { HeroScene } from './HeroScene'
import { TwoLeaksScene } from './TwoLeaksScene'
import { ConsoleWorkstationScene } from './ConsoleWorkstationScene'
import { ShieldScene } from './ShieldScene'
import { GuardScene } from './GuardScene'
import { AttackDemoScene } from './AttackDemoScene'
import { LedgerScene } from './LedgerScene'
import { CTFScene } from './CTFScene'
import { AcademyScene } from './AcademyScene'
import { ExtensionScene } from './ExtensionScene'
import { LocalOnlyScene } from './LocalOnlyScene'
import { HonestLimitsScene } from './HonestLimitsScene'
import { FinalCTAScene } from './FinalCTAScene'

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace('#', '')
      const el = document.getElementById(id)
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' })
        }, 150)
      }
    }
  }, [])

  return (
    <div className="bg-ink text-paper overflow-x-hidden selection:bg-signal selection:text-paper" lang="en">
      <LandingNav />

      {/* Scene 1: Tactical Hero HUD */}
      <section id="hero" ref={heroRef}>
        <HeroScene />
      </section>

      {/* Scene 2: Two Leaks Model */}
      <section id="leaks">
        <TwoLeaksScene />
      </section>

      {/* Live Interactive Security Console Workstation */}
      <section id="console">
        <ConsoleWorkstationScene />
      </section>

      {/* Scene 3: Shield Workstation with 3D Document & Scrubber */}
      <section id="shield">
        <ShieldScene />
      </section>

      {/* Scene 4: Guard Scanner with 3D Document & MALICIOUS Stamp */}
      <section id="guard">
        <GuardScene />
      </section>

      {/* Scene 5: Live Side-by-Side Attack Simulator */}
      <section id="attack-demo">
        <AttackDemoScene />
      </section>

      {/* Scene 6: Cryptographic Hash Chained Audit Ledger */}
      <section id="ledger">
        <LedgerScene />
      </section>

      {/* Scene 7: Live Red-Teaming CTF Challenge Arena */}
      <section id="ctf">
        <CTFScene />
      </section>

      {/* Scene 8: Gamified Security Academy with XP & Badges */}
      <section id="academy">
        <AcademyScene />
      </section>

      {/* Scene 9: Zero-Click Browser Extension Interceptor */}
      <section id="extension">
        <ExtensionScene />
      </section>

      {/* Scene 10: Sovereign Boundary Air-Gap Toggle */}
      <section id="local">
        <LocalOnlyScene />
      </section>

      {/* Scene 11: Transparent Security Limits */}
      <section id="limits">
        <HonestLimitsScene />
      </section>

      {/* Scene 12: Final CTA & Quickstart Terminal */}
      <section id="cta">
        <FinalCTAScene />
      </section>
    </div>
  )
}
