import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('UI Visual Cleanliness, Identity & On-Demand Logic Audit', () => {
  const readComponent = (relativePath: string) => {
    const fullPath = path.resolve(__dirname, '..', relativePath);
    return fs.readFileSync(fullPath, 'utf-8');
  };

  it('Verifies ExecutiveMorningBriefingCard runs ONLY on-demand and NOT automatically in useEffect', () => {
    const code = readComponent('components/dashboard/ExecutiveMorningBriefingCard.tsx');

    // Initial loading state must be false
    expect(code).toContain('const [loading, setLoading] = useState<boolean>(false);');
    // Must track on-demand user click trigger
    expect(code).toContain('const [hasRequested, setHasRequested] = useState<boolean>(false);');

    // Must NOT have automatic eager useEffect calling loadDigest
    expect(code).not.toContain('useEffect(() => {\n    loadDigest();');
    expect(code).not.toContain('useEffect(() => {\r\n    loadDigest();');

    // Must have on-demand action trigger button
    expect(code).toContain('بدء التحليل الاستباقي (عند الطلب)');

    // Must NOT have explanatory descriptive filler paragraph
    expect(code).not.toContain('تحليل لحظي يسبق الطابور الصباحي لاكتشاف شذوذ الحضور');
  });

  it('Verifies User Name is NEVER repeated on page canvas outside HeaderNav', () => {
    const dashboardCode = readComponent('components/ExecutiveDashboardView.tsx');
    const parentPortalCode = readComponent('components/ParentPortalView.tsx');

    // Executive Dashboard hero header must NOT contain greeting with user name
    expect(dashboardCode).not.toContain('مرحباً بك، ${currentUser?.name');
    expect(dashboardCode).not.toContain('مرحباً بك، أ.');

    // Parent Portal header must NOT contain greeting with parent name
    expect(parentPortalCode).not.toContain('مرحباً، ${currentUser.name}');
    expect(parentPortalCode).not.toContain('Welcome, ${currentUser.name}');
  });

  it('Verifies School Name is NOT repeated across page canvas (Header & Sidebar are enough)', () => {
    const dashboardCode = readComponent('components/ExecutiveDashboardView.tsx');
    const commsCode = readComponent('components/communications/CommunicationsView.tsx');
    const studentMgmtCode = readComponent('components/StudentManagementView.tsx');
    const weeklyTrendCode = readComponent('components/WeeklyAttendanceTrendCard.tsx');
    const auditSettingsCode = readComponent('components/AuditSettingsView.tsx');

    // Dashboard hero header should not repeat school name
    expect(dashboardCode).not.toContain('${schoolProfile?.schoolName || currentTenant?.name');

    // Communications hub header should not repeat school name badge
    expect(commsCode).not.toContain('{schoolProfile?.schoolName || currentTenant.name}');

    // Student registry subheader should not prepend school name
    expect(studentMgmtCode).not.toContain('{currentTenant.name} · {schoolEnrollmentStats.activeStudentsCount}');

    // Weekly attendance trend subheader should not prepend school name
    expect(weeklyTrendCode).not.toContain('{currentTenant.name} · {lang === \'ar\' ? `الأسبوع:');

    // Settings group headers should not prepend school name
    expect(auditSettingsCode).not.toContain('{formProfile.schoolName} ({formProfile.schoolCode}) · ترتبط كافة التقارير');
  });

  it('Verifies removal of explanatory filler text paragraphs that cause visual clutter', () => {
    const dashboardCode = readComponent('components/ExecutiveDashboardView.tsx');
    const reportsCode = readComponent('components/ReportsView.tsx');
    const inquiryCode = readComponent('components/StudentAbsenceInquiryView.tsx');

    // Dashboard charts filler descriptions
    expect(dashboardCode).not.toContain('المتابعة الميدانية اللحظية لانضباط الحضور');
    expect(dashboardCode).not.toContain('توزيع حالات الغياب بين الأعذار الطبية والأسرية');
    expect(dashboardCode).not.toContain('متوسط معدل الغياب لكل صف ومرحلة دراسية لاكتشاف');
    expect(dashboardCode).not.toContain('رصد ذروة الغياب قبل وبعد الإجازة الأسبوعية');
    expect(dashboardCode).not.toContain('ترتيب الفصول تصاعدياً وفق أعلى معدل غياب');

    // Reports center filler paragraph
    expect(reportsCode).not.toContain('أداة مخصصة لمديري المدارس ومسؤولي شؤون الطلبة لاستخراج كشوف الحضور كوثيقة PDF');

    // Student inquiry filler paragraph
    expect(inquiryCode).not.toContain('احصاء فوري ودقيق لمرات الغياب والتأخر والمخالفات السلوكية');

    // Absence Heatmap filler description
    const heatmapCode = readComponent('components/reports/AbsenceHeatmapCard.tsx');
    expect(heatmapCode).not.toContain('توزيع تكرار الغياب خلال أيام الأسبوع والحصص الدراسية');
  });

  it('Verifies AbsenceHeatmapCard table layout eliminates gap between day and periods', () => {
    const heatmapCode = readComponent('components/reports/AbsenceHeatmapCard.tsx');

    // Must use table-fixed to evenly distribute periods without void gaps
    expect(heatmapCode).toContain('table-fixed');
    // Day column must be tightly bounded
    expect(heatmapCode).toContain('w-24 sm:w-28');
    // Period headers must not have artificial narrow w-14 forcing gaps
    expect(heatmapCode).not.toContain('w-14 font-semibold');
  });
});
