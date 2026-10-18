import type { SchoolSettings } from '../types/attendance';
import { getDefaultSchoolProfile } from './tenantSettings';

/**
 * Neutral first-run settings. Real values come from the Settings page and are
 * persisted in Firestore; these defaults only prevent an empty form before the
 * first save. No phone numbers, sender IDs or API credentials here.
 */
export function getDefaultSchoolSettings(tenantId: string): SchoolSettings {
  const profile = getDefaultSchoolProfile(tenantId);

  return {
    attendanceMode: 'both',
    allowDraftSave: true,
    lateThresholdMinutes: 10,
    chronicAbsenceLimit: 5,
    sendSmsOnAbsent: true,
    sendSmsOnLate: false,
    requireExcuseAttachment: false,
    allowParentSubmissions: true,
    emergencyAssemblyPoints: [],
    preferredChannel: 'both',
    absenceMessageTemplate:
      'المكرم ولي أمر الطالب ({student_name}): نفيدكم بتسجيل غياب نجلكم عن ({subject}) بتاريخ {date}. يرجى تقديم العذر عبر الرابط المدرسي.',
    lateMessageTemplate:
      'المكرم ولي أمر الطالب ({student_name}): تم تسجيل تأخر نجلكم ({minutes} دقيقة) عن دوام اليوم بتاريخ {date}.',
    warningMessageTemplate:
      'إشعار رسمي: المكرم ولي أمر الطالب ({student_name})، نظراً لتجاوز أيام الغياب غير المبررة الحد المسموح، نأمل مراجعة إدارة المدرسة عاجلاً.',
    notifyOnExcuseApproved: true,
    weekendDays: profile.weekendDays || [5, 6],
    officialHolidays: profile.officialHolidays || [],
  };
}
