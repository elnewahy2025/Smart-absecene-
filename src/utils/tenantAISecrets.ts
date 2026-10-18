import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Master encryption key derived from system environment or persistent secret
// In production, set TENANT_ENCRYPTION_MASTER_KEY in environment
const getMasterKey = (): Buffer => {
  const secret = process.env.TENANT_ENCRYPTION_MASTER_KEY;
  if (!secret) {
    throw new Error('TENANT_ENCRYPTION_MASTER_KEY is required to encrypt or decrypt tenant AI keys.');
  }
  return crypto.createHash('sha256').update(secret).digest();
};
// Derive consistent 32-byte key using SHA-256

const SECRETS_FILE_PATH = process.env.TENANT_AI_SECRETS_PATH
  ? path.resolve(process.env.TENANT_AI_SECRETS_PATH)
  : path.resolve(process.cwd(), 'tenant-ai-secrets.json');

export interface TenantAIConfig {
  tenantId: string;
  hasCustomKey: boolean;
  maskedKey: string;
  updatedAt?: string;
  preferredModel?: string;
}

interface EncryptedPayload {
  iv: string; // hex
  tag: string; // hex
  data: string; // hex
  maskedKey: string;
  updatedAt: string;
  preferredModel?: string;
}

// In-memory cache synced with encrypted file store
let secretsCache: Record<string, EncryptedPayload> = {};

function loadSecretsFromDisk() {
  try {
    if (fs.existsSync(SECRETS_FILE_PATH)) {
      const raw = fs.readFileSync(SECRETS_FILE_PATH, 'utf-8');
      secretsCache = JSON.parse(raw);
    } else {
      secretsCache = {};
    }
  } catch (err) {
    console.error('[SECURITY] Error reading tenant-ai-secrets.json:', err);
    secretsCache = {};
  }
}

function persistSecretsToDisk() {
  try {
    fs.writeFileSync(SECRETS_FILE_PATH, JSON.stringify(secretsCache, null, 2), {
      mode: 0o600, // Read/write only by owner
      encoding: 'utf-8',
    });
  } catch (err) {
    console.error('[SECURITY] Error persisting tenant-ai-secrets.json:', err);
  }
}

// Initial load
loadSecretsFromDisk();

/**
 * Encrypt a plaintext API key with AES-256-GCM.
 */
function encryptKey(plainKey: string): { iv: string; tag: string; data: string } {
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', getMasterKey(), iv);
  
  let encrypted = cipher.update(plainKey, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  return {
    iv: iv.toString('hex'),
    tag,
    data: encrypted,
  };
}

/**
 * Decrypt an encrypted payload with AES-256-GCM.
 */
function decryptKey(payload: { iv: string; tag: string; data: string }): string | null {
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', getMasterKey(), Buffer.from(payload.iv, 'hex'));
    decipher.setAuthTag(Buffer.from(payload.tag, 'hex'));
    let decrypted = decipher.update(payload.data, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
  } catch (err) {
    console.error('[SECURITY] Failed to decrypt tenant API key:', err);
    return null;
  }
}

/**
 * Mask an API key for safe UI display (e.g., "AQ.Ab8R•••••••••••••••••••••••••••••••••••••••••oNw")
 */
export function maskApiKey(plainKey: string): string {
  if (!plainKey || plainKey.length < 8) return '••••••••';
  const prefix = plainKey.slice(0, 7);
  const suffix = plainKey.slice(-4);
  return `${prefix}${'•'.repeat(Math.max(12, plainKey.length - 11))}${suffix}`;
}

/**
 * Save / Update an AI key for a specific school (Tenant).
 */
export function setTenantApiKey(tenantId: string, plainKey: string, preferredModel?: string): TenantAIConfig {
  const trimmed = plainKey.trim();
  const encrypted = encryptKey(trimmed);
  const maskedKey = maskApiKey(trimmed);
  const updatedAt = new Date().toISOString();

  secretsCache[tenantId] = {
    ...encrypted,
    maskedKey,
    updatedAt,
    preferredModel: preferredModel || 'gemini-3.5-flash',
  };

  persistSecretsToDisk();

  return {
    tenantId,
    hasCustomKey: true,
    maskedKey,
    updatedAt,
    preferredModel: secretsCache[tenantId].preferredModel,
  };
}

/**
 * Retrieve decrypted key for actual API calls on server.
 * Returns null if tenant has no custom key configured.
 */
export function getTenantApiKey(tenantId: string): string | null {
  const payload = secretsCache[tenantId];
  if (!payload || !payload.data) {
    return null;
  }
  return decryptKey(payload);
}

/**
 * Remove / Clear custom key for a tenant (reverts to system default/fallback).
 */
export function removeTenantApiKey(tenantId: string): boolean {
  if (secretsCache[tenantId]) {
    delete secretsCache[tenantId];
    persistSecretsToDisk();
    return true;
  }
  return false;
}

/**
 * Get sanitized config for UI (never returns raw secret).
 */
export function getTenantAIConfig(tenantId: string): TenantAIConfig {
  const payload = secretsCache[tenantId];
  if (!payload) {
    return {
      tenantId,
      hasCustomKey: false,
      maskedKey: '',
      preferredModel: 'gemini-3.5-flash',
    };
  }

  return {
    tenantId,
    hasCustomKey: true,
    maskedKey: payload.maskedKey,
    updatedAt: payload.updatedAt,
    preferredModel: payload.preferredModel || 'gemini-3.5-flash',
  };
}
