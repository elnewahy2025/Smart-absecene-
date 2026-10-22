import { useMemo } from 'react';
import type {
  SchoolClassSummary,
  SchoolEnrollmentStats,
  Student,
  UserProfile,
} from '../types/attendance';

interface SchoolAnalyticsDeps {
  allStudents: Student[];
  allUsers: UserProfile[];
  tenantId: string;
  configuredClasses?: { id?: string; name: string; grade?: string }[];
}

/** Dynamic school & class analytics for the current tenant. */
export function useSchoolAnalytics({
  allStudents,
  allUsers,
  tenantId,
  configuredClasses,
}: SchoolAnalyticsDeps) {
  const classesStats: SchoolClassSummary[] = useMemo(() => {
    const tenantStudents = allStudents.filter((s) => s.tenantId === tenantId);
    const tenantTeachers = allUsers.filter((u) => u.tenantId === tenantId && u.role === 'teacher');
    const classMap = new Map<string, Student[]>();

    tenantStudents.forEach((student) => {
      const cls = student.className?.trim() || 'غير محدد';
      if (!classMap.has(cls)) {
        classMap.set(cls, []);
      }
      classMap.get(cls)!.push(student);
    });

    // Also union any configured classes from schoolProfile that might not have students yet
    const configured = configuredClasses || [];
    configured.forEach((cfg) => {
      if (!classMap.has(cfg.name)) {
        classMap.set(cfg.name, []);
      }
    });

    return Array.from(classMap.entries()).map(([className, stList]) => {
      const activeStudentsList = stList.filter((s) => s.enrollmentStatus !== 'transferred');
      const transferredStudentsList = stList.filter((s) => s.enrollmentStatus === 'transferred');
      const cfgClass = configured.find((c) => c.name === className);
      const grade = cfgClass?.grade || stList[0]?.grade || 'المرحلة الدراسية';
      const classId = cfgClass?.id || stList[0]?.classId || `class-${className.replace(/[^a-zA-Z0-9]/g, '')}`;

      const avgRate = activeStudentsList.length > 0
        ? Math.round(activeStudentsList.reduce((acc, s) => acc + (s.attendanceRate || 100), 0) / activeStudentsList.length)
        : 100;

      const assignedTeachersCount = tenantTeachers.filter((t) =>
        t.assignedClasses && t.assignedClasses.includes(className)
      ).length;

      return {
        className,
        grade,
        classId,
        totalStudents: stList.length,
        activeStudents: activeStudentsList.length,
        transferredStudents: transferredStudentsList.length,
        attendanceRate: avgRate,
        assignedTeachersCount,
      };
    }).sort((a, b) => a.className.localeCompare(b.className, 'ar'));
  }, [allStudents, allUsers, tenantId, configuredClasses]);

  const schoolEnrollmentStats: SchoolEnrollmentStats = useMemo(() => {
    const tenantStudents = allStudents.filter((s) => s.tenantId === tenantId);
    const active = tenantStudents.filter((s) => s.enrollmentStatus !== 'transferred');
    const transferred = tenantStudents.filter((s) => s.enrollmentStatus === 'transferred');
    const uniqueClasses = new Set(active.map((s) => s.className)).size;
    const avgSize = uniqueClasses > 0 ? Math.round(active.length / uniqueClasses) : 0;
    const avgRate = active.length > 0
      ? Math.round(active.reduce((acc, s) => acc + (s.attendanceRate || 100), 0) / active.length)
      : 100;

    return {
      totalStudentsCount: tenantStudents.length,
      activeStudentsCount: active.length,
      transferredStudentsCount: transferred.length,
      totalClassesCount: uniqueClasses,
      averageClassSize: avgSize,
      schoolAttendanceRate: avgRate,
    };
  }, [allStudents, tenantId]);

  return { classesStats, schoolEnrollmentStats };
}
