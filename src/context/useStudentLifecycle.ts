import type { AuditLog, Student, UserProfile, UserRole } from '../types/attendance';
import { localCache } from '../utils/localCache';
import { authenticatedFetch } from '../lib/api';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { toFirestoreData } from './attendanceContextSupport';
import type { User as FirebaseUser } from 'firebase/auth';

interface UseStudentLifecycleParams {
  tenantId: string;
  firebaseUser: FirebaseUser | null;
  canImportStudents: boolean;
  students: Student[];
  allStudents: Student[];
  setAllStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  schoolClasses: { id: string; name: string; grade: string }[] | undefined;
  currentUser: UserProfile;
  currentUserRole: UserRole;
  addAuditLog: (entry: Omit<AuditLog, 'id' | 'tenantId' | 'timestamp'>) => void;
}

export function useStudentLifecycle({
  tenantId,
  firebaseUser,
  canImportStudents,
  students,
  allStudents,
  setAllStudents,
  schoolClasses,
  currentUser,
  currentUserRole,
  addAuditLog,
}: UseStudentLifecycleParams) {
  const persistStudentPatch = (studentId: string, updates: Partial<Student>) => {
    if (!firebaseUser) return;
    void setDoc(doc(db, 'students', studentId), toFirestoreData(updates), { merge: true }).catch((error) =>
      console.error('[STUDENTS] Could not update student:', error)
    );
  };

  const importStudents = async (newStudentsList: Partial<Student>[]): Promise<{ imported: number; duplicates: number }> => {
    if (!canImportStudents) {
      console.warn('Unauthorized: Student import requires administrator or registrar privileges.');
      return { imported: 0, duplicates: 0 };
    }
    if (!firebaseUser) {
      throw new Error('يجب تسجيل الدخول لاستيراد الطلاب.');
    }

    let duplicates = 0;
    const existingNatIds = new Set(students.map((s) => s.nationalId));
    const existingStdNums = new Set(students.map((s) => s.studentNumber));

    const approvedClasses = (schoolClasses || []).map((c) => ({
      name: c.name.trim(),
      normalized: c.name.replace(/\s+/g, '').toLowerCase(),
      grade: c.grade.trim(),
      id: c.id,
    }));

    const additions: Partial<Student>[] = [];

    newStudentsList.forEach((raw, i) => {
      const nationalId = raw.nationalId?.trim() || `1099${Date.now() + i}`;
      const studentNumber = raw.studentNumber?.trim() || `2026${Date.now() + i}`;

      if (existingNatIds.has(nationalId) || existingStdNums.has(studentNumber)) {
        duplicates++;
        return;
      }

      const rawClass = (raw.className || '').trim();
      const normalizedClass = rawClass.replace(/\s+/g, '').toLowerCase();
      const matchedClass = approvedClasses.find(
        (c) => c.normalized === normalizedClass || c.name === rawClass
      );

      // Enforce strict Settings compliance: reject students with classes not in Settings
      if (!matchedClass && approvedClasses.length > 0) {
        duplicates++;
        return;
      }

      existingNatIds.add(nationalId);
      existingStdNums.add(studentNumber);

      additions.push({
        studentNumber,
        nationalId,
        fullName: raw.fullName?.trim() || `طالب جديد ${i + 1}`,
        grade: matchedClass ? matchedClass.grade : (raw.grade?.trim() || 'الصف العاشر'),
        className: matchedClass ? matchedClass.name : (rawClass || '10 / أ'),
        classId: matchedClass ? matchedClass.id : (raw.classId?.trim() || 'class-1a'),
        guardianName: raw.guardianName?.trim() || 'ولي أمر معتمد',
        guardianPhone: raw.guardianPhone?.trim() || '',
        guardianRelationship: raw.guardianRelationship || '',
        bloodType: raw.bloodType || '',
      });
    });

    if (additions.length === 0) {
      return { imported: 0, duplicates };
    }

    const response = await authenticatedFetch('/api/students/import', {
      method: 'POST',
      body: JSON.stringify({ tenantId, students: additions }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error || 'تعذّر استيراد الطلاب على الخادم. تحقق من البيانات وحاول مجدداً.');
    }

    const createdStudents = (payload.students || []) as Student[];
    const importedCount = typeof payload.imported === 'number' ? payload.imported : createdStudents.length;
    const serverDuplicates = typeof payload.duplicates === 'number' ? payload.duplicates : 0;
    const totalDuplicates = duplicates + serverDuplicates;

    setAllStudents((prev) => {
      const updated = [...prev, ...createdStudents];
      if (typeof localCache !== 'undefined') {
        localCache.setItem('school_students', JSON.stringify(updated));
      }
      return updated;
    });

    addAuditLog({
      entityType: 'student',
      entityId: `bulk-import-${Date.now()}`,
      action: 'create',
      performerId: currentUser.id,
      performerName: currentUser.name,
      performerRole: currentUser.role,
      details: `استيراد معتمد لقائمة الطلاب: نجح استيراد ${importedCount} طالب جديد، وتم استبعاد ${totalDuplicates} سجل مكرر لمنع ازدواجية البيانات.`,
      detailsEn: `Approved student list import: ${importedCount} new students imported successfully, and ${totalDuplicates} duplicate records were excluded to prevent data duplication.`,
    });

    return { imported: importedCount, duplicates: totalDuplicates };
  };

  const addStudent = async (
    studentData: Omit<Student, 'id' | 'tenantId' | 'attendanceRate' | 'totalAbsences' | 'totalLates'>
  ): Promise<Student> => {
    if (!firebaseUser) {
      throw new Error('يجب تسجيل الدخول لإضافة طالب.');
    }

    const response = await authenticatedFetch('/api/students', {
      method: 'POST',
      body: JSON.stringify({ ...studentData, tenantId }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success || !payload.student) {
      throw new Error(payload?.error || 'تعذّر إضافة الطالب على الخادم. تحقق من البيانات وحاول مجدداً.');
    }

    const newStudent = payload.student as Student;
    setAllStudents((prev) => {
      const updated = [newStudent, ...prev];
      if (typeof localCache !== 'undefined') {
        localCache.setItem('school_students', JSON.stringify(updated));
      }
      return updated;
    });

    addAuditLog({
      action: 'create',
      entityType: 'student',
      entityId: newStudent.id,
      performerId: currentUser.id,
      performerRole: currentUserRole,
      performerName: currentUser.name,
      details: `إضافة قيد طالب جديد (${newStudent.fullName} - فصل ${newStudent.className}) بدون الحاجة لإعادة رفع القوائم.`,
      detailsEn: `Adding a new student record (${newStudent.fullName} - Class ${newStudent.className}) without needing to re-upload the lists.`,
    });

    return newStudent;
  };

  const updateStudent = (studentId: string, updates: Partial<Student>) => {
    const safeUpdates = { ...updates } as Record<string, unknown>;
    delete safeUpdates.id;
    delete safeUpdates.tenantId;
    delete safeUpdates.enrollmentStatus;
    delete safeUpdates.transferredAt;
    delete safeUpdates.destinationSchool;
    delete safeUpdates.transferReason;
    const nextUpdates = safeUpdates as Partial<Student>;

    persistStudentPatch(studentId, nextUpdates);
    setAllStudents((prev) => {
      const updated = prev.map((s) =>
        s.id === studentId && s.tenantId === tenantId ? { ...s, ...nextUpdates } : s
      );
      if (typeof localCache !== 'undefined') {
        localCache.setItem('school_students', JSON.stringify(updated));
      }
      return updated;
    });

    addAuditLog({
      action: 'update',
      entityType: 'student',
      entityId: studentId,
      performerId: currentUser.id,
      performerRole: currentUserRole,
      performerName: currentUser.name,
      details: `تحديث بيانات الطالب (${nextUpdates.fullName || studentId}) في السجل المدرسي`,
      detailsEn: `Updating student data (${nextUpdates.fullName || studentId}) in the school record`,
    });
  };

  const transferStudent = async (
    studentId: string,
    details: { destinationSchool: string; reason?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const target = allStudents.find((s) => s.id === studentId && s.tenantId === tenantId);
    if (!target) {
      return { success: false, message: 'الطالب غير موجود' };
    }
    if (!firebaseUser) {
      return { success: false, message: 'يجب تسجيل الدخول لنقل الطالب.' };
    }

    try {
      const response = await authenticatedFetch(
        `/api/students/${encodeURIComponent(studentId)}/transfer`,
        {
          method: 'POST',
          body: JSON.stringify({ ...details, tenantId }),
        }
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success || !payload.student) {
        return {
          success: false,
          message: payload?.error || 'تعذّر نقل الطالب على الخادم. حاول مجدداً.',
        };
      }

      const updatedStudent = payload.student as Student;
      setAllStudents((prev) => {
        const updated = prev.map((s) =>
          s.id === studentId && s.tenantId === tenantId ? { ...s, ...updatedStudent } : s
        );
        if (typeof localCache !== 'undefined') {
          localCache.setItem('school_students', JSON.stringify(updated));
        }
        return updated;
      });

      addAuditLog({
        action: 'update',
        entityType: 'student',
        entityId: studentId,
        performerId: currentUser.id,
        performerRole: currentUserRole,
        performerName: currentUser.name,
        details: `نقل رسمي للطالب (${target.fullName}) إلى (${details.destinationSchool}). تم إخفاء الطالب من كشوف الحضور اليومية مع حفظ بياناته في أرشيف النقل.`,
        detailsEn: `Official transfer of student (${target.fullName}) to (${details.destinationSchool}). The student was hidden from daily attendance sheets while their data was preserved in the transfer archive.`,
      });

      return { success: true, message: 'تم نقل الطالب بنجاح' };
    } catch (error) {
      console.error('[STUDENTS] Could not transfer student:', error);
      return { success: false, message: 'تعذّر الاتصال بالخادم لنقل الطالب. حاول مجدداً.' };
    }
  };

  const restoreStudent = async (studentId: string): Promise<{ success: boolean; message: string }> => {
    const target = allStudents.find((s) => s.id === studentId && s.tenantId === tenantId);
    if (!target) {
      return { success: false, message: 'الطالب غير موجود' };
    }
    if (!firebaseUser) {
      return { success: false, message: 'يجب تسجيل الدخول لاستعادة الطالب.' };
    }

    try {
      const response = await authenticatedFetch(
        `/api/students/${encodeURIComponent(studentId)}/restore`,
        {
          method: 'POST',
          body: JSON.stringify({ tenantId }),
        }
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success || !payload.student) {
        return {
          success: false,
          message: payload?.error || 'تعذّر استعادة الطالب. قد يكون الحد الأقصى لعدد الطلاب قد بلغ.',
        };
      }

      const restoredStudent = payload.student as Student;
      setAllStudents((prev) => {
        const updated = prev.map((s) =>
          s.id === studentId && s.tenantId === tenantId ? { ...s, ...restoredStudent } : s
        );
        if (typeof localCache !== 'undefined') {
          localCache.setItem('school_students', JSON.stringify(updated));
        }
        return updated;
      });

      addAuditLog({
        action: 'update',
        entityType: 'student',
        entityId: studentId,
        performerId: currentUser.id,
        performerRole: currentUserRole,
        performerName: currentUser.name,
        details: `إلغاء إجراء النقل واستعادة قيد الطالب (${target.fullName}) إلى مقاعد الدراسة النشطة.`,
        detailsEn: `Cancelling the transfer and restoring student (${target.fullName}) to active enrollment.`,
      });

      return { success: true, message: 'تم استعادة الطالب بنجاح' };
    } catch (error) {
      console.error('[STUDENTS] Could not restore student:', error);
      return { success: false, message: 'تعذّر الاتصال بالخادم لاستعادة الطالب. حاول مجدداً.' };
    }
  };

  const deleteStudent = async (studentId: string): Promise<{ success: boolean; message: string }> => {
    const target = allStudents.find((s) => s.id === studentId && s.tenantId === tenantId);
    if (!target) {
      return { success: false, message: 'الطالب غير موجود' };
    }
    if (!firebaseUser) {
      return { success: false, message: 'يجب تسجيل الدخول لحذف الطالب.' };
    }

    try {
      const response = await authenticatedFetch(
        `/api/students/${encodeURIComponent(studentId)}`,
        {
          method: 'DELETE',
          body: JSON.stringify({ tenantId }),
        }
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        return {
          success: false,
          message: payload?.error || 'تعذّر حذف سجل الطالب على الخادم. حاول مجدداً.',
        };
      }

      setAllStudents((prev) => {
        const updated = prev.filter((s) => s.id !== studentId);
        if (typeof localCache !== 'undefined') {
          localCache.setItem('school_students', JSON.stringify(updated));
        }
        return updated;
      });

      addAuditLog({
        action: 'delete',
        entityType: 'student',
        entityId: studentId,
        performerId: currentUser.id,
        performerRole: currentUserRole,
        performerName: currentUser.name,
        details: `حذف نهائي لسجل الطالب (${target.fullName} - سجل مدني ${target.nationalId}) من المدرسة.`,
        detailsEn: `Permanent deletion of the student record (${target.fullName} - Civil ID ${target.nationalId}) from the school.`,
      });

      return { success: true, message: 'تم حذف سجل الطالب نهائياً' };
    } catch (error) {
      console.error('[STUDENTS] Could not delete student:', error);
      return { success: false, message: 'تعذّر الاتصال بالخادم لحذف الطالب. حاول مجدداً.' };
    }
  };

  return { importStudents, addStudent, updateStudent, transferStudent, restoreStudent, deleteStudent };
}
