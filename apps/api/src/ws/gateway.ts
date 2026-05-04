import { WebSocketServer, type WebSocket } from 'ws';
import type { Server as HttpServer } from 'node:http';
import type { WsMessage } from '@streampulse/shared';
import { log } from '../util/logger.js';

/**
 * WebSocket fan-out gateway. Single broadcast channel — every connected
 * client receives metric snapshots and alerts.
 *
 * Tradeoffs:
 *  - We send JSON instead of MessagePack/binary for debuggability. The wire
 *    payload is ~1-2 KB per snapshot — fine for our update cadence.
 *  - Backpressure: if a slow client's bufferedAmount grows beyond a
 *    threshold we drop the message for that client (don't queue forever).
 *  - We send a `hello` frame on connect so clients can show server identity
 *    and demo-mode chip immediately, before the first metrics tick arrives.
 */
const MAX_BUFFER_BYTES = 1 << 20; // 1 MiB

export class WsGateway {
  private wss: WebSocketServer;
  private clients = new Set<WebSocket>();
  private serverId = `srv-${Math.random().toString(36).slice(2, 8)}`;

  constructor(server: HttpServer, opts: { path: string; demoMode: boolean }) {
    this.wss = new WebSocketServer({ server, path: opts.path });

    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      log.info('[ws] client connected', { total: this.clients.size });
      this.send(ws, { type: 'hello', data: { serverId: this.serverId, demoMode: opts.demoMode } });

      ws.on('close', () => {
        this.clients.delete(ws);
        log.info('[ws] client disconnected', { total: this.clients.size });
      });
      ws.on('error', () => {
        this.clients.delete(ws);
      });
    });
  }

  broadcast(msg: WsMessage): void {
    const payload = JSON.stringify(msg);
    for (const ws of this.clients) {
      this.sendRaw(ws, payload);
    }
  }

  private send(ws: WebSocket, msg: WsMessage): void {
    this.sendRaw(ws, JSON.stringify(msg));
  }

  private sendRaw(ws: WebSocket, payload: string): void {
    if (ws.readyState !== ws.OPEN) return;
    if (ws.bufferedAmount > MAX_BUFFER_BYTES) {
      // Slow consumer — skip rather than block ingestion.
      return;
    }
    ws.send(payload);
  }

  get clientCount(): number {
    return this.clients.size;
  }
}
