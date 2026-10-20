import crypto from 'crypto';
import type { SchoolMessagingGatewayConfig } from '../types/attendance';

/**
 * AES-256-GCM envelope for school messaging credentials (SMS / WhatsApp /
 * SMTP). The plaintext never touches Firestore: the API stores the public
 * fields separately and keeps this payload in `settings_private`.
 */
export interface EncryptedGatewayPayload {
  iv: string; // hex
  tag: string; // hex
  data: string; // hex
  updatedAt: string;
}

const getMasterKey = (): Buffer => {
  const secret = process.env.TENANT_ENCRYPTION_MASTER_KEY;
  if (!secret) {
    throw new Error('TENANT_ENCRYPTION_MASTER_KEY is required to encrypt or decrypt messaging gateway credentials.');
  }
  return crypto.createHash('sha256').update(secret).digest();
};

export function encryptGatewayConfig(config: Record<string, unknown>): EncryptedGatewayPayload {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getMasterKey(), iv);
  let encrypted = cipher.update(JSON.stringify(config), 'utf-8', 'hex');
  encrypted += cipher.final('hex');

  return {
    iv: iv.toString('hex'),
    tag: cipher.getAuthTag().toString('hex'),
    data: encrypted,
    updatedAt: new Date().toISOString(),
  };
}

export function decryptGatewayConfig(payload: EncryptedGatewayPayload): Record<string, unknown> | null {
  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      getMasterKey(),
      Buffer.from(payload.iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(payload.tag, 'hex'));
    let decrypted = decipher.update(payload.data, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    const parsed = JSON.parse(decrypted);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch (err) {
    console.error('[SECURITY] Failed to decrypt messaging gateway credentials:', err);
    return null;
  }
}

export const GATEWAY_SECRET_FIELDS = [
  'whatsappApiToken',
  'smsApiKey',
  'smsApiSecret',
  'smtpPass',
  'emailApiKey',
] as const;

/** Sentinel returned to the browser instead of a stored secret. */
export const GATEWAY_SECRET_MASK = '••••••••••••••••';

/**
 * Returns a copy that is safe to send to the owner's browser. Public fields are
 * untouched; every non-empty secret becomes the mask. The owner can replace a
 * secret by typing a new value, and the server preserves the stored value when
 * it receives the mask back.
 */
export function maskGatewaySecrets(
  config: SchoolMessagingGatewayConfig
): SchoolMessagingGatewayConfig {
  const masked: Record<string, unknown> = { ...config };
  for (const field of GATEWAY_SECRET_FIELDS) {
    const value = masked[field];
    if (typeof value === 'string' && value.length > 0) {
      masked[field] = GATEWAY_SECRET_MASK;
    }
  }
  return masked as unknown as SchoolMessagingGatewayConfig;
}

/**
 * Resolves a secret submitted by the client against the stored value:
 * - the mask (or any bullet-only string) means "keep the stored value";
 * - an empty string means "clear the stored value";
 * - any other string replaces it.
 */
export function mergeGatewaySecretValue(incoming: unknown, current: unknown): string | undefined {
  const stored = typeof current === 'string' ? current : '';
  if (typeof incoming !== 'string') return stored || undefined;
  const trimmed = incoming.trim();
  if (trimmed === '') return '';
  if (trimmed === GATEWAY_SECRET_MASK || /^[•]+$/.test(trimmed)) return stored;
  return incoming;
}

export interface GatewayDocument {
  messagingGateway: Record<string, unknown>;
  messagingGatewaySecrets: EncryptedGatewayPayload;
  updatedAt: string;
  updatedBy: string;
}

/**
 * Builds the Firestore document for `settings_private/{tenantId}`: public
 * fields go to `messagingGateway`, and the complete config (including secrets)
 * is encrypted into `messagingGatewaySecrets`. No plaintext secret is written.
 */
export function buildGatewayDocument(
  config: SchoolMessagingGatewayConfig,
  updatedBy: string
): GatewayDocument {
  const timestamp = new Date().toISOString();
  const complete: SchoolMessagingGatewayConfig = {
    ...config,
    lastConfiguredByRole: 'super_admin',
    lastConfiguredByEmail: updatedBy,
    lastConfiguredAt: timestamp,
  };
  const publicConfig: Record<string, unknown> = { ...complete };
  for (const field of GATEWAY_SECRET_FIELDS) {
    delete publicConfig[field];
  }
  return {
    messagingGateway: publicConfig,
    messagingGatewaySecrets: encryptGatewayConfig(complete as unknown as Record<string, unknown>),
    updatedAt: timestamp,
    updatedBy,
  };
}
