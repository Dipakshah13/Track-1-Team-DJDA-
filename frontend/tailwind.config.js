/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0E0E10',
        'ink-2': '#1A1A1E',
        paper: '#F4F0E6',
        'paper-2': '#EAE5D8',
        surface: '#FFFFFF',
        line: '#D6D0C2',
        muted: '#77746B',
        signal: '#FF4B2B',
        safe: '#2E8B57',
        caution: '#E0A526',
      },
      fontFamily: {
        display: ['Fraunces Variable', 'Georgia', 'serif'],
        sans: ['Hanken Grotesk Variable', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono Variable', 'Courier New', 'monospace'],
      },
      fontSize: {
        hero: 'clamp(3.5rem, 10vw, 8.75rem)',
        'hero-sm': 'clamp(2.5rem, 7vw, 5rem)',
        stamp: 'clamp(1.5rem, 3vw, 2.5rem)',
      },
      lineHeight: {
        tight: '0.95',
        snug: '1.1',
      },
      letterSpacing: {
        tight: '-0.03em',
        tighter: '-0.05em',
      },
      borderRadius: {
        DEFAULT: '3px',
        sm: '2px',
        md: '4px',
      },
      boxShadow: {
        receipt: '0 1px 0 0 rgba(14,14,16,0.08), 0 2px 8px -2px rgba(14,14,16,0.12)',
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
      },
      animation: {
        'scan': 'scan 2.5s ease-in-out infinite',
        'fade-in': 'fadeIn 0.4s ease forwards',
        'count-up': 'countUp 0.7s ease forwards',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
