/**
 * Resilient WebSocket client with reconnect + state-driven status reporting.
 * Designed to live in a React Context — call `connect()` once on mount.
 */
import type { WsMessage } from '@streampulse/shared';

export type WsStatus = 'idle' | 'connecting' | 'open' | 'reconnecting' | 'closed' | 'error';

export type WsListener = (msg: WsMessage) => void;
export type StatusListener = (s: WsStatus) => void;

export class WsClient {
  private socket: WebSocket | null = null;
  private listeners = new Set<WsListener>();
  private statusListeners = new Set<StatusListener>();
  private status: WsStatus = 'idle';
  private retries = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private manuallyClosed = false;

  constructor(private url: string) {}

  connect(): void {
    if (typeof window === 'undefined') return;
    if (!this.url) {
      this.setStatus('idle');
      return;
    }
    this.manuallyClosed = false;
    this.open();
  }

  disconnect(): void {
    this.manuallyClosed = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.socket?.close();
  }

  on(fn: WsListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  onStatus(fn: StatusListener): () => void {
    this.statusListeners.add(fn);
    fn(this.status); // emit current immediately
    return () => this.statusListeners.delete(fn);
  }

  private open(): void {
    this.setStatus(this.retries === 0 ? 'connecting' : 'reconnecting');
    try {
      this.socket = new WebSocket(this.url);
    } catch (err) {
      this.setStatus('error');
      this.scheduleReconnect();
      return;
    }

    this.socket.onopen = () => {
      this.retries = 0;
      this.setStatus('open');
    };
    this.socket.onmessage = (e) => {
      try {
        const msg = JSON.parse(typeof e.data === 'string' ? e.data : '') as WsMessage;
        for (const l of this.listeners) l(msg);
      } catch {
        // ignore malformed
      }
    };
    this.socket.onerror = () => {
      this.setStatus('error');
    };
    this.socket.onclose = () => {
      this.setStatus('closed');
      if (!this.manuallyClosed) this.scheduleReconnect();
    };
  }

  private scheduleReconnect(): void {
    if (this.manuallyClosed) return;
    this.retries += 1;
    // Exponential backoff capped at 8s, with jitter.
    const delay = Math.min(8_000, 500 * 2 ** Math.min(this.retries, 4)) + Math.random() * 250;
    this.retryTimer = setTimeout(() => this.open(), delay);
  }

  private setStatus(s: WsStatus): void {
    if (s === this.status) return;
    this.status = s;
    for (const l of this.statusListeners) l(s);
  }
}
