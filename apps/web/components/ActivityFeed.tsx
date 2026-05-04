'use client';
import type { WatchEvent } from '@streampulse/shared';

const colorOf = (k: WatchEvent['event']) =>
  k === 'play'
    ? 'bg-accent2'
    : k === 'stop'
      ? 'bg-bad'
      : k === 'seek'
        ? 'bg-warn'
        : k === 'pause'
          ? 'bg-ink2'
          : 'bg-accent';

export function ActivityFeed({ events }: { events: WatchEvent[] }) {
  if (events.length === 0) {
    return <div className="px-5 py-8 text-center text-sm text-ink2">No events yet.</div>;
  }
  return (
    <ul className="max-h-[420px] overflow-auto scrollbar-thin">
      {events.map((e, i) => (
        <li
          key={`${e.userId}-${e.timestamp}-${i}`}
          className="flex items-center gap-3 border-b border-line/60 px-5 py-2 text-xs animate-rise-in"
        >
          <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${colorOf(e.event)}`} />
          <span className="font-mono text-ink2">{new Date(e.timestamp).toLocaleTimeString('en-US', { hour12: false })}</span>
          <span className="font-mono uppercase text-ink2">{e.event.padEnd(8)}</span>
          <span className="truncate font-mono text-ink/80">{e.userId}</span>
          <span className="ml-auto truncate font-mono text-ink/60">{e.movieId}</span>
          <span className="font-mono text-ink2">{e.watchSeconds}s</span>
        </li>
      ))}
    </ul>
  );
}
