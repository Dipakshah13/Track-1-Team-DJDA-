/**
 * Scene 8: HonestLimitsScene — Transparent security limits and guarantees
 * Calm, dry, typographically disciplined. Builds real trust.
 */
import { Reveal } from '@/components/Reveal'

export function HonestLimitsScene() {
  const limits = [
    {
      kicker: 'PROBABILISTIC RECALL',
      title: 'Detection is probabilistic, not absolute.',
      body: 'Gemma Aegis combines local small-language models with deterministic regex filters. While effective across standard formats, no filter achieves 100% recall. Obfuscated encodings, novel regional identifiers, or deliberately fragmented tokens can evade detection.',
    },
    {
      kicker: 'ADVERSARIAL REALITY',
      title: 'Prompt injection defense reduces risk; it does not solve it.',
      body: 'Indirect injection is an unsolved open vulnerability in language models. Guard detects known jailbreak templates, roleplay escalations, system prompt extractions, and delimiter manipulation, but cannot guarantee immunity against novel linguistic bypasses.',
    },
    {
      kicker: 'REGULATORY BOUNDARY',
      title: 'This software is not legal counsel.',
      body: 'Automated de-identification assists with compliance under HIPAA Safe Harbor, GDPR pseudonymization, and CCPA thresholds, but enterprise compliance requires end-to-end organizational controls. Aegis is an engineering boundary, not a legal certification.',
    },
    {
      kicker: 'DEMO INTEGRITY',
      title: 'All sample data in this project is strictly synthetic.',
      body: 'Every name, social security number, telephone prefix, and IBAN displayed across the marketing pages, live demos, and test suites was artificially generated. Aegis never bundles, records, or exposes real personal records.',
    },
  ]

  return (
    <div className="section-paper py-32 px-6 md:px-12 lg:px-20 border-t border-paper/10">
      <div className="max-w-4xl mx-auto">
        <Reveal>
          <div className="flex items-center gap-3 mb-6">
            <span className="w-8 h-px bg-signal" />
            <span className="font-mono text-xs text-signal tracking-widest uppercase font-bold">Honest Limits</span>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <h2
            className="font-display text-paper mb-4"
            style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', lineHeight: '1.0', letterSpacing: '-0.03em' }}
          >
            What we cannot promise.
          </h2>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="font-sans text-paper/70 text-base leading-relaxed max-w-2xl mb-16">
            Security software that claims perfection is either inexperienced or untruthful.
            Here is the exact boundary of what Gemma Aegis does and does not protect.
          </p>
        </Reveal>

        {/* 2x2 grid of honest limits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12 border-t border-paper/10 pt-12">
          {limits.map((limit, i) => (
            <Reveal key={limit.kicker} delay={0.1 * (i + 1)}>
              <div className="space-y-3">
                <div className="font-mono text-[11px] text-signal font-semibold tracking-widest uppercase">
                  {limit.kicker}
                </div>
                <h3 className="font-display text-paper text-xl font-normal leading-snug">
                  {limit.title}
                </h3>
                <p className="font-sans text-paper/70 text-sm leading-relaxed">
                  {limit.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Closing note */}
        <Reveal delay={0.5}>
          <div className="mt-16 pt-8 border-t border-paper/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs text-paper/60">
            <div>
              Read our methodology in <span className="text-paper underline underline-offset-4">docs/TRD.md</span>
            </div>
            <div>
              Deterministic test fixtures available in <span className="text-paper font-semibold">/testdata</span>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
