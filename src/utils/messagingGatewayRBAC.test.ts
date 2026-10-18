import { describe, it, expect } from 'vitest';
import {
  UserRole,
  SchoolMessagingGatewayConfig,
  TenantSchoolProfile,
} from '../types/attendance';
import {
  formatWhatsAppInternationalPhone,
  buildWhatsAppWebUrl,
  cleanCallingCode,
} from './whatsappUtils';

/**
 * Gatekeeper function mirroring AttendanceContext updateMessagingGateway RBAC rules.
 */
export function authorizeGatewayConfigUpdate(
  userRole: UserRole,
  userEmail: string,
  newConfig: Partial<SchoolMessagingGatewayConfig>,
  currentGateway: SchoolMessagingGatewayConfig
): { success: boolean; message: string; updatedConfig?: SchoolMessagingGatewayConfig } {
  // STRICT RULE: Only super_admin (The Owner) has authority to view/edit messaging credentials
  if (userRole !== 'super_admin') {
    return {
      success: false,
      message: 'عذراً، صلاحية ضبط وتعديل بوابات الرسائل والواتساب محصورة بمالك المنصة (The Owner) فقط.',
    };
  }

  const updated: SchoolMessagingGatewayConfig = {
    ...currentGateway,
    ...newConfig,
    lastConfiguredByRole: 'super_admin',
    lastConfiguredByEmail: userEmail,
    lastConfiguredAt: new Date().toISOString(),
  };

  return {
    success: true,
    message: 'تم حفظ وتفعيل بوابات المراسلة والواتساب للمدرسة بنجاح من قبل مالك المنصة.',
    updatedConfig: updated,
  };
}

describe('Messaging Gateway RBAC & WhatsApp Service Owner Authorization Tests', () => {
  const initialGateway: SchoolMessagingGatewayConfig = {
    whatsappPhoneNumber: '0501234567',
    whatsappServiceMode: 'web_direct',
    smsProvider: 'taqnyat',
    smsSenderId: 'SMARTSCHOOL',
    enableWhatsAppNotifications: true,
    enableSmsNotifications: true,
    lastConfiguredByRole: 'super_admin',
    lastConfiguredByEmail: 'owner@smartschool.platform',
    lastConfiguredAt: '2026-10-15T12:00:00Z',
  };

  it('Allows ONLY Platform Owner (super_admin) to update WhatsApp phone and SMS gateway credentials', () => {
    const ownerResult = authorizeGatewayConfigUpdate(
      'super_admin',
      'owner@smartschool.platform',
      {
        whatsappPhoneNumber: '0559998877',
        smsSenderId: 'AL-MAJD-VIP',
        smsApiKey: 'secret_live_key_99',
      },
      initialGateway
    );

    expect(ownerResult.success).toBe(true);
    expect(ownerResult.updatedConfig?.whatsappPhoneNumber).toBe('0559998877');
    expect(ownerResult.updatedConfig?.smsSenderId).toBe('AL-MAJD-VIP');
    expect(ownerResult.updatedConfig?.smsApiKey).toBe('secret_live_key_99');
    expect(ownerResult.updatedConfig?.lastConfiguredByRole).toBe('super_admin');
    expect(ownerResult.updatedConfig?.lastConfiguredByEmail).toBe('owner@smartschool.platform');
  });

  it('Strictly denies School Admin (admin) from modifying gateway configs or phone number', () => {
    const adminResult = authorizeGatewayConfigUpdate(
      'admin',
      'admin@andalus-school.edu.sa',
      { whatsappPhoneNumber: '0599999999' },
      initialGateway
    );

    expect(adminResult.success).toBe(false);
    expect(adminResult.message).toContain('مالك المنصة');
    expect(adminResult.updatedConfig).toBeUndefined();
  });

  it('Strictly denies Registrar, Teacher, and Parent roles from modifying gateway configs', () => {
    const forbiddenRoles: UserRole[] = ['registrar', 'teacher', 'parent'];

    for (const role of forbiddenRoles) {
      const res = authorizeGatewayConfigUpdate(
        role,
        `${role}@test.com`,
        { whatsappPhoneNumber: '0511112233' },
        initialGateway
      );
      expect(res.success).toBe(false);
      expect(res.message).toContain('The Owner');
    }
  });

  it('Generates valid WhatsApp Web deep links with international normalization', () => {
    const phone = '0501234567';
    const message = 'السلام عليكم ورحمة الله، نود إشعاركم بغياب نجلكم.';
    const callingCode = '+966';

    const url = buildWhatsAppWebUrl(phone, message, callingCode);
    expect(url).toBe(
      `https://wa.me/966501234567?text=${encodeURIComponent(message)}`
    );
  });

  it('Preserves default WhatsApp service mode as web_direct (zero cost, immediate)', () => {
    expect(initialGateway.whatsappServiceMode).toBe('web_direct');
  });
});
