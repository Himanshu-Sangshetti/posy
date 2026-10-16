import 'server-only';
import http from 'node:http';
import https from 'node:https';
import dns from 'node:dns';
import net from 'node:net';
import zlib from 'node:zlib';
import type { Readable } from 'node:stream';

/**
 * Server-side fetch for addresses that came from users (link previews, share-card images, oEmbed).
 * Only http(s) to public addresses: every DNS answer is checked when the socket connects (so a name can't
 * re-resolve to a private address after the check), redirects are followed by hand and checked per hop,
 * and the body is read with a hard byte cap.
 */

export class BlockedAddressError extends Error {}

const V4 = new net.BlockList();
for (const [a, p] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12],
  ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.88.99.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24],
  ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
] as const) V4.addSubnet(a, p, 'ipv4');

const V6 = new net.BlockList();
for (const [a, p] of [
  ['::', 96], ['::ffff:0:0', 96], ['64:ff9b:1::', 48], ['100::', 64], ['2001::', 23], ['2001:db8::', 32], ['3fff::', 20],
  ['fc00::', 7], ['fe80::', 10], ['fec0::', 10], ['ff00::', 8],
] as const) V6.addSubnet(a, p, 'ipv6');

/** The 16 bytes of an IPv6 address (accepts embedded dotted IPv4, "::ffff:1.2.3.4"). */
function v6Bytes(ip: string): number[] | null {
  let s = ip.replace(/^\[|\]$/g, '').replace(/%.*$/, '');
  const dotted = s.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (dotted) {
    const [a, b, c, d] = dotted[1].split('.').map(Number);
    s = s.slice(0, -dotted[1].length) + `${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
  }
  const [head, tail = ''] = s.split('::');
  const h = head ? head.split(':') : [];
  const t = s.includes('::') && tail ? tail.split(':') : [];
  const groups = s.includes('::') ? [...h, ...Array(8 - h.length - t.length).fill('0'), ...t] : h;
  if (groups.length !== 8) return null;
  return groups.flatMap(g => { const n = parseInt(g, 16); return [n >> 8, n & 0xff]; });
}

const v4From = (b: number[], at: number) => b.slice(at, at + 4).join('.');

/** True only for globally routable unicast addresses (no loopback, private, link-local, CGNAT, documentation, multicast…). */
export function isPublicAddress(ip: string): boolean {
  const kind = net.isIP(ip.replace(/^\[|\]$/g, '').replace(/%.*$/, ''));
  if (kind === 4) return !V4.check(ip, 'ipv4');
  if (kind !== 6) return false;
  const b = v6Bytes(ip);
  if (!b) return false;
  const zero = (from: number, to: number) => b.slice(from, to).every(x => x === 0);
  // IPv4-mapped (::ffff:a.b.c.d), NAT64 (64:ff9b::/96) and 6to4 (2002::/16) carry an IPv4 address: judge that one.
  if (zero(0, 10) && b[10] === 0xff && b[11] === 0xff) return isPublicAddress(v4From(b, 12));
  if (b[0] === 0 && b[1] === 0x64 && b[2] === 0xff && b[3] === 0x9b && zero(4, 12)) return isPublicAddress(v4From(b, 12));
  if (b[0] === 0x20 && b[1] === 0x02) return isPublicAddress(v4From(b, 2));
  const norm = Array.from({ length: 8 }, (_, i) => ((b[2 * i] << 8) | b[2 * i + 1]).toString(16)).join(':');
  return !V6.check(norm, 'ipv6');
}

const BLOCKED_NAMES = /^(localhost|metadata|metadata\.google\.internal|metadata\.goog|instance-data|instance-data\.ec2\.internal)$|\.(localhost|local|internal|localdomain|home\.arpa)$/;

/** Names that point inside the network no matter what DNS says. */
export const isBlockedHostname = (host: string) => BLOCKED_NAMES.test(host.toLowerCase().replace(/\.$/, ''));

export type Resolver = (host: string) => Promise<{ address: string; family: number }[]>;
const systemResolver: Resolver = host => dns.promises.lookup(host, { all: true, verbatim: true });

/** Resolve a hostname and refuse it if it is a blocked name or ANY answer is not a public address. */
export async function resolvePublic(host: string, resolve: Resolver = systemResolver) {
  const bare = host.replace(/^\[|\]$/g, '');
  if (isBlockedHostname(bare)) throw new BlockedAddressError(`Blocked host ${host}`);
  if (net.isIP(bare)) {
    if (!isPublicAddress(bare)) throw new BlockedAddressError(`Blocked address ${host}`);
    return [{ address: bare, family: net.isIP(bare) }];
  }
  const answers = await resolve(bare);
  if (!answers.length) throw new BlockedAddressError(`No address for ${host}`);
  const bad = answers.find(a => !isPublicAddress(a.address));
  if (bad) throw new BlockedAddressError(`${host} resolves to ${bad.address}`);
  return answers;
}

/** Same checks as the fetch, without fetching: is this an http(s) URL on a public host? */
export async function isPublicUrl(raw: string, resolve?: Resolver) {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    await resolvePublic(u.hostname, resolve);
    return true;
  } catch { return false; }
}

// The socket connects to exactly the addresses this lookup vetted, so DNS rebinding between check and connect can't slip through.
const guardedLookup: net.LookupFunction = (host, options, cb) => {
  resolvePublic(host).then(
    list => options.all ? (cb as (e: null, a: dns.LookupAddress[]) => void)(null, list) : cb(null, list[0].address, list[0].family),
    err => cb(err as NodeJS.ErrnoException, '', 0),
  );
};

export type SafeResponse = { ok: boolean; status: number; url: string; headers: http.IncomingHttpHeaders; body: Buffer; text(): string; json<T = unknown>(): T };
export type SafeFetchOptions = {
  maxBytes?: number;
  timeoutMs?: number;
  accept?: string;
  headers?: Record<string, string>;
  maxRedirects?: number;
  /** Return the first maxBytes instead of failing (fine for HTML <head> scraping). */
  truncate?: boolean;
};

const UA = 'Mozilla/5.0 (compatible; PosyBot/1.0; link preview)';

function once(url: URL, o: Required<Pick<SafeFetchOptions, 'maxBytes' | 'truncate'>> & SafeFetchOptions, signal: AbortSignal) {
  return new Promise<{ status: number; headers: http.IncomingHttpHeaders; body: Buffer }>((resolve, reject) => {
    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.request(url, {
      method: 'GET', signal, lookup: guardedLookup, agent: false,
      headers: { 'User-Agent': UA, Accept: o.accept ?? '*/*', 'Accept-Encoding': 'gzip, deflate, br', ...o.headers },
    }, res => {
      const status = res.statusCode ?? 0;
      if (status >= 300 && status < 400) { res.resume(); return resolve({ status, headers: res.headers, body: Buffer.alloc(0) }); }
      const declared = Number(res.headers['content-length'] ?? 0);
      if (!o.truncate && declared > o.maxBytes) { res.destroy(); return reject(new Error('Response too large')); }
      const enc = String(res.headers['content-encoding'] ?? '').toLowerCase();
      const stream: Readable = enc === 'gzip' || enc === 'x-gzip' ? res.pipe(zlib.createGunzip())
        : enc === 'deflate' ? res.pipe(zlib.createInflate())
        : enc === 'br' ? res.pipe(zlib.createBrotliDecompress())
        : res;
      const chunks: Buffer[] = [];
      let size = 0;
      const done = () => resolve({ status, headers: res.headers, body: Buffer.concat(chunks, Math.min(size, o.maxBytes)) });
      stream.on('data', (c: Buffer) => {
        size += c.length;
        chunks.push(c);
        if (size > o.maxBytes) {
          res.destroy();
          stream.destroy();
          if (o.truncate) done(); else reject(new Error('Response too large'));
        }
      });
      stream.on('end', done);
      stream.on('error', reject);
      res.on('error', reject);
    });
    req.on('error', reject);
    req.end();
  });
}

/**
 * GET a user-supplied URL safely. Throws BlockedAddressError for non-public targets (at any hop), and plain errors for
 * timeouts, oversized bodies or too many redirects.
 */
export async function safeFetch(raw: string | URL, opts: SafeFetchOptions = {}): Promise<SafeResponse> {
  const o = { maxBytes: 5 * 1024 * 1024, timeoutMs: 5000, maxRedirects: 3, truncate: false, ...opts };
  const signal = AbortSignal.timeout(o.timeoutMs);
  let url = new URL(raw);
  for (let hop = 0; ; hop++) {
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new BlockedAddressError(`Blocked scheme ${url.protocol}`);
    if (url.username || url.password) throw new BlockedAddressError('Credentials in URL');
    // Fail fast on literal private IPs and blocked names; names are resolved and checked again at connect.
    const host = url.hostname.replace(/^\[|\]$/g, '');
    if (isBlockedHostname(host) || (net.isIP(host) && !isPublicAddress(host))) throw new BlockedAddressError(`Blocked host ${url.hostname}`);
    const r = await once(url, o, signal);
    const location = r.headers.location;
    if (r.status >= 300 && r.status < 400 && location) {
      if (hop >= o.maxRedirects) throw new Error('Too many redirects');
      url = new URL(location, url);
      continue;
    }
    const body = r.body;
    return {
      ok: r.status >= 200 && r.status < 300, status: r.status, url: url.toString(), headers: r.headers, body,
      text: () => body.toString('utf8'),
      json: <T,>() => JSON.parse(body.toString('utf8')) as T,
    };
  }
}
