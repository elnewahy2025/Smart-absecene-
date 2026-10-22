import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type express from 'express';
import { applyRequestHardening, getRequestHostname } from './requestHardening';

function makeApp() {
  const set = vi.fn();
  const use = vi.fn();
  return { app: { set, use } as unknown as express.Express, set, use };
}

function makeReq(headers: Record<string, string>) {
  const normalized = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
  );
  return {
    get: (name: string) => normalized[name.toLowerCase()],
    hostname: 'internal.test',
  } as unknown as express.Request;
}

const originalTrustProxy = process.env.TRUST_PROXY;

beforeEach(() => {
  delete process.env.TRUST_PROXY;
});

afterEach(() => {
  if (originalTrustProxy === undefined) delete process.env.TRUST_PROXY;
  else process.env.TRUST_PROXY = originalTrustProxy;
});

describe('applyRequestHardening / TRUST_PROXY', () => {
  it.each([
    [undefined, false],
    ['false', false],
    ['true', true],
    ['0', 0],
    ['1', 1],
    ['2', 2],
    [' 3 ', 3],
    ['loopback', 'loopback'],
    ['10.0.0.0/8', '10.0.0.0/8'],
  ])('parses TRUST_PROXY=%s into %s', (value, expected) => {
    if (value === undefined) delete process.env.TRUST_PROXY;
    else process.env.TRUST_PROXY = value;

    const { app, set, use } = makeApp();
    applyRequestHardening(app, { isProduction: false });

    expect(set).toHaveBeenCalledWith('trust proxy', expected);
    expect(use).toHaveBeenCalled();
  });

  it('preserves a numeric hop count as a number, not a string', () => {
    process.env.TRUST_PROXY = '2';
    const { app, set } = makeApp();
    applyRequestHardening(app, { isProduction: false });

    const configured = set.mock.calls.find(([key]) => key === 'trust proxy')?.[1];
    expect(configured).toBe(2);
    expect(typeof configured).toBe('number');
  });
});

describe('getRequestHostname', () => {
  it('ignores X-Forwarded-Host when the proxy is not trusted', () => {
    delete process.env.TRUST_PROXY;
    applyRequestHardening(makeApp().app, { isProduction: false });

    const host = getRequestHostname(
      makeReq({ host: 'school-a.example', 'x-forwarded-host': 'attacker.example' })
    );
    expect(host).toBe('school-a.example');
  });

  it('honours X-Forwarded-Host only when TRUST_PROXY is configured', () => {
    process.env.TRUST_PROXY = 'true';
    applyRequestHardening(makeApp().app, { isProduction: false });

    const host = getRequestHostname(
      makeReq({ host: 'internal.example', 'x-forwarded-host': 'school-a.example' })
    );
    expect(host).toBe('school-a.example');
  });

  it('falls back to the Host header when no forwarded host is present', () => {
    process.env.TRUST_PROXY = '1';
    applyRequestHardening(makeApp().app, { isProduction: false });

    const host = getRequestHostname(makeReq({ host: 'school-b.example' }));
    expect(host).toBe('school-b.example');
  });

  it('does not treat an untrusted forwarded host as a tenant after a trusted run', () => {
    process.env.TRUST_PROXY = 'true';
    applyRequestHardening(makeApp().app, { isProduction: false });
    delete process.env.TRUST_PROXY;
    applyRequestHardening(makeApp().app, { isProduction: false });

    const host = getRequestHostname(
      makeReq({ host: 'school-a.example', 'x-forwarded-host': 'attacker.example' })
    );
    expect(host).toBe('school-a.example');
  });
});
