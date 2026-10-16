import { describe, it, expect, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const { isPublicAddress, isBlockedHostname, resolvePublic, isPublicUrl, safeFetch, BlockedAddressError } = await import('@/lib/safe-fetch');

describe('address classifier', () => {
  it.each([
    '127.0.0.1', '127.1.2.3', '10.0.0.1', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.169.254', '100.64.0.1',
    '100.100.100.200', '0.0.0.0', '192.0.2.1', '198.51.100.7', '203.0.113.9', '198.18.0.1', '224.0.0.1', '255.255.255.255',
    '::', '::1', '[::1]', '::ffff:127.0.0.1', '[::ffff:127.0.0.1]', '::ffff:7f00:1', '::ffff:a9fe:a9fe', '::ffff:10.0.0.1',
    '64:ff9b::7f00:1', '2002:7f00:1::', '2002:c0a8:101::1', 'fd00::1', 'fc00::', 'fe80::1', 'fe80::1%en0', 'fec0::1',
    'ff02::1', '2001:db8::1', '2001::1', '::7f00:1', 'not-an-ip',
  ])('blocks %s', ip => expect(isPublicAddress(ip)).toBe(false));

  it.each(['1.1.1.1', '8.8.8.8', '93.184.216.34', '172.32.0.1', '100.128.0.1', '2606:4700:4700::1111', '2a00:1450:4001:80b::200e', '::ffff:1.1.1.1', '64:ff9b::808:808'])(
    'allows %s', ip => expect(isPublicAddress(ip)).toBe(true),
  );

  it('blocks metadata and local names', () => {
    for (const h of ['localhost', 'LOCALHOST.', 'metadata.google.internal', 'metadata', 'foo.localhost', 'printer.local', 'db.internal']) expect(isBlockedHostname(h)).toBe(true);
    expect(isBlockedHostname('example.com')).toBe(false);
  });
});

describe('resolvePublic', () => {
  const fake = (map: Record<string, string[]>) => async (h: string) => (map[h] ?? []).map(address => ({ address, family: address.includes(':') ? 6 : 4 }));

  it('rejects public-looking names that resolve to loopback (localtest.me style)', async () => {
    await expect(resolvePublic('localtest.me', fake({ 'localtest.me': ['127.0.0.1'] }))).rejects.toBeInstanceOf(BlockedAddressError);
  });
  it('rejects when ANY answer is private', async () => {
    await expect(resolvePublic('mixed.example', fake({ 'mixed.example': ['93.184.216.34', '10.0.0.5'] }))).rejects.toThrow(/10\.0\.0\.5/);
    await expect(resolvePublic('v6.example', fake({ 'v6.example': ['2606:4700::1', 'fd00::1'] }))).rejects.toThrow();
  });
  it('rejects names with no answers, and metadata names before resolving', async () => {
    const spy = vi.fn(fake({}));
    await expect(resolvePublic('nothing.example', spy)).rejects.toThrow();
    await expect(resolvePublic('metadata.google.internal', spy)).rejects.toThrow();
    expect(spy).toHaveBeenCalledTimes(1);
  });
  it('accepts public answers and literal public IPs', async () => {
    await expect(resolvePublic('example.com', fake({ 'example.com': ['93.184.216.34'] }))).resolves.toHaveLength(1);
    await expect(resolvePublic('[2606:4700:4700::1111]')).resolves.toHaveLength(1);
    await expect(resolvePublic('169.254.169.254')).rejects.toThrow();
  });
  it('isPublicUrl only allows http(s)', async () => {
    const r = fake({ 'example.com': ['93.184.216.34'] });
    expect(await isPublicUrl('https://example.com/a.png', r)).toBe(true);
    expect(await isPublicUrl('file:///etc/passwd', r)).toBe(false);
    expect(await isPublicUrl('data:image/png;base64,AAAA', r)).toBe(false);
    expect(await isPublicUrl('http://[::ffff:127.0.0.1]:3999/x', r)).toBe(false);
  });
});

describe('safeFetch', () => {
  it('refuses private targets without connecting', async () => {
    for (const u of ['http://127.0.0.1:1/', 'http://[::ffff:127.0.0.1]:1/', 'http://169.254.169.254/latest/meta-data/', 'http://localhost:1/', 'http://100.100.100.200/', 'http://metadata.google.internal/', 'file:///etc/passwd', 'gopher://example.com/'])
      await expect(safeFetch(u)).rejects.toBeInstanceOf(BlockedAddressError);
  });
});
