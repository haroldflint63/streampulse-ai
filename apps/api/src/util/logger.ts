/** Tiny structured logger — JSON in prod, pretty in dev. No external dep. */
const pretty = process.env.NODE_ENV !== 'production';

type Level = 'info' | 'warn' | 'error' | 'debug';

function emit(level: Level, msg: string, ctx?: Record<string, unknown>): void {
  const rec = { t: new Date().toISOString(), level, msg, ...ctx };
  if (pretty) {
    const color = level === 'error' ? '\x1b[31m' : level === 'warn' ? '\x1b[33m' : '\x1b[36m';
    // eslint-disable-next-line no-console
    console.log(`${color}[${level}]\x1b[0m ${msg}`, ctx ?? '');
  } else {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(rec));
  }
}

export const log = {
  info: (msg: string, ctx?: Record<string, unknown>) => emit('info', msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => emit('warn', msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => emit('error', msg, ctx),
  debug: (msg: string, ctx?: Record<string, unknown>) => emit('debug', msg, ctx),
};
