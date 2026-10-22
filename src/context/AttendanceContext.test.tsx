// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => ({ user: null as { uid: string; email: string } | null }));

vi.mock('../lib/firebase', () => ({
  auth: { currentUser: null },
  db: {},
  googleProvider: {},
  handleFirestoreError: vi.fn(),
  OperationType: { GET: 'get', WRITE: 'write' },
}));

vi.mock('firebase/auth', () => ({
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn(),
  getRedirectResult: vi.fn().mockResolvedValue(null),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn().mockResolvedValue(undefined),
  onAuthStateChanged: vi.fn((_auth: unknown, cb: (user: unknown) => void) => {
    cb(authState.user);
    return () => {};
  }),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  setDoc: vi.fn().mockResolvedValue(undefined),
  collection: vi.fn(() => ({})),
  getDoc: vi.fn().mockResolvedValue({ exists: () => false, data: () => undefined }),
  onSnapshot: vi.fn(() => () => {}),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  getDocs: vi.fn().mockResolvedValue({ docs: [], forEach: () => {} }),
  updateDoc: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../lib/api', () => ({
  authenticatedFetch: vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) }),
  setApiTenantOverride: vi.fn(),
}));

import { AttendanceProvider, useAttendance } from './AttendanceContext';
import type { AttendanceContextType } from './attendanceContextSupport';
import { localCache } from '../utils/localCache';
import { authenticatedFetch } from '../lib/api';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';
import { getDoc } from 'firebase/firestore';

const EXPECTED_CONTEXT_KEYS = [
  'addAuditLog',
  'addBehaviourIncident',
  'addStudent',
  'auditLogs',
  'behaviourIncidents',
  'canDispatchDigest',
  'canEditSession',
  'canImportStudents',
  'canManageOutbox',
  'canManageSettings',
  'canReopenSessions',
  'canReviewJustifications',
  'classesStats',
  'createJustification',
  'createNewSession',
  'createUser',
  'currentTenant',
  'currentUser',
  'deleteStudent',
  'deleteUser',
  'digestConfig',
  'digestHistory',
  'dispatchDailyDigest',
  'firebaseUser',
  'generateCurrentDigest',
  'importStudents',
  'isOffDay',
  'isSuperAdmin',
  'justifications',
  'lang',
  'messagingGateway',
  'notifications',
  'officialHolidays',
  'provisionNewSchool',
  'quickMarkGroupAsPresent',
  'refreshDynamicTenants',
  'refreshSubscription',
  'reopenSession',
  'restoreStudent',
  'retryAllFailedNotifications',
  'retryNotification',
  'reviewJustification',
  'schoolEnrollmentStats',
  'schoolProfile',
  'sendAllChronicWarningNotifications',
  'sendChronicWarningNotification',
  'sendCustomParentNotification',
  'sessions',
  'setAllPresentInDraft',
  'setLang',
  'setTenantId',
  'setUserRole',
  'settings',
  'signInWithCredentials',
  'signInWithGoogle',
  'signOutGoogle',
  'students',
  'submitSession',
  'subscriptionAccess',
  'tenantDomainConfig',
  'tenantSubscription',
  'tenants',
  'transferStudent',
  'updateDigestConfig',
  'updateJustificationAnalysis',
  'updateMessagingGateway',
  'updateRecord',
  'updateSchoolProfile',
  'updateSettings',
  'updateStudent',
  'updateUser',
  'users',
  'weekendDays',
].sort();

let captured: AttendanceContextType | null = null;

const Probe: React.FC = () => {
  captured = useAttendance();
  return null;
};

function renderProvider(initialTenantId = 'school-1') {
  return render(
    <AttendanceProvider initialTenantId={initialTenantId}>
      <Probe />
    </AttendanceProvider>
  );
}

beforeEach(() => {
  captured = null;
  authState.user = null;
  localCache.removeItem('school_current_tenant_id');
  localCache.removeItem('school_current_user_role');
  localCache.removeItem('school_dynamic_tenants');

  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status: 503,
    json: async () => ({}),
  }) as unknown as typeof fetch;
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('AttendanceContext provider harness', () => {
  it('renders and exposes the full context surface expected by consumers', () => {
    renderProvider();
    expect(captured).not.toBeNull();
    expect(Object.keys(captured as object).sort()).toEqual(EXPECTED_CONTEXT_KEYS);
  });

  it('throws when useAttendance is used outside the provider', () => {
    const Bare: React.FC = () => {
      useAttendance();
      return null;
    };
    expect(() => render(<Bare />)).toThrow(/AttendanceProvider/);
  });

  it('initialises the default tenant, role and seeded data collections', () => {
    renderProvider();
    const value = captured as AttendanceContextType;
    expect(value.currentTenant.id).toBe('school-1');
    expect(value.currentUser.role).toBe('parent');
    expect(value.currentUser.tenantId).toBe('school-1');
    expect(value.isSuperAdmin).toBe(false);
    expect(value.canManageSettings).toBe(false);
    expect(Array.isArray(value.users)).toBe(true);
    expect(Array.isArray(value.students)).toBe(true);
    expect(Array.isArray(value.sessions)).toBe(true);
    expect(value.tenants.some((t) => t.id === 'school-1')).toBe(true);
  });

  it('exposes every declared action as a callable function', () => {
    renderProvider();
    const value = captured as AttendanceContextType;
    const actionKeys: (keyof AttendanceContextType)[] = [
      'signInWithGoogle',
      'signOutGoogle',
      'signInWithCredentials',
      'refreshSubscription',
      'setTenantId',
      'setUserRole',
      'setLang',
      'canEditSession',
      'provisionNewSchool',
      'refreshDynamicTenants',
      'createUser',
      'updateUser',
      'deleteUser',
      'updateRecord',
      'setAllPresentInDraft',
      'quickMarkGroupAsPresent',
      'submitSession',
      'reopenSession',
      'createNewSession',
      'createJustification',
      'reviewJustification',
      'updateJustificationAnalysis',
      'retryNotification',
      'retryAllFailedNotifications',
      'sendCustomParentNotification',
      'sendChronicWarningNotification',
      'sendAllChronicWarningNotifications',
      'addAuditLog',
      'addStudent',
      'updateStudent',
      'transferStudent',
      'restoreStudent',
      'deleteStudent',
      'importStudents',
      'updateSettings',
      'updateSchoolProfile',
      'updateMessagingGateway',
      'isOffDay',
      'addBehaviourIncident',
      'updateDigestConfig',
      'generateCurrentDigest',
      'dispatchDailyDigest',
    ];
    for (const key of actionKeys) {
      expect(typeof value[key], `expected ${String(key)} to be a function`).toBe('function');
    }
  });

  it('updates role-derived permissions through setUserRole', () => {
    renderProvider();
    expect((captured as AttendanceContextType).isSuperAdmin).toBe(false);
    act(() => {
      (captured as AttendanceContextType).setUserRole('super_admin');
    });
    const value = captured as AttendanceContextType;
    expect(value.currentUser.role).toBe('super_admin');
    expect(value.isSuperAdmin).toBe(true);
    expect(value.canManageSettings).toBe(true);
  });

  it('routes to another tenant through setTenantId', () => {
    renderProvider();
    act(() => {
      (captured as AttendanceContextType).setTenantId('school-2');
    });
    expect((captured as AttendanceContextType).currentTenant.id).toBe('school-2');
  });

  it('computes off-day checks from the resolved school week', () => {
    renderProvider();
    const result = (captured as AttendanceContextType).isOffDay('2026-10-09');
    expect(result).toBeTypeOf('object');
    expect(typeof result.isOff).toBe('boolean');
    expect(Array.isArray((captured as AttendanceContextType).weekendDays)).toBe(true);
  });

  it('marks a session editable according to the active role', () => {
    renderProvider();
    const draftSession = { status: 'draft', classId: 'class-1', teacherId: '' } as any;
    expect((captured as AttendanceContextType).canEditSession(draftSession)).toBe(false);
    act(() => {
      (captured as AttendanceContextType).setUserRole('admin');
    });
    expect((captured as AttendanceContextType).canEditSession(draftSession)).toBe(true);
  });

  it('exposes the default daily digest configuration', () => {
    renderProvider();
    const value = captured as AttendanceContextType;
    expect(value.digestConfig.scheduledTime).toBe('06:45');
    expect(value.digestConfig.enabled).toBe(true);
    expect(Array.isArray(value.digestConfig.recipients)).toBe(true);
    expect(value.digestHistory).toEqual([]);
  });

  it('updates the digest configuration and records an audit entry', () => {
    renderProvider();
    act(() => {
      (captured as AttendanceContextType).setUserRole('admin');
    });
    const value = captured as AttendanceContextType;
    const before = value.auditLogs.length;
    act(() => {
      value.updateDigestConfig({ scheduledTime: '07:30', principalPhone: '0500000000' });
    });
    const next = captured as AttendanceContextType;
    expect(next.digestConfig.scheduledTime).toBe('07:30');
    expect(next.digestConfig.principalPhone).toBe('0500000000');
    expect(next.auditLogs.length).toBe(before + 1);
    expect(next.auditLogs[0].entityType).toBe('settings');
  });

  it('generates a digest item from the current attendance data', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({}) } as any);
    renderProvider();
    const value = captured as AttendanceContextType;
    let digest: any;
    await act(async () => {
      digest = await value.generateCurrentDigest();
    });
    expect(digest.status).toBe('scheduled');
    expect(typeof digest.htmlContent).toBe('string');
    expect(digest.htmlContent.length).toBeGreaterThan(0);
    expect(typeof digest.subject).toBe('string');
    expect(digest.geminiBriefing).toBeUndefined();
  });

  it('blocks digest dispatch without elevated privileges', async () => {
    renderProvider();
    const value = captured as AttendanceContextType;
    await expect(value.dispatchDailyDigest()).rejects.toThrow(/Unauthorized/);
  });

  it('dispatches a digest for an elevated role and records history', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as any);
    vi.mocked(authenticatedFetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ dispatchedAt: '2026-10-20T06:45:00.000Z', message: 'sent' }),
    } as any);
    renderProvider();
    act(() => {
      (captured as AttendanceContextType).setUserRole('admin');
    });
    const value = captured as AttendanceContextType;
    let result: any;
    await act(async () => {
      result = await value.dispatchDailyDigest(undefined, ['principal@school.test']);
    });
    expect(result.success).toBe(true);
    expect(result.digestItem.status).toBe('delivered');
    expect(result.digestItem.recipients).toEqual(['principal@school.test']);
    expect((captured as AttendanceContextType).digestHistory[0].id).toBe(result.digestItem.id);
    expect((captured as AttendanceContextType).digestConfig.lastDigestId).toBe(result.digestItem.id);
  });

  it('rejects user creation without a valid email', async () => {
    renderProvider();
    const value = captured as AttendanceContextType;
    const result = await value.createUser({ name: 'No Mail', email: 'invalid', role: 'teacher' } as any);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/البريد/);
  });

  it('creates a user through the server and adds it to the roster', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        user: { id: 'server-uid-1', email: 'new.teacher@school.test', name: 'New Teacher', role: 'teacher', tenantId: 'school-1' },
        temporaryPassword: 'TempPass123',
      }),
    } as any);
    renderProvider();
    act(() => {
      (captured as AttendanceContextType).setUserRole('admin');
    });
    const value = captured as AttendanceContextType;
    let result: any;
    await act(async () => {
      result = await value.createUser({
        name: 'New Teacher',
        email: 'new.teacher@school.test',
        role: 'teacher',
        status: 'active',
      } as any);
    });
    expect(result.success).toBe(true);
    expect(result.temporaryPassword).toBe('TempPass123');
    expect(result.message).toMatch(/TempPass123/);
    expect((captured as AttendanceContextType).users.some((u) => u.id === 'server-uid-1')).toBe(true);
  });

  it('surfaces a server failure when user creation is rejected', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ success: false, error: 'A user with this email exists.' }),
    } as any);
    renderProvider();
    const value = captured as AttendanceContextType;
    const result = await value.createUser({
      name: 'Dup',
      email: 'dup@school.test',
      role: 'teacher',
    } as any);
    expect(result.success).toBe(false);
    expect(result.message).toBe('A user with this email exists.');
    expect((captured as AttendanceContextType).users.some((u) => u.email === 'dup@school.test')).toBe(false);
  });

  it('updates a local profile when the server account is absent and records an audit entry', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ success: false }),
    } as any);
    renderProvider();
    act(() => {
      (captured as AttendanceContextType).setUserRole('admin');
    });
    const value = captured as AttendanceContextType;
    const target = value.users.find((u) => u.role !== 'super_admin')!;
    const auditBefore = value.auditLogs.length;
    let result: any;
    await act(async () => {
      result = await value.updateUser(target.id, { name: 'Renamed User' });
    });
    expect(result.success).toBe(true);
    const after = captured as AttendanceContextType;
    expect(after.users.find((u) => u.id === target.id)?.name).toBe('Renamed User');
    expect(after.auditLogs.length).toBe(auditBefore + 1);
  });

  it('never deletes the active account', async () => {
    renderProvider();
    act(() => {
      (captured as AttendanceContextType).setUserRole('admin');
    });
    const value = captured as AttendanceContextType;
    const selfDelete = await value.deleteUser(value.currentUser.id);
    expect(selfDelete.success).toBe(false);

    act(() => {
      (captured as AttendanceContextType).setUserRole('super_admin');
    });
    const ownerValue = captured as AttendanceContextType;
    const ownerDelete = await ownerValue.deleteUser(ownerValue.currentUser.id);
    expect(ownerDelete.success).toBe(false);
  });

  it('deletes a removable user through the server and removes the profile', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    } as any);
    renderProvider();
    act(() => {
      (captured as AttendanceContextType).setUserRole('admin');
    });
    const value = captured as AttendanceContextType;
    const target = value.users.find((u) => u.id !== value.currentUser.id && u.role !== 'super_admin')!;
    let result: any;
    await act(async () => {
      result = await value.deleteUser(target.id);
    });
    expect(result.success).toBe(true);
    expect((captured as AttendanceContextType).users.some((u) => u.id === target.id)).toBe(false);
  });

  it('requires a signed-in session to add a student', async () => {
    renderProvider();
    act(() => {
      (captured as AttendanceContextType).setUserRole('admin');
    });
    const value = captured as AttendanceContextType;
    await expect(
      value.addStudent({ fullName: 'A', nationalId: '1', studentNumber: '1', grade: 'g', className: 'c', classId: 'class-1a', guardianName: 'G', guardianPhone: '', guardianRelationship: '', bloodType: '' } as any)
    ).rejects.toThrow(/تسجيل الدخول/);
  });

  it('adds a student through the server and records it locally', async () => {
    authState.user = { uid: 'admin-uid', email: 'admin@school.test' };
    vi.mocked(authenticatedFetch).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        student: { id: 'srv-student-1', tenantId: 'school-1', fullName: 'Server Student', nationalId: '9001', studentNumber: '5001', grade: 'g', className: 'c', classId: 'class-1a', guardianName: 'G', guardianPhone: '', guardianRelationship: '', bloodType: '', attendanceRate: 100, totalAbsences: 0, totalLates: 0 },
      }),
    } as any);
    renderProvider();
    act(() => {
      (captured as AttendanceContextType).setUserRole('admin');
    });
    const value = captured as AttendanceContextType;
    const auditBefore = value.auditLogs.length;
    let created: any;
    await act(async () => {
      created = await value.addStudent({ fullName: 'Server Student', nationalId: '9001', studentNumber: '5001', grade: 'g', className: 'c', classId: 'class-1a', guardianName: 'G', guardianPhone: '', guardianRelationship: '', bloodType: '' } as any);
    });
    expect(created.id).toBe('srv-student-1');
    expect((captured as AttendanceContextType).students.some((s) => s.id === 'srv-student-1')).toBe(true);
    expect((captured as AttendanceContextType).auditLogs.length).toBe(auditBefore + 1);
    expect(authenticatedFetch).toHaveBeenCalledWith('/api/students', expect.objectContaining({ method: 'POST' }));
  });

  it('refuses imports without import privileges', async () => {
    renderProvider();
    const value = captured as AttendanceContextType;
    const result = await value.importStudents([{ fullName: 'Nope' }]);
    expect(result).toEqual({ imported: 0, duplicates: 0 });
    expect(authenticatedFetch).not.toHaveBeenCalled();
  });

  it('imports students through the server for an authorised role', async () => {
    authState.user = { uid: 'admin-uid', email: 'admin@school.test' };
    vi.mocked(authenticatedFetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        imported: 1,
        duplicates: 0,
        students: [{ id: 'srv-import-1', tenantId: 'school-1', fullName: 'Imported', nationalId: '9100', studentNumber: '5100', grade: 'g', className: 'c', classId: 'class-1a', guardianName: 'G', guardianPhone: '', guardianRelationship: '', bloodType: '', attendanceRate: 100, totalAbsences: 0, totalLates: 0 }],
      }),
    } as any);
    renderProvider();
    act(() => {
      (captured as AttendanceContextType).setUserRole('admin');
    });
    const value = captured as AttendanceContextType;
    let result: any;
    await act(async () => {
      result = await value.importStudents([{ fullName: 'Imported', nationalId: '9100', studentNumber: '5100', className: value.schoolProfile.classes?.[0]?.name }]);
    });
    expect(result.imported).toBe(1);
    expect((captured as AttendanceContextType).students.some((s) => s.id === 'srv-import-1')).toBe(true);
  });

  it('rejects transfers and deletions for unknown students', async () => {
    renderProvider();
    act(() => {
      (captured as AttendanceContextType).setUserRole('admin');
    });
    const value = captured as AttendanceContextType;
    expect((await value.transferStudent('missing', { destinationSchool: 'X' })).message).toBe('الطالب غير موجود');
    expect((await value.restoreStudent('missing')).message).toBe('الطالب غير موجود');
    expect((await value.deleteStudent('missing')).message).toBe('الطالب غير موجود');
  });

  it('applies local student updates while stripping protected fields', async () => {
    authState.user = { uid: 'admin-uid', email: 'admin@school.test' };
    renderProvider();
    act(() => {
      (captured as AttendanceContextType).setUserRole('admin');
    });
    let value = captured as AttendanceContextType;
    const target = await seedStudent(value);
    value = captured as AttendanceContextType;
    act(() => {
      value.updateStudent(target.id, {
        fullName: 'Renamed Student',
        tenantId: 'other-tenant',
        enrollmentStatus: 'transferred',
      } as any);
    });
    const after = (captured as AttendanceContextType).students.find((s) => s.id === target.id)!;
    expect(after.fullName).toBe('Renamed Student');
    expect(after.tenantId).toBe('school-1');
    expect(after.enrollmentStatus).toBe(target.enrollmentStatus);
  });

  it('blocks outbox broadcasts for roles without dispatch rights', () => {
    renderProvider();
    const value = captured as AttendanceContextType;
    expect(value.sendCustomParentNotification({ studentIds: ['s1'], messageText: 'x', channel: 'SMS' })).toBe(0);
    expect(value.sendChronicWarningNotification('s1', 1)).toBe(false);
    expect(value.sendAllChronicWarningNotifications(3)).toBe(0);
  });

  it('queues a templated custom notification for a student guardian', async () => {
    authState.user = { uid: 'admin-uid', email: 'admin@school.test' };
    renderProvider();
    act(() => {
      (captured as AttendanceContextType).setUserRole('admin');
    });
    let value = captured as AttendanceContextType;
    const student = await seedStudent(value);
    value = captured as AttendanceContextType;
    const before = value.notifications.length;
    let queued = 0;
    act(() => {
      queued = value.sendCustomParentNotification({
        studentIds: [student.id],
        messageText: 'مرحبا {student_name} من {school_name}',
        channel: 'WhatsApp',
        category: 'absence',
      });
    });
    expect(queued).toBe(1);
    const after = captured as AttendanceContextType;
    expect(after.notifications.length).toBe(before + 1);
    const item = after.notifications[0];
    expect(item.messageText).toContain(student.fullName);
    expect(item.sessionTitle).toBe('تذكير غياب مدرسي');
    expect(item.channel).toBe('WhatsApp');
  });

  it('sends a chronic warning for known students and skips unknown ids', async () => {
    authState.user = { uid: 'admin-uid', email: 'admin@school.test' };
    renderProvider();
    act(() => {
      (captured as AttendanceContextType).setUserRole('admin');
    });
    let value = captured as AttendanceContextType;
    const student = await seedStudent(value);
    value = captured as AttendanceContextType;
    expect((captured as AttendanceContextType).sendChronicWarningNotification('missing', 1)).toBe(false);
    let sent = false;
    act(() => {
      sent = (captured as AttendanceContextType).sendChronicWarningNotification(student.id, 2);
    });
    expect(sent).toBe(true);
    const warning = (captured as AttendanceContextType).notifications[0];
    expect(warning.category).toBe('warning');
    expect(warning.messageText).toContain('الإنذار الأكاديمي الثاني');
  });

  it('returns false when retrying an unknown or unauthorised notification', async () => {
    renderProvider();
    expect(await (captured as AttendanceContextType).retryNotification('missing')).toBe(false);
    await (captured as AttendanceContextType).retryAllFailedNotifications();
    expect(authenticatedFetch).not.toHaveBeenCalled();
  });

  const SEEDED_STUDENT = {
    id: 'srv-study-1',
    tenantId: 'school-1',
    fullName: 'Study Student',
    nationalId: '9200',
    studentNumber: '5200',
    grade: 'الصف العاشر',
    className: '10 / أ',
    classId: 'class-1a',
    guardianName: 'Guardian Study',
    guardianPhone: '971500000000',
    guardianRelationship: 'father',
    bloodType: 'O+',
    attendanceRate: 100,
    totalAbsences: 3,
    totalLates: 0,
  };

  let seedCounter = 0;

  async function seedStudent(value: AttendanceContextType) {
    seedCounter += 1;
    const seeded = {
      ...SEEDED_STUDENT,
      id: `srv-study-${seedCounter}`,
      nationalId: `92${seedCounter}0`,
      studentNumber: `52${seedCounter}0`,
    };
    vi.mocked(authenticatedFetch).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ success: true, student: seeded }),
    } as any);
    const { id: _id, tenantId: _tenantId, attendanceRate: _rate, totalAbsences: _abs, totalLates: _late, ...payload } = seeded;
    let student: any;
    await act(async () => {
      student = await value.addStudent(payload as any);
    });
    return student;
  }

  it('recalculates session counts when a record is updated', async () => {
    authState.user = { uid: 'admin-uid', email: 'admin@school.test' };
    renderProvider();
    act(() => {
      (captured as AttendanceContextType).setUserRole('admin');
    });
    let value = captured as AttendanceContextType;
    const student = await seedStudent(value);
    value = captured as AttendanceContextType;
    let session: any;
    act(() => {
      session = value.createNewSession('daily', 1, '', student.className, student.classId, student.grade);
    });
    value = captured as AttendanceContextType;
    const first = session.records[0];
    act(() => {
      value.updateRecord(session.id, first.studentId, 'absent');
    });
    value = captured as AttendanceContextType;
    const after = (captured as AttendanceContextType).sessions.find((s) => s.id === session.id)!;
    const record = after.records.find((r) => r.studentId === first.studentId)!;
    expect(record.status).toBe('absent');
    expect(after.absentCount).toBeGreaterThan(0);
    expect(after.presentCount).toBe(after.records.filter((r) => r.status === 'present').length);
  });

  it('marks the whole roster present and supports quick marking a subset', async () => {
    authState.user = { uid: 'admin-uid', email: 'admin@school.test' };
    renderProvider();
    act(() => {
      (captured as AttendanceContextType).setUserRole('admin');
    });
    let value = captured as AttendanceContextType;
    const student = await seedStudent(value);
    value = captured as AttendanceContextType;
    let session: any;
    act(() => {
      session = value.createNewSession('daily', 1, '', student.className, student.classId, student.grade);
    });
    value = captured as AttendanceContextType;
    act(() => {
      value.setAllPresentInDraft(session.id);
    });
    value = captured as AttendanceContextType;
    let after = (captured as AttendanceContextType).sessions.find((s) => s.id === session.id)!;
    expect(after.presentCount).toBe(after.records.length);
    expect(after.absentCount).toBe(0);

    const ids = after.records.slice(0, 1).map((r) => r.studentId);
    let quick: any;
    act(() => {
      quick = value.quickMarkGroupAsPresent(session.id, ids);
    });
    expect(quick.message).toContain('بنجاح');
    after = (captured as AttendanceContextType).sessions.find((s) => s.id === session.id)!;
    expect(after.records.filter((r) => r.status === 'present').length).toBe(after.records.length);
  });

  it('submits a session and queues guardian notifications for absences', async () => {
    authState.user = { uid: 'admin-uid', email: 'admin@school.test' };
    renderProvider();
    act(() => {
      (captured as AttendanceContextType).setUserRole('admin');
    });
    let value = captured as AttendanceContextType;
    const student = await seedStudent(value);
    value = captured as AttendanceContextType;
    let session: any;
    act(() => {
      session = value.createNewSession('daily', 1, '', student.className, student.classId, student.grade);
    });
    value = captured as AttendanceContextType;
    const record = session.records[0];
    act(() => {
      value.updateRecord(session.id, record.studentId, 'absent');
    });
    value = captured as AttendanceContextType;
    const beforeNotifs = (captured as AttendanceContextType).notifications.length;
    let result: any;
    act(() => {
      result = (captured as AttendanceContextType).submitSession(session.id);
    });
    expect(result.success).toBe(true);
    const after = captured as AttendanceContextType;
    expect(after.sessions.find((s) => s.id === session.id)?.status).toBe('submitted');
    expect(after.notifications.length).toBeGreaterThan(beforeNotifs);
    expect(after.notifications.slice(0, after.notifications.length - beforeNotifs).some((n) => n.statusType === 'absent')).toBe(true);
  });

  it('validates reopen requests before reopening a submitted session', async () => {
    authState.user = { uid: 'admin-uid', email: 'admin@school.test' };
    renderProvider();
    act(() => {
      (captured as AttendanceContextType).setUserRole('admin');
    });
    let value = captured as AttendanceContextType;
    const student = await seedStudent(value);
    value = captured as AttendanceContextType;
    let session: any;
    act(() => {
      session = value.createNewSession('daily', 1, '', student.className, student.classId, student.grade);
    });
    value = captured as AttendanceContextType;
    act(() => {
      value.submitSession(session.id);
    });
    value = captured as AttendanceContextType;
    const missingReason = value.reopenSession(session.id, '');
    expect(missingReason.success).toBe(false);
    const shortReason = value.reopenSession(session.id, 'abc');
    expect(shortReason.success).toBe(false);
    let reopened: any;
    act(() => {
      reopened = value.reopenSession(session.id, 'تصحيح رصد الغياب');
    });
    expect(reopened.success).toBe(true);
    expect((captured as AttendanceContextType).sessions.find((s) => s.id === session.id)?.status).toBe('reopened');
  });

  it('creates a new draft session seeded with the class roster', async () => {
    authState.user = { uid: 'admin-uid', email: 'admin@school.test' };
    renderProvider();
    act(() => {
      (captured as AttendanceContextType).setUserRole('admin');
    });
    let value = captured as AttendanceContextType;
    const student = await seedStudent(value);
    value = captured as AttendanceContextType;
    const before = value.sessions.length;
    let created: any;
    act(() => {
      created = value.createNewSession('daily', 1, '', student.className, student.classId, student.grade);
    });
    expect(created.status).toBe('draft');
    expect(created.records.some((r: { studentId: string }) => r.studentId === student.id)).toBe(true);
    expect((captured as AttendanceContextType).sessions.length).toBe(before + 1);
    expect((captured as AttendanceContextType).sessions[0].id).toBe(created.id);
  });

  it('prevents parents from filing excuses for unrelated students', async () => {
    renderProvider();
    const value = captured as AttendanceContextType;
    await expect(
      value.createJustification('not-my-child', '2026-11-10', 'medical', 'سبب')
    ).rejects.toThrow(/Unauthorized/);
  });

  it('rejects excuse dates outside the academic year or on off-days', async () => {
    authState.user = { uid: 'admin-uid', email: 'admin@school.test' };
    renderProvider();
    act(() => {
      (captured as AttendanceContextType).setUserRole('admin');
    });
    const value = captured as AttendanceContextType;
    await expect(
      value.createJustification('any-student', '2020-01-01', 'medical', 'سبب')
    ).rejects.toThrow(/خارج حدود/);
    await expect(
      value.createJustification('any-student', '2026-11-13', 'medical', 'سبب')
    ).rejects.toThrow(/يوافق/);
  });

  it('creates an excuse and records an audit entry', async () => {
    authState.user = { uid: 'admin-uid', email: 'admin@school.test' };
    renderProvider();
    act(() => {
      (captured as AttendanceContextType).setUserRole('admin');
    });
    let value = captured as AttendanceContextType;
    const student = await seedStudent(value);
    value = captured as AttendanceContextType;
    const before = value.justifications.length;
    const auditBefore = value.auditLogs.length;
    let just: any;
    await act(async () => {
      just = await value.createJustification(student.id, '2026-11-10', 'medical', 'عذر طبي موثق');
    });
    const after = captured as AttendanceContextType;
    expect(after.justifications.length).toBe(before + 1);
    expect(after.justifications[0].id).toBe(just.id);
    expect(after.justifications[0].status).toBe('pending');
    expect(after.auditLogs.length).toBe(auditBefore + 1);
  });

  it('reviews excuses and notifies guardians on approval', async () => {
    authState.user = { uid: 'admin-uid', email: 'admin@school.test' };
    renderProvider();
    act(() => {
      (captured as AttendanceContextType).setUserRole('admin');
    });
    let value = captured as AttendanceContextType;
    const student = await seedStudent(value);
    value = captured as AttendanceContextType;
    let just: any;
    await act(async () => {
      just = await value.createJustification(student.id, '2026-11-10', 'medical', 'عذر طبي');
    });
    const notificationsBefore = (captured as AttendanceContextType).notifications.length;
    act(() => {
      (captured as AttendanceContextType).reviewJustification(just.id, 'approved', 'مقبول');
    });
    const after = captured as AttendanceContextType;
    expect(after.justifications.find((j) => j.id === just.id)?.status).toBe('approved');
    expect(after.notifications.length).toBeGreaterThan(notificationsBefore);
    expect(after.notifications[0].category).toBe('excuse_approved');
  });

  it('ignores review attempts from unauthorised roles', async () => {
    authState.user = { uid: 'admin-uid', email: 'admin@school.test' };
    renderProvider();
    act(() => {
      (captured as AttendanceContextType).setUserRole('admin');
    });
    let value = captured as AttendanceContextType;
    const student = await seedStudent(value);
    value = captured as AttendanceContextType;
    let just: any;
    await act(async () => {
      just = await value.createJustification(student.id, '2026-11-10', 'medical', 'عذر');
    });
    act(() => {
      (captured as AttendanceContextType).setUserRole('parent');
    });
    act(() => {
      (captured as AttendanceContextType).reviewJustification(just.id, 'approved', 'x');
    });
    act(() => {
      (captured as AttendanceContextType).setUserRole('admin');
    });
    expect((captured as AttendanceContextType).justifications.find((j) => j.id === just.id)?.status).toBe('pending');
  });

  it('stores AI analysis on an excuse', async () => {
    authState.user = { uid: 'admin-uid', email: 'admin@school.test' };
    renderProvider();
    act(() => {
      (captured as AttendanceContextType).setUserRole('admin');
    });
    let value = captured as AttendanceContextType;
    const student = await seedStudent(value);
    value = captured as AttendanceContextType;
    let just: any;
    await act(async () => {
      just = await value.createJustification(student.id, '2026-11-10', 'medical', 'عذر');
    });
    act(() => {
      (captured as AttendanceContextType).updateJustificationAnalysis(just.id, { confidence: 0.8 });
    });
    expect((captured as AttendanceContextType).justifications.find((j) => j.id === just.id)?.aiAnalysis).toEqual({ confidence: 0.8 });
  });

  it('blocks settings updates for unauthorised roles', () => {
    renderProvider();
    const value = captured as AttendanceContextType;
    const before = value.settings.chronicAbsenceLimit;
    const auditBefore = value.auditLogs.length;
    act(() => {
      value.updateSettings({ chronicAbsenceLimit: 42 });
    });
    expect((captured as AttendanceContextType).settings.chronicAbsenceLimit).toBe(before);
    expect((captured as AttendanceContextType).auditLogs.length).toBe(auditBefore);
  });

  it('merges school settings and audits the change for administrators', () => {
    renderProvider();
    act(() => {
      (captured as AttendanceContextType).setUserRole('admin');
    });
    const value = captured as AttendanceContextType;
    const auditBefore = value.auditLogs.length;
    act(() => {
      (captured as AttendanceContextType).updateSettings({ chronicAbsenceLimit: 9 });
    });
    const after = captured as AttendanceContextType;
    expect(after.settings.chronicAbsenceLimit).toBe(9);
    expect(after.auditLogs.length).toBe(auditBefore + 1);
  });

  it('updates the school profile and only lets the platform owner edit the gateway block', async () => {
    renderProvider();
    act(() => {
      (captured as AttendanceContextType).setUserRole('admin');
    });
    const value = captured as AttendanceContextType;
    const originalGateway = value.schoolProfile.messagingGateway;
    await act(async () => {
      await value.updateSchoolProfile({
        schoolName: 'Updated School',
        messagingGateway: { whatsappPhoneNumber: '000' } as any,
      });
    });
    let after = captured as AttendanceContextType;
    expect(after.schoolProfile.schoolName).toBe('Updated School');
    expect(after.schoolProfile.messagingGateway).toEqual(originalGateway);

    act(() => {
      (captured as AttendanceContextType).setUserRole('super_admin');
    });
    const owner = captured as AttendanceContextType;
    await act(async () => {
      await owner.updateSchoolProfile({
        messagingGateway: { whatsappPhoneNumber: '111', whatsappServiceMode: 'web_direct', smsProvider: 'taqnyat', smsSenderId: '', enableWhatsAppNotifications: true, enableSmsNotifications: false } as any,
      });
    });
    after = captured as AttendanceContextType;
    expect(after.schoolProfile.messagingGateway?.whatsappPhoneNumber).toBe('111');
  });

  it('rejects messaging gateway updates from non-owners', async () => {
    renderProvider();
    act(() => {
      (captured as AttendanceContextType).setUserRole('admin');
    });
    const value = captured as AttendanceContextType;
    const result = await value.updateMessagingGateway({ whatsappPhoneNumber: '123' });
    expect(result.success).toBe(false);
    expect(authenticatedFetch).not.toHaveBeenCalled();
  });

  it('saves messaging gateway settings for the platform owner', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    } as any);
    renderProvider();
    act(() => {
      (captured as AttendanceContextType).setUserRole('super_admin');
    });
    const value = captured as AttendanceContextType;
    const auditBefore = value.auditLogs.length;
    let result: any;
    await act(async () => {
      result = await value.updateMessagingGateway({
        whatsappPhoneNumber: '966500000000',
        whatsappServiceMode: 'web_direct',
        smsProvider: 'taqnyat',
        smsSenderId: 'SENDER',
        enableWhatsAppNotifications: true,
        enableSmsNotifications: false,
      });
    });
    expect(result.success).toBe(true);
    const after = captured as AttendanceContextType;
    expect(after.messagingGateway?.whatsappPhoneNumber).toBe('966500000000');
    expect(after.auditLogs.length).toBe(auditBefore + 1);
    expect(authenticatedFetch).toHaveBeenCalledWith('/api/settings/messaging-gateway', expect.objectContaining({ method: 'PUT' }));
  });

  it('returns a failure message when the gateway endpoint rejects the save', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ success: false, error: 'gateway offline' }),
    } as any);
    renderProvider();
    act(() => {
      (captured as AttendanceContextType).setUserRole('super_admin');
    });
    const value = captured as AttendanceContextType;
    const result = await value.updateMessagingGateway({ whatsappPhoneNumber: '1' });
    expect(result.success).toBe(false);
    expect(result.message).toBe('gateway offline');
  });

  const provisionInput = (overrides: Record<string, unknown> = {}) => ({
    id: 'school-new',
    nameAr: 'مدرسة تجريبية',
    nameEn: 'Test School',
    code: 'TST-001',
    cityAr: 'الرياض',
    cityEn: 'Riyadh',
    subdomain: 'test-new',
    schoolType: 'boys' as const,
    academicYear: '1447',
    primaryColor: '#059669',
    logoText: 'ت',
    principalName: 'Principal One',
    principalEmail: 'principal@test.edu',
    ...overrides,
  });

  it('rejects provisioning with a duplicate school identifier', async () => {
    renderProvider();
    act(() => {
      (captured as AttendanceContextType).setUserRole('super_admin');
    });
    const value = captured as AttendanceContextType;
    const existingId = value.tenants[0].id;
    const result = await value.provisionNewSchool(provisionInput({ id: existingId }) as any);
    expect(result.success).toBe(false);
    expect(result.message).toContain('مسجل');
    expect(authenticatedFetch).not.toHaveBeenCalled();
  });

  it('provisions a school, stores profile/settings and returns the principal password', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ success: true, principal: { temporaryPassword: 'Temp-123' } }),
    } as any);
    renderProvider();
    act(() => {
      (captured as AttendanceContextType).setUserRole('super_admin');
    });
    const value = captured as AttendanceContextType;
    const auditBefore = value.auditLogs.length;
    let result: Awaited<ReturnType<typeof value.provisionNewSchool>>;
    await act(async () => {
      result = await value.provisionNewSchool(provisionInput() as any);
    });
    expect(result!.success).toBe(true);
    expect(result!.temporaryPassword).toBe('Temp-123');
    expect(result!.principalEmail).toBe('principal@test.edu');
    expect(result!.message).toContain('Temp-123');
    const after = captured as AttendanceContextType;
    expect(after.tenants.some((t) => t.id === 'school-new')).toBe(true);
    expect(after.auditLogs.length).toBe(auditBefore + 1);
    expect(authenticatedFetch).toHaveBeenCalledWith('/api/tenants/provision', expect.objectContaining({ method: 'POST' }));
  });

  it('reports server rejection during provisioning', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ success: false, error: 'forbidden' }),
    } as any);
    renderProvider();
    act(() => {
      (captured as AttendanceContextType).setUserRole('super_admin');
    });
    const value = captured as AttendanceContextType;
    const result = await value.provisionNewSchool(provisionInput() as any);
    expect(result.success).toBe(false);
    expect(result.message).toBe('forbidden');
  });

  it('warns when the provisioning request cannot reach the server', async () => {
    vi.mocked(authenticatedFetch).mockRejectedValueOnce(new Error('offline'));
    renderProvider();
    act(() => {
      (captured as AttendanceContextType).setUserRole('super_admin');
    });
    const value = captured as AttendanceContextType;
    const result = await value.provisionNewSchool(provisionInput() as any);
    expect(result.success).toBe(true);
    expect(result.temporaryPassword).toBeUndefined();
    expect(result.message).toContain('تنبيه');
  });

  it('signs in with email credentials and returns the resolved profile', async () => {
    vi.mocked(signInWithEmailAndPassword).mockResolvedValueOnce({
      user: { uid: 'uid-42', email: 'teacher@school.edu', displayName: 'Teacher One', phoneNumber: null },
    } as any);
    vi.mocked(getDoc)
      .mockResolvedValueOnce({ exists: () => false } as any)
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          tenantId: 'school-1',
          role: 'teacher',
          status: 'active',
          name: 'Teacher One',
        }),
      } as any);
    renderProvider();
    const value = captured as AttendanceContextType;
    const result = await value.signInWithCredentials(' Teacher@School.edu ', 'secret');
    expect(result.success).toBe(true);
    expect(result.isFirebase).toBe(true);
    expect(result.user?.email).toBe('teacher@school.edu');
    expect(result.user?.id).toBe('uid-42');
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'teacher@school.edu', 'secret');
  });

  it('maps a wrong-password error to a friendly message', async () => {
    vi.mocked(signInWithEmailAndPassword).mockRejectedValueOnce({ code: 'auth/wrong-password' } as any);
    renderProvider();
    const value = captured as AttendanceContextType;
    const result = await value.signInWithCredentials('teacher@school.edu', 'bad');
    expect(result.success).toBe(false);
    expect(result.error).toContain('كلمة المرور غير صحيحة');
  });

  it('falls back to redirect when the Google popup is blocked', async () => {
    vi.mocked(signInWithPopup).mockRejectedValueOnce({ code: 'auth/popup-blocked' } as any);
    renderProvider();
    const value = captured as AttendanceContextType;
    const result = await value.signInWithGoogle(false);
    expect(result).toBeUndefined();
    expect(signInWithRedirect).toHaveBeenCalled();
  });

  it('returns the Google popup credential on success and signs out through firebase', async () => {
    const credential = { user: { uid: 'g-1' } };
    vi.mocked(signInWithPopup).mockResolvedValueOnce(credential as any);
    renderProvider();
    const value = captured as AttendanceContextType;
    await expect(value.signInWithGoogle()).resolves.toBe(credential);
    await value.signOutGoogle();
    expect(signOut).toHaveBeenCalled();
  });

  it('records behaviour incidents with tenant scope and an audit trail', async () => {
    authState.user = { uid: 'admin-uid', email: 'admin@school.test' };
    renderProvider();
    act(() => {
      (captured as AttendanceContextType).setUserRole('admin');
    });
    const value = captured as AttendanceContextType;
    const student = await seedStudent(value);
    const auditBefore = (captured as AttendanceContextType).auditLogs.length;
    let incident: any;
    act(() => {
      incident = (captured as AttendanceContextType).addBehaviourIncident({
        studentId: student.id,
        studentName: student.fullName,
        type: 'violation',
        title: 'Late to class',
        description: 'Arrived 15 minutes late',
        date: '2026-10-01',
        reportedBy: 'Teacher',
        severity: 'low',
        actionTaken: 'Verbal warning',
      } as any);
    });
    expect(incident.tenantId).toBe('school-1');
    expect(incident.id).toMatch(/^beh-/);
    const after = captured as AttendanceContextType;
    expect(after.behaviourIncidents.some((b) => b.id === incident.id)).toBe(true);
    expect(after.auditLogs.length).toBe(auditBefore + 1);
  });

  it('hides behaviour incidents from parents of unrelated students', async () => {
    authState.user = { uid: 'admin-uid', email: 'admin@school.test' };
    renderProvider();
    const value = captured as AttendanceContextType;
    const student = await seedStudent(value);
    act(() => {
      value.addBehaviourIncident({
        studentId: student.id,
        studentName: student.fullName,
        type: 'positive',
        title: 'Helped a peer',
        description: '',
        date: '2026-10-01',
        reportedBy: 'Teacher',
        severity: 'low',
        actionTaken: '',
      } as any);
    });
    act(() => {
      (captured as AttendanceContextType).setUserRole('parent');
    });
    expect((captured as AttendanceContextType).behaviourIncidents).toHaveLength(0);
  });
});
