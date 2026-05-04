'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const NAV = [
  { href: '/', label: 'Live Pulse', icon: '◉' },
  { href: '/architecture', label: 'Architecture', icon: '⌘' },
  { href: '/case-study', label: 'Case Study', icon: '✎' },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:flex sticky top-0 z-30 h-screen w-60 shrink-0 flex-col border-r border-line/60 bg-bg/80 backdrop-blur-xl">
      <Link href="/" className="flex items-center gap-2.5 px-6 py-5">
        <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent2 shadow-glow">
          <span className="absolute inset-0 rounded-lg ring-1 ring-white/20" />
          <span className="text-sm font-black tracking-tight text-white">SP</span>
        </span>
        <div className="flex flex-col leading-none">
          <span className="text-[15px] font-bold tracking-tight text-ink">StreamPulse</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink3">
            viral intelligence
          </span>
        </div>
      </Link>
      <nav className="mt-2 flex flex-col gap-1 px-3">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                active
                  ? 'text-ink'
                  : 'text-ink2 hover:bg-panel/60 hover:text-ink'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-accent/15 to-accent2/15 ring-1 ring-inset ring-white/5"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative text-base text-accent2">{item.icon}</span>
              <span className="relative font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-5 pb-6">
        <div className="rounded-xl border border-line bg-panel/60 p-4 text-[11px] leading-relaxed text-ink2">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-ink3">
            tech stack
          </div>
          Next.js 15 · TS · Tailwind · Framer Motion · Recharts · Groq · Fastify · Redis
        </div>
      </div>
    </aside>
  );
}
