import { describe, it, expect } from 'vitest';
import { UserRole, NotificationOutboxItem, UserProfile } from '../types/attendance';

/**
 * RBAC and Multi-Tenant Security Validator for Parent Notification Dispatching
 * Directly mirrors server.ts authorization logic and AttendanceContext rules.
 */
export const checkCanDispatchNotifications = (role: UserRole): boolean => {
  return role === 'admin' || role === 'registrar' || role === 'super_admin';
};

export const validateNotificationDispatchPayload = (
  user: { role: UserRole; tenantId: string },
  notifications: Partial<NotificationOutboxItem>[]
): { allowed: boolean; statusCode: number; error?: string } => {
  // 1. Role Authorization Check
  if (!checkCanDispatchNotifications(user.role)) {
    return {
      allowed: false,
      statusCode: 403,
      error: `Forbidden: Role '${user.role}' lacks required permissions. Allowed roles: [admin, registrar, super_admin]`,
    };
  }

  // 2. Payload Validation
  if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
    return {
      allowed: false,
      statusCode: 400,
      error: 'Missing or empty notifications array payload.',
    };
  }

  // 3. Multi-Tenant Isolation: Prevent cross-tenant message injection
  if (user.role !== 'super_admin') {
    const crossTenantItem = notifications.find(
      (n) => n.tenantId && n.tenantId !== user.tenantId
    );
    if (crossTenantItem) {
      return {
        allowed: false,
        statusCode: 403,
        error: `Cross-tenant dispatch forbidden. Item belongs to '${crossTenantItem.tenantId}', but authenticated user belongs to '${user.tenantId}'.`,
      };
    }
  }

  return { allowed: true, statusCode: 200 };
};

describe('Notification Dispatch RBAC & Multi-Tenant Security Tests', () => {
  const school1Admin = { role: 'admin' as UserRole, tenantId: 'school-1' };
  const school1Registrar = { role: 'registrar' as UserRole, tenantId: 'school-1' };
  const platformOwner = { role: 'super_admin' as UserRole, tenantId: 'platform' };
  const school1Teacher = { role: 'teacher' as UserRole, tenantId: 'school-1' };
  const school1Parent = { role: 'parent' as UserRole, tenantId: 'school-1' };

  const validSchool1Batch: Partial<NotificationOutboxItem>[] = [
    {
      id: 'notif-1',
      tenantId: 'school-1',
      studentId: 'std-101',
      recipientPhone: '+966509990011',
      recipientName: 'د. خالد المطيري',
      messageText: 'تذكير غياب مدرسي رسمي',
      channel: 'WhatsApp',
    },
    {
      id: 'notif-2',
      tenantId: 'school-1',
      studentId: 'std-102',
      recipientPhone: '+966503332211',
      recipientName: 'أ. عبد العزيز العتيبي',
      messageText: 'تنبيه تأخر صباحي',
      channel: 'SMS',
    },
  ];

  const crossTenantBatch: Partial<NotificationOutboxItem>[] = [
    {
      id: 'notif-school2-x',
      tenantId: 'school-2', // Foreign school
      studentId: 'std-201',
      recipientPhone: '+966501112233',
      recipientName: 'أ. أحمد الغامدي',
      messageText: 'رسالة لمدرسة أخرى',
      channel: 'WhatsApp',
    },
  ];

  it('Allows school administrator to dispatch notifications to parents', () => {
    const result = validateNotificationDispatchPayload(school1Admin, validSchool1Batch);
    expect(result.allowed).toBe(true);
    expect(result.statusCode).toBe(200);
  });

  it('Allows school registrar to dispatch notifications to parents', () => {
    const result = validateNotificationDispatchPayload(school1Registrar, validSchool1Batch);
    expect(result.allowed).toBe(true);
    expect(result.statusCode).toBe(200);
  });

  it('Allows platform owner (super_admin) to dispatch across all schools', () => {
    const result = validateNotificationDispatchPayload(platformOwner, validSchool1Batch);
    expect(result.allowed).toBe(true);
    expect(result.statusCode).toBe(200);

    // Super admin can dispatch even mixed or other tenant messages
    const crossResult = validateNotificationDispatchPayload(platformOwner, crossTenantBatch);
    expect(crossResult.allowed).toBe(true);
    expect(crossResult.statusCode).toBe(200);
  });

  it('Strictly rejects teachers from dispatching parent notifications with 403 Forbidden', () => {
    const result = validateNotificationDispatchPayload(school1Teacher, validSchool1Batch);
    expect(result.allowed).toBe(false);
    expect(result.statusCode).toBe(403);
    expect(result.error).toContain("Role 'teacher' lacks required permissions");
  });

  it('Strictly rejects parents from dispatching notifications with 403 Forbidden', () => {
    const result = validateNotificationDispatchPayload(school1Parent, validSchool1Batch);
    expect(result.allowed).toBe(false);
    expect(result.statusCode).toBe(403);
    expect(result.error).toContain("Role 'parent' lacks required permissions");
  });

  it('Blocks cross-tenant notification injection for school staff', () => {
    const result = validateNotificationDispatchPayload(school1Admin, crossTenantBatch);
    expect(result.allowed).toBe(false);
    expect(result.statusCode).toBe(403);
    expect(result.error).toContain("Cross-tenant dispatch forbidden. Item belongs to 'school-2'");
  });

  it('Rejects empty or malformed notification payloads with 400 Bad Request', () => {
    const result = validateNotificationDispatchPayload(school1Admin, []);
    expect(result.allowed).toBe(false);
    expect(result.statusCode).toBe(400);
    expect(result.error).toContain('Missing or empty notifications array payload');
  });
});
