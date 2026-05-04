'use client';
import type { WsStatus } from '@/lib/wsClient';

export function ConnectionStatus({ status, mode }: { status: WsStatus; mode: 'live' | 'local' }) {
  const dot =
    status === 'open'
      ? 'bg-accent2'
      : status === 'connecting' || status === 'reconnecting'
        ? 'bg-warn animate-pulse-soft'
        : status === 'idle' && mode === 'local'
          ? 'bg-accent animate-pulse-soft'
          : 'bg-bad';
  const label =
    mode === 'local'
      ? 'Local demo (in-browser simulator)'
      : status === 'open'
        ? 'Live'
        : status === 'connecting'
          ? 'Connecting…'
          : status === 'reconnecting'
            ? 'Reconnecting…'
            : status === 'closed'
              ? 'Disconnected'
              : status === 'error'
                ? 'Error'
                : 'Idle';

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1 text-xs text-ink2">
      <span className={`inline-block h-2 w-2 rounded-full ${dot}`} />
      <span className="font-mono">{label}</span>
    </div>
  );
}
