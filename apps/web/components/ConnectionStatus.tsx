'use client';
import type { WsStatus } from '@/lib/wsClient';

export function ConnectionStatus({ status, mode }: { status: WsStatus; mode: 'live' | 'local' }) {
  const dot =
    status === 'open'
      ? 'bg-good'
      : status === 'connecting' || status === 'reconnecting'
        ? 'bg-warn animate-pulse-soft'
        : status === 'idle' && mode === 'local'
          ? 'bg-accent animate-pulse-soft'
          : 'bg-bad';
  const label =
    mode === 'local'
      ? 'Demo mode'
      : status === 'open'
        ? 'Connected'
        : status === 'connecting'
          ? 'Connecting…'
          : status === 'reconnecting'
            ? 'Reconnecting…'
            : status === 'closed'
              ? 'Disconnected'
              : status === 'error'
                ? 'Connection error'
                : 'Idle';

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink2">
      <span className={`inline-block h-2 w-2 rounded-full ${dot}`} />
      <span>{label}</span>
    </div>
  );
}
