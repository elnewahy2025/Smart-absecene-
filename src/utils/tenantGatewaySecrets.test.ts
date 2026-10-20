import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import type { SchoolMessagingGatewayConfig } from '../types/attendance';
import {
  buildGatewayDocument,
  decryptGatewayConfig,
  encryptGatewayConfig,
  GATEWAY_SECRET_FIELDS,
  GATEWAY_SECRET_MASK,
  maskGatewaySecrets,
  mergeGatewaySecretValue,
} from './tenantGatewaySecrets';

describe('Tenant messaging gateway encryption', () => {
  const config = {
    smtpHost: 'smtp.example.com',
    smtpUser: 'mailer@example.com',
    smtpPass: 'super-secret-smtp-credential',
    smsApiKey: 'sms-secret-key',
    enableSmsNotifications: true,
  };

  it('round-trips the configuration', () => {
    const payload = encryptGatewayConfig(config);
    expect(payload.data).not.toContain('super-secret');
    expect(decryptGatewayConfig(payload)).toEqual(config);
  });

  it('produces a fresh IV/ciphertext for identical input', () => {
    const first = encryptGatewayConfig(config);
    const second = encryptGatewayConfig(config);
    expect(first.iv).not.toBe(second.iv);
    expect(first.data).not.toBe(second.data);
  });

  it('rejects a tampered authentication tag', () => {
    const payload = encryptGatewayConfig(config);
    const firstTagChar = payload.tag[0] === '0' ? '1' : '0';
    const tampered = { ...payload, tag: `${firstTagChar}${payload.tag.slice(1)}` };
    expect(decryptGatewayConfig(tampered)).toBeNull();
  });
});

describe('Gateway secret masking and merging', () => {
  const gateway = {
    whatsappPhoneNumber: '+966500000000',
    whatsappServiceMode: 'cloud_api',
    whatsappApiToken: 'whatsapp-token',
    smsProvider: 'taqnyat',
    smsSenderId: 'SMARTSCHOOL',
    smsApiKey: 'sms-key',
    smsApiSecret: 'sms-secret',
    enableWhatsAppNotifications: true,
    enableSmsNotifications: true,
    emailEnabled: true,
    emailProvider: 'smtp',
    smtpHost: 'smtp.example.com',
    smtpPort: 465,
    smtpSecure: true,
    smtpUser: 'mailer@example.com',
    smtpPass: 'smtp-password',
    emailApiKey: '',
    fromEmail: 'school@example.com',
    fromName: 'School',
  } as SchoolMessagingGatewayConfig;

  it('masks every non-empty secret and leaves public fields untouched', () => {
    const masked = maskGatewaySecrets(gateway);
    expect(masked.smtpPass).toBe(GATEWAY_SECRET_MASK);
    expect(masked.smsApiKey).toBe(GATEWAY_SECRET_MASK);
    expect(masked.smsApiSecret).toBe(GATEWAY_SECRET_MASK);
    expect(masked.whatsappApiToken).toBe(GATEWAY_SECRET_MASK);
    expect(masked.emailApiKey).toBe('');
    expect(masked.smtpHost).toBe('smtp.example.com');
    expect(masked.smtpPort).toBe(465);
    expect(gateway.smtpPass).toBe('smtp-password');
  });

  it('preserves a stored secret when the client returns the mask', () => {
    expect(mergeGatewaySecretValue(GATEWAY_SECRET_MASK, 'stored-secret')).toBe('stored-secret');
    expect(mergeGatewaySecretValue('••••', 'stored-secret')).toBe('stored-secret');
    expect(mergeGatewaySecretValue(undefined, 'stored-secret')).toBe('stored-secret');
  });

  it('clears a secret only for an explicitly empty value', () => {
    expect(mergeGatewaySecretValue('', 'stored-secret')).toBe('');
    expect(mergeGatewaySecretValue('   ', 'stored-secret')).toBe('');
    expect(mergeGatewaySecretValue('new-secret', 'stored-secret')).toBe('new-secret');
  });

  it('builds a document with no plaintext secrets and a decryptable payload', () => {
    const document = buildGatewayDocument(gateway, 'owner@example.com');
    for (const field of GATEWAY_SECRET_FIELDS) {
      expect(document.messagingGateway).not.toHaveProperty(field);
    }
    expect(JSON.stringify(document.messagingGateway)).not.toContain('smtp-password');
    expect(document.messagingGateway.lastConfiguredByRole).toBe('super_admin');
    expect(document.messagingGateway.lastConfiguredByEmail).toBe('owner@example.com');
    expect(document.updatedBy).toBe('owner@example.com');

    const decrypted = decryptGatewayConfig(document.messagingGatewaySecrets);
    expect(decrypted).toMatchObject({
      smtpPass: 'smtp-password',
      smsApiKey: 'sms-key',
      smsApiSecret: 'sms-secret',
      whatsappApiToken: 'whatsapp-token',
      lastConfiguredByRole: 'super_admin',
      lastConfiguredByEmail: 'owner@example.com',
      lastConfiguredAt: document.updatedAt,
    });
  });
});
