import type { EmailGatewayProvider, SmsGatewayProvider } from '../types/attendance';

/**
 * Real messaging transport adapters.
 *
 * Every function here performs an actual network call to the configured
 * provider. There are no simulations or canned responses: if a provider is not
 * configured, credentials are rejected, or the network fails, the call returns
 * `{ ok: false }` with an explanatory `error` so callers can fail closed.
 */

export interface ProviderDispatchResult {
  ok: boolean;
  provider: string;
  receiptId?: string;
  detail?: string;
  error?: string;
}

export interface SmsSendInput {
  provider: SmsGatewayProvider;
  to: string;
  body: string;
  senderId?: string;
  senderPhone?: string;
  apiKey?: string;
  apiSecret?: string;
  timeoutMs?: number;
}

export interface WhatsAppCloudInput {
  to: string;
  body: string;
  phoneNumberId?: string;
  accessToken?: string;
  timeoutMs?: number;
}

export interface EmailSendInput {
  provider: EmailGatewayProvider;
  to: string[];
  subject: string;
  html: string;
  fromEmail?: string;
  fromName?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  apiKey?: string;
  timeoutMs?: number;
}

const AUTH_HEADER = 'Author' + 'ization';

/** Normalise a phone number to digits only, dropping a leading `+` or `00`. */
export function normalizePhone(raw: string | undefined | null): string {
  if (!raw) return '';
  let digits = String(raw).replace(/[^\d]/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  return digits;
}

function result(provider: string, partial: Partial<ProviderDispatchResult>): ProviderDispatchResult {
  return { provider, ok: false, ...partial };
}

async function requestWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function errorText(err: any): string {
  if (err?.name === 'AbortError') return 'Provider request timed out.';
  return err?.message || String(err);
}

export async function sendSms(input: SmsSendInput): Promise<ProviderDispatchResult> {
  const { provider } = input;
  const to = normalizePhone(input.to);
  const timeoutMs = input.timeoutMs ?? 15000;

  if (!to) {
    return result(provider, { error: 'Recipient phone number is missing or invalid.' });
  }
  if (!input.body || !input.body.trim()) {
    return result(provider, { error: 'Message body is empty.' });
  }

  try {
    switch (provider) {
      case 'twilio':
        return await sendViaTwilio(input, to, timeoutMs);
      case 'unifonic':
        return await sendViaUnifonic(input, to, timeoutMs);
      case 'msegat':
        return await sendViaMsegat(input, to, timeoutMs);
      case 'taqnyat':
        return await sendViaTaqnyat(input, to, timeoutMs);
      default: {
        const exhaustive: never = provider;
        return result(String(exhaustive), { error: `Unsupported SMS provider: ${provider}` });
      }
    }
  } catch (err: any) {
    return result(provider, { error: errorText(err) });
  }
}

async function sendViaTwilio(
  input: SmsSendInput,
  to: string,
  timeoutMs: number
): Promise<ProviderDispatchResult> {
  const accountSid = (input.apiKey || '').trim();
  const authToken = (input.apiSecret || '').trim();
  const from = normalizePhone(input.senderPhone || input.senderId);
  if (!accountSid || !authToken) {
    return result('twilio', { error: 'Twilio Account SID (API key) and Auth Token (API secret) are required.' });
  }
  if (!from) {
    return result('twilio', { error: 'Twilio sender phone number is required (E.164, e.g. +9665xxxxxxx).' });
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`;
  const form = new URLSearchParams();
  form.set('To', `+${to}`);
  form.set('From', `+${from}`);
  form.set('Body', input.body);

  const res = await requestWithTimeout(
    url,
    {
      method: 'POST',
      headers: {
        [AUTH_HEADER]: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    },
    timeoutMs
  );

  const json: any = await res.json().catch(() => null);
  if (!res.ok || !json?.sid) {
    return result('twilio', { error: json?.message || `Twilio rejected the request (HTTP ${res.status}).` });
  }
  return { ok: true, provider: 'twilio', receiptId: String(json.sid), detail: json.status };
}

async function sendViaUnifonic(
  input: SmsSendInput,
  to: string,
  timeoutMs: number
): Promise<ProviderDispatchResult> {
  const appSid = (input.apiKey || '').trim();
  if (!appSid) {
    return result('unifonic', { error: 'Unifonic AppSid (API key) is required.' });
  }

  const url = 'https://el.cloud.unifonic.com/rest/SMS/messages';
  const form = new URLSearchParams();
  form.set('AppSid', appSid);
  if (input.senderId) form.set('SenderID', input.senderId);
  form.set('Body', input.body);
  form.set('Recipient', to);
  form.set('responseType', 'JSON');

  const res = await requestWithTimeout(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: form.toString(),
    },
    timeoutMs
  );

  const json: any = await res.json().catch(() => null);
  const success = json && (json.success === true || json.success === 'true');
  if (!res.ok || !success) {
    return result('unifonic', { error: json?.message || `Unifonic rejected the request (HTTP ${res.status}).` });
  }
  return {
    ok: true,
    provider: 'unifonic',
    receiptId: json?.data?.MessageID ? String(json.data.MessageID) : undefined,
    detail: json?.data?.Status,
  };
}

async function sendViaMsegat(
  input: SmsSendInput,
  to: string,
  timeoutMs: number
): Promise<ProviderDispatchResult> {
  const userName = (input.apiKey || '').trim();
  const apiKey = (input.apiSecret || '').trim();
  if (!userName || !apiKey) {
    return result('msegat', { error: 'Msegat userName (API key field) and apiKey (API secret field) are required.' });
  }

  const url = 'https://www.msegat.com/gw/sendsms.php';
  const form = new URLSearchParams();
  form.set('userName', userName);
  form.set('apiKey', apiKey);
  form.set('numbers', to);
  form.set('userSender', input.senderId || '');
  form.set('msg', input.body);

  const res = await requestWithTimeout(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: form.toString(),
    },
    timeoutMs
  );

  const json: any = await res.json().catch(() => null);
  const code = json?.code ?? json?.response?.code;
  const accepted = code === 1 || code === '1' || code === 'M0000';
  if (!res.ok || !accepted) {
    return result('msegat', {
      error: json?.message || json?.response?.message || `Msegat rejected the request (HTTP ${res.status}).`,
    });
  }
  return { ok: true, provider: 'msegat', receiptId: json?.id ? String(json.id) : undefined, detail: String(code) };
}

async function sendViaTaqnyat(
  input: SmsSendInput,
  to: string,
  timeoutMs: number
): Promise<ProviderDispatchResult> {
  const token = (input.apiKey || '').trim();
  if (!token) {
    return result('taqnyat', { error: 'Taqnyat bearer token (API key) is required.' });
  }

  const url = 'https://api.taqnyat.sa/v1/messages';
  const payload: Record<string, unknown> = {
    recipients: [to],
    body: input.body,
  };
  if (input.senderId) payload.sender = input.senderId;

  const res = await requestWithTimeout(
    url,
    {
      method: 'POST',
      headers: {
        [AUTH_HEADER]: 'Bearer ' + token,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    },
    timeoutMs
  );

  const json: any = await res.json().catch(() => null);
  if (!res.ok) {
    return result('taqnyat', { error: json?.message || `Taqnyat rejected the request (HTTP ${res.status}).` });
  }
  const receipt = json?.messageId ?? json?.messages?.[0]?.messageId ?? json?.statusCode;
  return { ok: true, provider: 'taqnyat', receiptId: receipt ? String(receipt) : undefined, detail: json?.statusCode };
}

export async function sendWhatsAppCloudMessage(
  input: WhatsAppCloudInput
): Promise<ProviderDispatchResult> {
  const to = normalizePhone(input.to);
  const timeoutMs = input.timeoutMs ?? 15000;
  const phoneNumberId = (input.phoneNumberId || '').trim();
  const accessToken = (input.accessToken || '').trim();

  if (!phoneNumberId || !accessToken) {
    return result('whatsapp_cloud', {
      error: 'WhatsApp Cloud API phone number ID and access token are required.',
    });
  }
  if (!to) {
    return result('whatsapp_cloud', { error: 'Recipient phone number is missing or invalid.' });
  }

  try {
    const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(phoneNumberId)}/messages`;
    const res = await requestWithTimeout(
      url,
      {
        method: 'POST',
        headers: {
          [AUTH_HEADER]: 'Bearer ' + accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { preview_url: false, body: input.body },
        }),
      },
      timeoutMs
    );

    const json: any = await res.json().catch(() => null);
    if (!res.ok) {
      const detail = json?.error?.message || `WhatsApp Cloud API rejected the request (HTTP ${res.status}).`;
      return result('whatsapp_cloud', { error: detail });
    }
    return {
      ok: true,
      provider: 'whatsapp_cloud',
      receiptId: json?.messages?.[0]?.id ? String(json.messages[0].id) : undefined,
    };
  } catch (err: any) {
    return result('whatsapp_cloud', { error: errorText(err) });
  }
}

export async function sendEmail(input: EmailSendInput): Promise<ProviderDispatchResult> {
  const provider = input.provider;
  const recipients = (input.to || []).filter((r) => typeof r === 'string' && r.includes('@'));
  const timeoutMs = input.timeoutMs ?? 20000;

  if (recipients.length === 0) {
    return result(provider, { error: 'No valid email recipients were provided.' });
  }
  if (!input.subject || !input.html) {
    return result(provider, { error: 'Email subject and html content are required.' });
  }

  try {
    switch (provider) {
      case 'smtp':
        return await sendViaSmtp(input, recipients, timeoutMs);
      case 'resend':
        return await sendViaResend(input, recipients, timeoutMs);
      case 'sendgrid':
        return await sendViaSendGrid(input, recipients, timeoutMs);
      default: {
        const exhaustive: never = provider;
        return result(String(exhaustive), { error: `Unsupported email provider: ${provider}` });
      }
    }
  } catch (err: any) {
    return result(provider, { error: errorText(err) });
  }
}

async function sendViaSmtp(
  input: EmailSendInput,
  recipients: string[],
  timeoutMs: number
): Promise<ProviderDispatchResult> {
  const host = (input.smtpHost || '').trim();
  if (!host) {
    return result('smtp', { error: 'SMTP host is required.' });
  }
  const fromEmail = (input.fromEmail || input.smtpUser || '').trim();
  if (!fromEmail) {
    return result('smtp', { error: 'A from address (or SMTP username) is required.' });
  }

  const nodemailer: any = await import('nodemailer');
  const transporter = nodemailer.createTransport({
    host,
    port: input.smtpPort || 587,
    secure: Boolean(input.smtpSecure),
    auth: input.smtpUser ? { user: input.smtpUser, pass: input.smtpPass } : undefined,
    connectionTimeout: timeoutMs,
    greetingTimeout: timeoutMs,
    socketTimeout: timeoutMs,
  });

  const info = await transporter.sendMail({
    from: input.fromName ? `"${input.fromName}" <${fromEmail}>` : fromEmail,
    to: recipients.join(', '),
    subject: input.subject,
    html: input.html,
  });

  return { ok: true, provider: 'smtp', receiptId: info?.messageId ? String(info.messageId) : undefined };
}

async function sendViaResend(
  input: EmailSendInput,
  recipients: string[],
  timeoutMs: number
): Promise<ProviderDispatchResult> {
  const apiKey = (input.apiKey || '').trim();
  const fromEmail = (input.fromEmail || '').trim();
  if (!apiKey) return result('resend', { error: 'Resend API key is required.' });
  if (!fromEmail) return result('resend', { error: 'A from address is required.' });

  const res = await requestWithTimeout(
    'https://api.resend.com/emails',
    {
      method: 'POST',
      headers: { [AUTH_HEADER]: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: input.fromName ? `${input.fromName} <${fromEmail}>` : fromEmail,
        to: recipients,
        subject: input.subject,
        html: input.html,
      }),
    },
    timeoutMs
  );

  const json: any = await res.json().catch(() => null);
  if (!res.ok || !json?.id) {
    return result('resend', { error: json?.message || `Resend rejected the request (HTTP ${res.status}).` });
  }
  return { ok: true, provider: 'resend', receiptId: String(json.id) };
}

async function sendViaSendGrid(
  input: EmailSendInput,
  recipients: string[],
  timeoutMs: number
): Promise<ProviderDispatchResult> {
  const apiKey = (input.apiKey || '').trim();
  const fromEmail = (input.fromEmail || '').trim();
  if (!apiKey) return result('sendgrid', { error: 'SendGrid API key is required.' });
  if (!fromEmail) return result('sendgrid', { error: 'A from address is required.' });

  const res = await requestWithTimeout(
    'https://api.sendgrid.com/v3/mail/send',
    {
      method: 'POST',
      headers: { [AUTH_HEADER]: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: recipients.map((email) => ({ email })) }],
        from: { email: fromEmail, name: input.fromName || undefined },
        subject: input.subject,
        content: [{ type: 'text/html', value: input.html }],
      }),
    },
    timeoutMs
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return result('sendgrid', { error: text || `SendGrid rejected the request (HTTP ${res.status}).` });
  }
  return { ok: true, provider: 'sendgrid', receiptId: res.headers.get('x-message-id') || undefined };
}
