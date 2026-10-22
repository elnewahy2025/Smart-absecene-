import admin from 'firebase-admin';
import type { SchoolMessagingGatewayConfig } from '../src/types/attendance';
import {
  decryptGatewayConfig,
  GATEWAY_SECRET_FIELDS,
  mergeGatewaySecretValue,
} from '../src/utils/tenantGatewaySecrets';

// Messaging gateways store their non-secret settings in `settings_private`
// alongside an AES-256-GCM encrypted envelope for credentials. A null return
// means the caller has neither privileged Firestore access nor the school has
// not configured a gateway, so the caller can fail closed instead of pretending
// a message was sent.
const GATEWAY_STRING_FIELDS = [
  'whatsappPhoneNumber',
  'whatsappBusinessAccountId',
  'whatsappPhoneNumberId',
  'smsSenderId',
  'smsSenderPhone',
  'smtpHost',
  'smtpUser',
  'fromEmail',
  'fromName',
] as const;

export const DEFAULT_GATEWAY_CONFIG: SchoolMessagingGatewayConfig = {
  whatsappPhoneNumber: '',
  whatsappServiceMode: 'web_direct',
  smsProvider: 'taqnyat',
  smsSenderId: '',
  enableWhatsAppNotifications: false,
  enableSmsNotifications: false,
};

export function sanitizeGatewayConfig(
  input: any,
  base: SchoolMessagingGatewayConfig
): SchoolMessagingGatewayConfig {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const next: any = { ...base };

  for (const field of GATEWAY_STRING_FIELDS) {
    if (typeof source[field] === 'string') {
      next[field] = source[field].trim().slice(0, field === 'smtpHost' ? 255 : 500);
    }
  }
  for (const field of GATEWAY_SECRET_FIELDS) {
    if (typeof source[field] === 'string') {
      const merged = mergeGatewaySecretValue(source[field], base[field]);
      if (merged !== undefined) next[field] = merged.slice(0, 2000);
    }
  }
  if (['web_direct', 'cloud_api'].includes(source.whatsappServiceMode)) {
    next.whatsappServiceMode = source.whatsappServiceMode;
  }
  if (['taqnyat', 'unifonic', 'twilio', 'msegat'].includes(source.smsProvider)) {
    next.smsProvider = source.smsProvider;
  }
  if (['smtp', 'resend', 'sendgrid'].includes(source.emailProvider)) {
    next.emailProvider = source.emailProvider;
  }
  if (typeof source.smtpPort === 'number' && Number.isFinite(source.smtpPort)) {
    next.smtpPort = Math.trunc(source.smtpPort);
  }
  for (const field of ['smtpSecure', 'emailEnabled', 'enableWhatsAppNotifications', 'enableSmsNotifications'] as const) {
    if (typeof source[field] === 'boolean') {
      next[field] = source[field];
    }
  }
  return next as SchoolMessagingGatewayConfig;
}

export function createGatewayLoader(isFirebaseAdminReady: () => boolean) {
  return async function loadMessagingGatewayConfig(
    tenantId: string
  ): Promise<SchoolMessagingGatewayConfig | null> {
    if (!isFirebaseAdminReady()) return null;
    try {
      const snapshot = await admin.firestore().doc(`settings_private/${tenantId}`).get();
      if (!snapshot.exists) return null;

      const data = snapshot.data();
      const publicConfig = data?.messagingGateway;
      const encrypted = data?.messagingGatewaySecrets;
      const hasPublic = publicConfig && typeof publicConfig === 'object' && !Array.isArray(publicConfig);
      const hasEncrypted = encrypted && typeof encrypted === 'object' && !Array.isArray(encrypted);

      if (!hasPublic && !hasEncrypted) return null;

      const base = hasPublic ? (publicConfig as Record<string, unknown>) : {};
      if (hasEncrypted) {
        const decrypted = decryptGatewayConfig(encrypted);
        if (decrypted) {
          return { ...base, ...decrypted } as unknown as SchoolMessagingGatewayConfig;
        }
      }
      return Object.keys(base).length > 0 ? (base as unknown as SchoolMessagingGatewayConfig) : null;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`[GATEWAY:${tenantId}] Could not load messaging gateway config:`, msg);
      return null;
    }
  };
}
