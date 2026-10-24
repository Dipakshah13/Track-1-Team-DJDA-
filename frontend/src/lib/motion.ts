/**
 * Gemma Aegis — Motion Kit
 * Shared animation tokens and variants. Import from here, never hard-code.
 * Wrap the app in <MotionConfig reducedMotion="user"> to respect OS preference.
 */

import type { Variants, Transition } from 'framer-motion'

// ─── Duration tokens (ms) ─────────────────────────────────────────────────
export const dur = {
  fast: 0.12,   // 120ms — micro interactions, badge updates
  base: 0.20,   // 200ms — hover transitions, chip fade
  slow: 0.40,   // 400ms — panel reveals, tab switches
  xslow: 0.70,  // 700ms — page-level reveals, hero type
} as const

// ─── Easing ───────────────────────────────────────────────────────────────
export const ease = {
  entrance: [0.22, 1, 0.36, 1] as [number, number, number, number],
  exit:     [0.4, 0, 1, 0.6]  as [number, number, number, number],
  inOut:    [0.4, 0, 0.2, 1]  as [number, number, number, number],
} as const

// ─── Spring — for stamps and chips ────────────────────────────────────────
export const spring = {
  default: { type: 'spring', stiffness: 260, damping: 26 } as Transition,
  snappy:  { type: 'spring', stiffness: 400, damping: 30 } as Transition,
  slow:    { type: 'spring', stiffness: 100, damping: 20 } as Transition,
} as const

// ─── Stagger ──────────────────────────────────────────────────────────────
export const stagger = {
  min: 0.04,  // 40ms
  mid: 0.055, // 55ms
  max: 0.07,  // 70ms
} as const

// ─── Reveal variants — for <Reveal /> component ───────────────────────────
export const revealVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: dur.slow,
      ease: ease.entrance,
      delay: i * stagger.mid,
    },
  }),
}

// ─── Word mask reveal (hero headline) ────────────────────────────────────
export const wordMaskVariants: Variants = {
  hidden: {
    clipPath: 'inset(0 100% 0 0)',
    opacity: 0,
  },
  visible: (i: number = 0) => ({
    clipPath: 'inset(0 0% 0 0)',
    opacity: 1,
    transition: {
      duration: dur.xslow,
      ease: ease.entrance,
      delay: i * stagger.max,
    },
  }),
}

// ─── Redaction bar (clip-path wipe left-to-right) ─────────────────────────
export const redactionBarVariants: Variants = {
  hidden: {
    scaleX: 0,
    opacity: 0,
  },
  visible: (delay: number = 0) => ({
    scaleX: 1,
    opacity: 1,
    transition: {
      scaleX: { duration: dur.slow, ease: ease.entrance, delay },
      opacity: { duration: dur.fast, delay },
    },
  }),
}

// ─── Stamp variants ───────────────────────────────────────────────────────
export const stampVariants: Variants = {
  hidden: {
    scale: 1.4,
    opacity: 0,
    rotate: -5,
  },
  visible: {
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: spring.default,
  },
}

// ─── Stamp shake (MALICIOUS only) ────────────────────────────────────────
export const maliciousShakeKeyframes = {
  x: [0, -4, 4, -3, 3, -2, 2, 0],
  transition: { duration: 0.4, ease: 'easeInOut' },
}

// ─── Chip spring-in ───────────────────────────────────────────────────────
export const chipVariants: Variants = {
  hidden: {
    scale: 0.8,
    opacity: 0,
    y: 8,
  },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: spring.snappy,
  },
  exit: {
    scale: 0.85,
    opacity: 0,
    y: -4,
    transition: { duration: dur.fast, ease: ease.exit },
  },
}

// ─── Trace line slide + fade ──────────────────────────────────────────────
export const traceLineVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -8,
  },
  visible: (i: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: dur.base,
      ease: ease.entrance,
      delay: i * stagger.min,
    },
  }),
}

// ─── Findings list item ───────────────────────────────────────────────────
export const findingItemVariants: Variants = {
  hidden: { opacity: 0, height: 0, marginBottom: 0 },
  visible: {
    opacity: 1,
    height: 'auto',
    marginBottom: '0.5rem',
    transition: {
      duration: dur.base,
      ease: ease.entrance,
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    marginBottom: 0,
    transition: { duration: dur.fast },
  },
}

// ─── Page transition ──────────────────────────────────────────────────────
export const pageVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: dur.slow, ease: ease.entrance },
  },
  exit: {
    opacity: 0,
    transition: { duration: dur.base, ease: ease.exit },
  },
}

// ─── Fade up (scroll reveal sections) ────────────────────────────────────
export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: dur.slow, ease: ease.entrance },
  },
}

// ─── Stagger container ────────────────────────────────────────────────────
export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: stagger.mid,
      delayChildren: 0.1,
    },
  },
}

// ─── Hash link path draw ──────────────────────────────────────────────────
export const hashLinkVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (delay: number = 0) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        duration: dur.slow,
        ease: ease.entrance,
        delay,
      },
      opacity: { duration: dur.fast, delay },
    },
  }),
}

// ─── Static fallback (applied when reducedMotion) ─────────────────────────
// Components check `useReducedMotion()` and apply these instead
export const staticReveal = {
  opacity: 1,
  y: 0,
  x: 0,
  scale: 1,
  clipPath: 'none',
  scaleX: 1,
}
