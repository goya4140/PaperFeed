import { env } from 'cloudflare:workers';
export function getD1() {
  if (!env.DB) throw new Error('D1 binding unavailable');
  return env.DB;
}
