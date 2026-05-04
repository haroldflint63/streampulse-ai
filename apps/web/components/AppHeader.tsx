'use client';
import Link from 'next/link';
import type { ReactNode } from 'react';

export function AppHeader({ rightSlot }: { rightSlot?: ReactNode }) {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-5 lg:px-10">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white shadow-glow">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h3l3-9 6 18 3-9h3" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-ink">StreamPulse</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-ink2 md:flex">
          <Link href="/" className="text-ink hover:text-ink/90">Home</Link>
          <Link href="/#catalog" className="hover:text-ink">Browse</Link>
          <Link href="/#analytics" className="hover:text-ink">Analytics</Link>
        </nav>
        <div className="flex items-center gap-2">
          {rightSlot}
          <a
            href="https://github.com/haroldflint63/streampulse-ai"
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel/70 px-3.5 py-1.5 text-xs font-medium text-ink2 backdrop-blur transition hover:border-ink2 hover:text-ink"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.16c-3.2.7-3.88-1.37-3.88-1.37-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.78 1.2 1.78 1.2 1.04 1.78 2.72 1.27 3.39.97.1-.75.41-1.27.74-1.56-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.94 10.94 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.68.42.36.79 1.07.79 2.16v3.21c0 .31.21.68.79.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
            </svg>
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
}
