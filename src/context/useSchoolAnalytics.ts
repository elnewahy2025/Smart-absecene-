import { useMemo } from 'react';
import type {
  AttendanceSession,
  SchoolClassSummary,
  SchoolEnrollmentStats,
  Student,
  UserProfile,
} from '../types/attendance';
import {
  computeStudentMetricsFromSessions,
  meanOrNull,
  rateOrNull,
} from '../utils/attendanceMath';

interface SchoolAnalyticsDeps {
  allStudents: Student[];
  allUsers: UserProfile[];
  allSessions?: AttendanceSession[];
  tenantId: string;
  configuredClasses?: { id?: string; name: string; grade?: string }[];
}

/** Dynamic school & class analytics for the current tenant. */
export function useSchoolAnalytics({
  allStudents,
  allUsers,
  allSessions = [],
  tenantId,
  configuredClasses,
}: SchoolAnalyticsDeps) {
  const derivedMetricsByStudent = useMemo(() => {
    const tenantSessions = allSessions.filter((s) => s.tenantId === tenantId);
    return computeStudentMetricsFromSessions(tenantSessions);
  }, [allSessions, tenantId]);

  const effectiveTenantStudents = useMemo(() => {
    return allStudents
      .filter((s) => s.tenantId === tenantId)
      .map((s) => {
        const metrics = derivedMetricsByStudent.get(s.id);
        return metrics ? { ...s, ...metrics } : s;
      });
  }, [allStudents, tenantId, derivedMetricsByStudent]);

  const classesStats: SchoolClassSummary[] = useMemo(() => {
    const tenantTeachers = allUsers.filter((u) => u.tenantId === tenantId && u.role === 'teacher');
    const classMap = new Map<string, Student[]>();

    effectiveTenantStudents.forEach((student) => {
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
      const classId = cfgClass?.id || stList.find((student) => student.classId?.trim())?.classId || '';

      const mean = meanOrNull(activeStudentsList.map((s) => rateOrNull(s.attendanceRate)));
      const avgRate = mean !== null ? Math.round(mean) : 0;

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
  }, [effectiveTenantStudents, allUsers, tenantId, configuredClasses]);

  const schoolEnrollmentStats: SchoolEnrollmentStats = useMemo(() => {
    const active = effectiveTenantStudents.filter((s) => s.enrollmentStatus !== 'transferred');
    const transferred = effectiveTenantStudents.filter((s) => s.enrollmentStatus === 'transferred');
    const uniqueClasses = new Set(active.map((s) => s.className)).size;
    const avgSize = uniqueClasses > 0 ? Math.round(active.length / uniqueClasses) : 0;
    const mean = meanOrNull(active.map((s) => rateOrNull(s.attendanceRate)));
    const avgRate = mean !== null ? Math.round(mean) : 0;

    return {
      totalStudentsCount: effectiveTenantStudents.length,
      activeStudentsCount: active.length,
      transferredStudentsCount: transferred.length,
      totalClassesCount: uniqueClasses,
      averageClassSize: avgSize,
      schoolAttendanceRate: avgRate,
    };
  }, [effectiveTenantStudents]);

  return { classesStats, schoolEnrollmentStats };
}
