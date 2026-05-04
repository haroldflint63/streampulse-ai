import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0f',
        panel: '#11121a',
        panel2: '#171823',
        line: '#23242f',
        ink: '#e6e7ea',
        ink2: '#9aa0ad',
        accent: '#7c5cff',
        accent2: '#36e3a8',
        warn: '#ffb547',
        bad: '#ff5566',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Inter', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
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
