import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#f7f8fb',
        panel: '#ffffff',
        panel2: '#f1f3f8',
        line: '#e4e7ef',
        ink: '#0f172a',
        ink2: '#64748b',
        accent: '#4f46e5',
        accent2: '#0ea5e9',
        good: '#10b981',
        warn: '#f59e0b',
        bad: '#ef4444',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Inter', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)',
        cardHover: '0 4px 12px rgba(15, 23, 42, 0.08)',
      },
      animation: {
        'pulse-soft': 'pulseSoft 2.2s ease-in-out infinite',
        'rise-in': 'riseIn 220ms cubic-bezier(.2,.7,.2,1)',
      },
      keyframes: {
        pulseSoft: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
        riseIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
