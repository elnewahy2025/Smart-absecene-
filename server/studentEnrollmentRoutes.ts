import crypto from 'node:crypto';
import admin from 'firebase-admin';
import type { Express, Request, RequestHandler, Response } from 'express';
import type { TenantSubscription } from '../src/config/subscription';
import type { AuthenticatedUser } from './types';
import {
  isActiveStudentRecord,
  normalizeStudentCreateInput,
} from '../src/utils/studentEnrollment';
import type { StudentCreateFields } from '../src/utils/studentEnrollment';
import {
  ensureStudentUsageDocument,
  reserveStudentSeats,
  StudentSeatLimitError,
  STUDENT_SEAT_LIMIT_CODE,
} from '../src/utils/tenantStudentSeats';

interface StudentEnrollmentRouteDeps {
  app: Express;
  isFirebaseAdminReady: () => boolean;
  requireRole: (allowedRoles: string[]) => RequestHandler;
  resolveTargetTenantId: (req: Request) => string;
  tenantIdPattern: RegExp;
  isPlatformOwner: (user: AuthenticatedUser | undefined) => boolean;
  loadTenantSubscription: (tenantId: string) => Promise<TenantSubscription>;
  stripUndefinedDeep: <T>(value: T) => T;
  sanitizeText: (value: unknown, fallback?: string) => string;
}

export function registerStudentEnrollmentRoutes({
  app,
  isFirebaseAdminReady,
  requireRole,
  resolveTargetTenantId,
  tenantIdPattern,
  isPlatformOwner,
  loadTenantSubscription,
  stripUndefinedDeep,
  sanitizeText,
}: StudentEnrollmentRouteDeps) {
  const MAX_STUDENTS_PER_IMPORT = 1000;
  const STUDENT_IMPORT_CHUNK_SIZE = 450;

  class DuplicateStudentError extends Error {
    readonly code = 'DUPLICATE_STUDENT';
    readonly statusCode = 409;

    constructor() {
      super('A student with the same national ID or student number already exists in this school.');
      this.name = 'DuplicateStudentError';
    }
  }

  class StudentNotFoundError extends Error {
    readonly code = 'STUDENT_NOT_FOUND';
    readonly statusCode = 404;

    constructor() {
      super('The student record was not found.');
      this.name = 'StudentNotFoundError';
    }
  }

  const readStudentSeatCount = (value: unknown): number =>
    typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;

  const isValidStudentDocumentId = (value: string): boolean =>
    Boolean(value) && value.length <= 200 && !value.includes('/');

  const buildStudentRecord = (
    value: StudentCreateFields,
    studentId: string,
    tenantId: string,
    actorUid: string,
    now: string
  ): Record<string, unknown> =>
    stripUndefinedDeep({
      ...value,
      id: studentId,
      tenantId,
      totalAbsences: 0,
      totalLates: 0,
      attendanceRate: 100,
      createdAt: now,
      createdBy: actorUid,
    });

  const handleStudentRouteError = (
    res: Response,
    err: unknown,
    label: string,
    fallback: string
  ) => {
    const errorObj = err as { code?: string; message?: string };
    console.error(`[${label}]`, errorObj?.message || String(err));
    if (errorObj?.code === STUDENT_SEAT_LIMIT_CODE) {
      return res.status(403).json({ success: false, error: errorObj.message, code: STUDENT_SEAT_LIMIT_CODE });
    }
    if (errorObj?.code === 'DUPLICATE_STUDENT') {
      return res.status(409).json({ success: false, error: errorObj.message, code: 'DUPLICATE_STUDENT' });
    }
    if (errorObj?.code === 'STUDENT_NOT_FOUND') {
      return res.status(404).json({ success: false, error: errorObj.message, code: 'STUDENT_NOT_FOUND' });
    }
    return res.status(500).json({ success: false, error: fallback });
  };

  // Body: { student fields, tenantId? }
  app.post('/api/students', requireRole(['admin', 'registrar']), async (req, res) => {
    try {
      if (!isFirebaseAdminReady()) {
        return res.status(503).json({ success: false, error: 'Firestore is not configured on this server.' });
      }

      const actor = req.user;
      if (!actor) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      const tenantId = resolveTargetTenantId(req);
      if (!tenantIdPattern.test(tenantId)) {
        return res.status(400).json({ success: false, error: 'A valid tenantId is required.' });
      }

      const normalized = normalizeStudentCreateInput(req.body);
      if (!normalized.ok) {
        return res.status(400).json({ success: false, error: normalized.error, code: 'INVALID_STUDENT' });
      }

      const subscription = await loadTenantSubscription(tenantId);
      const configuredMaxStudents = subscription.limits?.maxStudents;
      const studentLimit =
        typeof configuredMaxStudents === 'number' && configuredMaxStudents > 0
          ? Math.floor(configuredMaxStudents)
          : 0;

      const db = admin.firestore();
      const studentId = `std-${crypto.randomUUID()}`;
      const studentRef = db.doc(`students/${studentId}`);
      const usageRef = db.doc(`tenant_usage/${tenantId}`);

      await ensureStudentUsageDocument(db, tenantId);

      const student = await db.runTransaction(async (transaction) => {
        const usage = await transaction.get(usageRef);

        const nationalId = normalized.value.nationalId;
        const studentNumber = normalized.value.studentNumber;
        const nationalIdMatches = await transaction.get(
          db
            .collection('students')
            .where('tenantId', '==', tenantId)
            .where('nationalId', '==', nationalId)
            .limit(1)
        );
        const studentNumberMatches = await transaction.get(
          db
            .collection('students')
            .where('tenantId', '==', tenantId)
            .where('studentNumber', '==', studentNumber)
            .limit(1)
        );
        const duplicate = !nationalIdMatches.empty || !studentNumberMatches.empty;
        if (duplicate) throw new DuplicateStudentError();

        const current = readStudentSeatCount(usage.data()?.studentCount);
        if (studentLimit > 0 && current >= studentLimit) {
          throw new StudentSeatLimitError(studentLimit, 1, current);
        }

        const now = new Date().toISOString();
        const record = buildStudentRecord(normalized.value, studentId, tenantId, actor.uid, now);
        transaction.set(studentRef, record);
        transaction.set(
          usageRef,
          { studentCount: current + 1, updatedAt: now },
          { merge: true }
        );
        return record;
      });

      return res.status(201).json({ success: true, student });
    } catch (err: any) {
      return handleStudentRouteError(res, err, 'STUDENTS-CREATE-ERROR', 'Could not create the student record.');
    }
  });

  // Body: { students: [...], tenantId? }
  app.post('/api/students/import', requireRole(['admin', 'registrar']), async (req, res) => {
    try {
      if (!isFirebaseAdminReady()) {
        return res.status(503).json({ success: false, error: 'Firestore is not configured on this server.' });
      }

      const actor = req.user;
      if (!actor) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      const tenantId = resolveTargetTenantId(req);
      if (!tenantIdPattern.test(tenantId)) {
        return res.status(400).json({ success: false, error: 'A valid tenantId is required.' });
      }

      const rawStudents = Array.isArray(req.body?.students) ? req.body.students : null;
      if (!rawStudents || rawStudents.length === 0) {
        return res.status(400).json({ success: false, error: 'students must be a non-empty array.' });
      }
      if (rawStudents.length > MAX_STUDENTS_PER_IMPORT) {
        return res.status(400).json({
          success: false,
          error: `A single import cannot exceed ${MAX_STUDENTS_PER_IMPORT} students.`,
        });
      }

      const normalizedStudents: StudentCreateFields[] = [];
      for (let index = 0; index < rawStudents.length; index += 1) {
        const normalized = normalizeStudentCreateInput(rawStudents[index]);
        if (!normalized.ok) {
          return res.status(400).json({
            success: false,
            error: `students[${index}]: ${normalized.error}`,
            code: 'INVALID_STUDENT',
          });
        }
        normalizedStudents.push(normalized.value);
      }

      const db = admin.firestore();
      const existingSnapshot = await db.collection('students').where('tenantId', '==', tenantId).get();
      const existingNationalIds = new Set<string>();
      const existingStudentNumbers = new Set<string>();
      existingSnapshot.forEach((doc) => {
        const data = doc.data();
        if (typeof data.nationalId === 'string' && data.nationalId) existingNationalIds.add(data.nationalId);
        if (typeof data.studentNumber === 'string' && data.studentNumber) existingStudentNumbers.add(data.studentNumber);
      });

      const additions: StudentCreateFields[] = [];
      let duplicates = 0;
      for (const value of normalizedStudents) {
        if (existingNationalIds.has(value.nationalId) || existingStudentNumbers.has(value.studentNumber)) {
          duplicates += 1;
          continue;
        }
        existingNationalIds.add(value.nationalId);
        existingStudentNumbers.add(value.studentNumber);
        additions.push(value);
      }

      if (additions.length === 0) {
        return res.json({ success: true, imported: 0, duplicates, students: [] });
      }

      const subscription = await loadTenantSubscription(tenantId);
      const configuredMaxStudents = subscription.limits?.maxStudents;
      const studentLimit =
        typeof configuredMaxStudents === 'number' && configuredMaxStudents > 0
          ? Math.floor(configuredMaxStudents)
          : 0;

      const releaseSeats = await reserveStudentSeats(db, tenantId, studentLimit, additions.length);

      const now = new Date().toISOString();
      const created: Record<string, unknown>[] = [];
      try {
        for (let offset = 0; offset < additions.length; offset += STUDENT_IMPORT_CHUNK_SIZE) {
          const batch = db.batch();
          for (const value of additions.slice(offset, offset + STUDENT_IMPORT_CHUNK_SIZE)) {
            const studentId = `std-${crypto.randomUUID()}`;
            const record = buildStudentRecord(value, studentId, tenantId, actor.uid, now);
            batch.set(db.doc(`students/${studentId}`), record);
            created.push(record);
          }
          await batch.commit();
        }
      } catch (writeError) {
        for (let offset = 0; offset < created.length; offset += STUDENT_IMPORT_CHUNK_SIZE) {
          const cleanup = db.batch();
          for (const record of created.slice(offset, offset + STUDENT_IMPORT_CHUNK_SIZE)) {
            cleanup.delete(db.doc(`students/${record.id}`));
          }
          await cleanup.commit().catch((cleanupError: unknown) => {
            const msg = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
            console.warn('[STUDENTS-IMPORT-ROLLBACK]', msg);
          });
        }
        if (releaseSeats) await releaseSeats().catch(() => {});
        throw writeError;
      }

      return res.status(201).json({
        success: true,
        imported: created.length,
        duplicates,
        students: created,
      });
    } catch (err: unknown) {
      return handleStudentRouteError(res, err, 'STUDENTS-IMPORT-ERROR', 'Could not import the student records.');
    }
  });

  app.delete('/api/students/:id', requireRole(['admin']), async (req, res) => {
    try {
      if (!isFirebaseAdminReady()) {
        return res.status(503).json({ success: false, error: 'Firestore is not configured on this server.' });
      }

      const actor = req.user;
      if (!actor) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      const studentId = String(req.params.id || '');
      if (!isValidStudentDocumentId(studentId)) {
        return res.status(400).json({ success: false, error: 'A valid student id is required.' });
      }

      const db = admin.firestore();
      const studentRef = db.doc(`students/${studentId}`);
      const snapshot = await studentRef.get();
      if (!snapshot.exists) throw new StudentNotFoundError();

      const existing = snapshot.data() || {};
      const tenantId = typeof existing.tenantId === 'string' ? existing.tenantId : '';
      if (!tenantId) throw new StudentNotFoundError();
      if (!isPlatformOwner(actor) && tenantId !== actor.tenantId) {
        return res.status(403).json({ success: false, error: 'Forbidden: the student belongs to another school.' });
      }

      await ensureStudentUsageDocument(db, tenantId);

      await db.runTransaction(async (transaction) => {
        const currentStudent = await transaction.get(studentRef);
        if (!currentStudent.exists) throw new StudentNotFoundError();
        const currentData = currentStudent.data() || {};
        if (currentData.tenantId !== tenantId) throw new StudentNotFoundError();

        const usageRef = db.doc(`tenant_usage/${tenantId}`);
        const usage = await transaction.get(usageRef);
        transaction.delete(studentRef);

        if (isActiveStudentRecord(currentData) && usage.exists) {
          const current = readStudentSeatCount(usage.data()?.studentCount);
          transaction.set(
            usageRef,
            { studentCount: Math.max(0, current - 1), updatedAt: new Date().toISOString() },
            { merge: true }
          );
        }
      });

      return res.json({ success: true, studentId });
    } catch (err: unknown) {
      return handleStudentRouteError(res, err, 'STUDENTS-DELETE-ERROR', 'Could not delete the student record.');
    }
  });

  // Body: { destinationSchool, reason?, tenantId? }
  app.post('/api/students/:id/transfer', requireRole(['admin', 'registrar']), async (req, res) => {
    try {
      if (!isFirebaseAdminReady()) {
        return res.status(503).json({ success: false, error: 'Firestore is not configured on this server.' });
      }

      const actor = req.user;
      if (!actor) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      const studentId = String(req.params.id || '');
      if (!isValidStudentDocumentId(studentId)) {
        return res.status(400).json({ success: false, error: 'A valid student id is required.' });
      }

      const destinationSchool = sanitizeText(req.body?.destinationSchool, '').slice(0, 120);
      if (!destinationSchool) {
        return res.status(400).json({ success: false, error: 'destinationSchool is required.' });
      }
      const reason = sanitizeText(req.body?.reason, '').slice(0, 500) || 'Official transfer to another school';

      const db = admin.firestore();
      const studentRef = db.doc(`students/${studentId}`);
      const snapshot = await studentRef.get();
      if (!snapshot.exists) throw new StudentNotFoundError();

      const existing = snapshot.data() || {};
      const tenantId = typeof existing.tenantId === 'string' ? existing.tenantId : '';
      if (!tenantId) throw new StudentNotFoundError();
      if (!isPlatformOwner(actor) && tenantId !== actor.tenantId) {
        return res.status(403).json({ success: false, error: 'Forbidden: the student belongs to another school.' });
      }
      if (existing.enrollmentStatus === 'transferred') {
        return res.json({ success: true, student: existing });
      }

      await ensureStudentUsageDocument(db, tenantId);
      const usageRef = db.doc(`tenant_usage/${tenantId}`);
      const now = new Date().toISOString();
      const updates = {
        enrollmentStatus: 'transferred',
        transferredAt: now,
        destinationSchool,
        transferReason: reason,
        updatedAt: now,
      };

      const student = await db.runTransaction(async (transaction) => {
        const currentStudent = await transaction.get(studentRef);
        if (!currentStudent.exists) throw new StudentNotFoundError();
        const currentData = currentStudent.data() || {};
        if (currentData.tenantId !== tenantId) throw new StudentNotFoundError();
        if (currentData.enrollmentStatus === 'transferred') return currentData;

        const usage = await transaction.get(usageRef);
        transaction.update(studentRef, updates);

        if (isActiveStudentRecord(currentData) && usage.exists) {
          const current = readStudentSeatCount(usage.data()?.studentCount);
          transaction.set(
            usageRef,
            { studentCount: Math.max(0, current - 1), updatedAt: now },
            { merge: true }
          );
        }
        return stripUndefinedDeep({ ...currentData, ...updates });
      });

      return res.json({ success: true, student });
    } catch (err: unknown) {
      return handleStudentRouteError(res, err, 'STUDENTS-TRANSFER-ERROR', 'Could not transfer the student record.');
    }
  });

  app.post('/api/students/:id/restore', requireRole(['admin', 'registrar']), async (req, res) => {
    try {
      if (!isFirebaseAdminReady()) {
        return res.status(503).json({ success: false, error: 'Firestore is not configured on this server.' });
      }

      const actor = req.user;
      if (!actor) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      const studentId = String(req.params.id || '');
      if (!isValidStudentDocumentId(studentId)) {
        return res.status(400).json({ success: false, error: 'A valid student id is required.' });
      }

      const db = admin.firestore();
      const studentRef = db.doc(`students/${studentId}`);
      const snapshot = await studentRef.get();
      if (!snapshot.exists) throw new StudentNotFoundError();

      const existing = snapshot.data() || {};
      const tenantId = typeof existing.tenantId === 'string' ? existing.tenantId : '';
      if (!tenantId) throw new StudentNotFoundError();
      if (!isPlatformOwner(actor) && tenantId !== actor.tenantId) {
        return res.status(403).json({ success: false, error: 'Forbidden: the student belongs to another school.' });
      }
      if (isActiveStudentRecord(existing)) {
        return res.json({ success: true, student: existing });
      }

      const subscription = await loadTenantSubscription(tenantId);
      const configuredMaxStudents = subscription.limits?.maxStudents;
      const studentLimit =
        typeof configuredMaxStudents === 'number' && configuredMaxStudents > 0
          ? Math.floor(configuredMaxStudents)
          : 0;

      await ensureStudentUsageDocument(db, tenantId);
      const usageRef = db.doc(`tenant_usage/${tenantId}`);
      const now = new Date().toISOString();

      const student = await db.runTransaction(async (transaction) => {
        const currentStudent = await transaction.get(studentRef);
        if (!currentStudent.exists) throw new StudentNotFoundError();
        const currentData = currentStudent.data() || {};
        if (currentData.tenantId !== tenantId) throw new StudentNotFoundError();
        if (isActiveStudentRecord(currentData)) return currentData;

        const usage = await transaction.get(usageRef);
        if (!usage.exists) {
          throw new Error('The tenant student-usage document disappeared during restoration.');
        }
        const current = readStudentSeatCount(usage.data()?.studentCount);
        if (studentLimit > 0 && current >= studentLimit) {
          throw new StudentSeatLimitError(studentLimit, 1, current);
        }

        transaction.update(studentRef, {
          enrollmentStatus: 'active',
          transferredAt: admin.firestore.FieldValue.delete(),
          destinationSchool: admin.firestore.FieldValue.delete(),
          transferReason: admin.firestore.FieldValue.delete(),
          updatedAt: now,
        });
        transaction.set(
          usageRef,
          { studentCount: current + 1, updatedAt: now },
          { merge: true }
        );

        const rest: Record<string, unknown> = { ...currentData };
        delete rest.transferredAt;
        delete rest.destinationSchool;
        delete rest.transferReason;
        return stripUndefinedDeep({ ...rest, enrollmentStatus: 'active', updatedAt: now });
      });

      return res.json({ success: true, student });
    } catch (err: unknown) {
      return handleStudentRouteError(res, err, 'STUDENTS-RESTORE-ERROR', 'Could not restore the student record.');
    }
  });
}
