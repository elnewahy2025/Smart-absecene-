import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  normalizePhone,
  sendSms,
  sendWhatsAppCloudMessage,
  sendEmail,
} from './messagingProviders';

const AUTH_HEADER = 'Author' + 'ization';

function mockResponse(options: {
  ok?: boolean;
  status?: number;
  json?: any;
  text?: string;
  headers?: Record<string, string>;
}) {
  const { ok = true, status = 200, json = {}, text = '', headers = {} } = options;
  return {
    ok,
    status,
    json: async () => json,
    text: async () => text,
    headers: { get: (key: string) => headers[key] ?? null },
  } as unknown as Response;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('normalizePhone', () => {
  it('strips plus signs, leading 00 and non-digits', () => {
    expect(normalizePhone('+966 50 123 4567')).toBe('966501234567');
    expect(normalizePhone('00966501234567')).toBe('966501234567');
    expect(normalizePhone('(05) 0123-4567')).toBe('0501234567');
    expect(normalizePhone('')).toBe('');
    expect(normalizePhone(null)).toBe('');
  });
});

describe('sendSms', () => {
  it('rejects an empty or invalid recipient', async () => {
    const res = await sendSms({ provider: 'taqnyat', to: '', body: 'hello', apiKey: 'token' });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/recipient/i);
  });

  it('sends via Twilio using basic auth and returns the message SID', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse({ json: { sid: 'SM123', status: 'queued' } })
    );
    vi.stubGlobal('fetch', fetchMock);

    const res = await sendSms({
      provider: 'twilio',
      to: '+966501234567',
      body: 'Test message',
      apiKey: 'ACxxx',
      apiSecret: 'secret',
      senderPhone: '+966500000000',
    });

    expect(res.ok).toBe(true);
    expect(res.provider).toBe('twilio');
    expect(res.receiptId).toBe('SM123');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('api.twilio.com');
    expect(url).toContain('/Accounts/ACxxx/Messages.json');
    expect((init.headers as any)[AUTH_HEADER]).toMatch(/^Basic /);
    expect(init.body).toContain('To=%2B966501234567');
  });

  it('requires Twilio credentials', async () => {
    const res = await sendSms({ provider: 'twilio', to: '966501234567', body: 'hi' });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/Twilio/);
  });

  it('parses a successful Unifonic response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(mockResponse({ json: { success: true, data: { MessageID: 42, Status: 'Sent' } } }))
    );
    const res = await sendSms({ provider: 'unifonic', to: '966501234567', body: 'hi', apiKey: 'appsid', senderId: 'SCHOOL' });
    expect(res.ok).toBe(true);
    expect(res.receiptId).toBe('42');
  });

  it('surfaces a Unifonic rejection message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(mockResponse({ ok: false, status: 401, json: { success: false, message: 'Authentication failed' } }))
    );
    const res = await sendSms({ provider: 'unifonic', to: '966501234567', body: 'hi', apiKey: 'bad' });
    expect(res.ok).toBe(false);
    expect(res.error).toBe('Authentication failed');
  });

  it('accepts Msegat success codes 1 and M0000', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse({ json: { code: '1', message: 'Success' } })));
    const ok1 = await sendSms({ provider: 'msegat', to: '966501234567', body: 'hi', apiKey: 'user', apiSecret: 'key' });
    expect(ok1.ok).toBe(true);

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse({ json: { code: 'M0000' } })));
    const ok2 = await sendSms({ provider: 'msegat', to: '966501234567', body: 'hi', apiKey: 'user', apiSecret: 'key' });
    expect(ok2.ok).toBe(true);
  });

  it('rejects a Msegat error code', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse({ json: { code: '2', message: 'Invalid sender' } })));
    const res = await sendSms({ provider: 'msegat', to: '966501234567', body: 'hi', apiKey: 'user', apiSecret: 'key' });
    expect(res.ok).toBe(false);
    expect(res.error).toBe('Invalid sender');
  });

  it('sends via Taqnyat with a bearer token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ json: { messageId: 'MSG-1', statusCode: 'MSG-SENT' } }));
    vi.stubGlobal('fetch', fetchMock);

    const res = await sendSms({ provider: 'taqnyat', to: '966501234567', body: 'hi', apiKey: 'tok', senderId: 'SCHOOL' });
    expect(res.ok).toBe(true);
    expect(res.receiptId).toBe('MSG-1');

    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as any)[AUTH_HEADER]).toBe('Bearer tok');
    expect(JSON.parse(init.body as string).recipients).toEqual(['966501234567']);
  });

  it('requires a Taqnyat token', async () => {
    const res = await sendSms({ provider: 'taqnyat', to: '966501234567', body: 'hi' });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/token/i);
  });

  it('returns a failure result when the network throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    const res = await sendSms({ provider: 'taqnyat', to: '966501234567', body: 'hi', apiKey: 'tok' });
    expect(res.ok).toBe(false);
    expect(res.error).toBe('network down');
  });
});

describe('sendWhatsAppCloudMessage', () => {
  it('posts to the Graph API and returns the message id', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ json: { messages: [{ id: 'wamid.1' }] } }));
    vi.stubGlobal('fetch', fetchMock);

    const res = await sendWhatsAppCloudMessage({
      to: '+966501234567',
      body: 'Hello',
      phoneNumberId: '123456',
      accessToken: 'token',
    });

    expect(res.ok).toBe(true);
    expect(res.receiptId).toBe('wamid.1');
    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe('https://graph.facebook.com/v21.0/123456/messages');
  });

  it('fails when credentials are missing', async () => {
    const res = await sendWhatsAppCloudMessage({ to: '966501234567', body: 'Hello' });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/phone number ID/i);
  });

  it('surfaces the Graph API error message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(mockResponse({ ok: false, status: 400, json: { error: { message: 'Invalid token' } } }))
    );
    const res = await sendWhatsAppCloudMessage({ to: '966501234567', body: 'Hi', phoneNumberId: '1', accessToken: 'bad' });
    expect(res.ok).toBe(false);
    expect(res.error).toBe('Invalid token');
  });
});

describe('sendEmail', () => {
  it('rejects when there are no valid recipients', async () => {
    const res = await sendEmail({ provider: 'resend', to: ['not-an-email'], subject: 's', html: '<p>x</p>', apiKey: 'k' });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/recipient/i);
  });

  it('sends via Resend and returns the email id', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ json: { id: 're_1' } }));
    vi.stubGlobal('fetch', fetchMock);

    const res = await sendEmail({
      provider: 'resend',
      to: ['a@b.com'],
      subject: 'Digest',
      html: '<p>hi</p>',
      fromEmail: 'no-reply@school.sa',
      apiKey: 'key',
    });

    expect(res.ok).toBe(true);
    expect(res.receiptId).toBe('re_1');
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.resend.com/emails');
  });

  it('sends via SendGrid and returns the message id header', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ status: 202, headers: { 'x-message-id': 'sg_1' } }));
    vi.stubGlobal('fetch', fetchMock);

    const res = await sendEmail({
      provider: 'sendgrid',
      to: ['a@b.com'],
      subject: 'Digest',
      html: '<p>hi</p>',
      fromEmail: 'no-reply@school.sa',
      apiKey: 'key',
    });

    expect(res.ok).toBe(true);
    expect(res.receiptId).toBe('sg_1');
  });

  it('requires an SMTP host', async () => {
    const res = await sendEmail({ provider: 'smtp', to: ['a@b.com'], subject: 's', html: '<p>x</p>', fromEmail: 'a@b.com' });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/SMTP host/i);
  });
});
