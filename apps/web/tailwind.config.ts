import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Cinematic dark — inspired by Apple TV+ / HBO Max premium feel.
        bg: '#0a0b0f',
        panel: '#13151c',
        panel2: '#1c1f2a',
        line: '#272a36',
        ink: '#f5f6fa',
        ink2: '#a8aebd',
        ink3: '#6b7184',
        accent: '#ff3158',         // vivid coral red — call-to-action
        accent2: '#7c5cff',        // electric purple — secondary
        good: '#00d4a8',
        warn: '#ffb547',
        bad: '#ff4757',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Inter', 'sans-serif'],
        display: ['ui-sans-serif', 'system-ui', '-apple-system', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 14px rgba(0, 0, 0, 0.35), 0 1px 0 rgba(255, 255, 255, 0.04) inset',
        cardHover: '0 12px 32px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.08) inset',
        glow: '0 0 28px rgba(255, 49, 88, 0.35)',
      },
      animation: {
        'pulse-soft': 'pulseSoft 2.2s ease-in-out infinite',
        'rise-in': 'riseIn 240ms cubic-bezier(.2,.7,.2,1)',
        'fade-in': 'fadeIn 400ms ease-out',
      },
      keyframes: {
        pulseSoft: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
        riseIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
