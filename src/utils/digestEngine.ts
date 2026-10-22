import {
  Student,
  AttendanceSession,
  Justification,
  DailyDigestAnomaly,
  DailyDigestHighRiskStudent,
  DailyDigestPendingExcuse,
  DailyEmailDigestItem,
  DailyEmailDigestConfig,
} from '../types/attendance';

export function computeDailyDigestData(params: {
  tenantId: string;
  tenantName: string;
  students: Student[];
  sessions: AttendanceSession[];
  justifications: Justification[];
  config: DailyEmailDigestConfig;
  dateStr?: string;
}): Omit<DailyEmailDigestItem, 'id' | 'dispatchedAt' | 'status' | 'geminiBriefing' | 'htmlContent'> {
  const { tenantId, students, sessions, justifications, config, dateStr } = params;
  const today = dateStr || new Date().toISOString().split('T')[0];

  // 1. Overall attendance rate
  const totalStudents = students.length;
  const overallAttendanceRate =
    totalStudents > 0
      ? parseFloat((students.reduce((acc, s) => acc + s.attendanceRate, 0) / totalStudents).toFixed(1))
      : 100.0;

  // 2. Detect Anomalies
  const anomalies: DailyDigestAnomaly[] = [];

  // Anomaly A: Unsubmitted Sessions from yesterday or past periods
  const unsubmittedSessions = sessions.filter(
    (s) => s.status === 'draft' || s.status === 'reopened'
  );
  if (unsubmittedSessions.length > 0) {
    anomalies.push({
      id: `anom-unsubmitted-${today}`,
      type: 'unsubmitted_session',
      severity: 'critical',
      titleAr: `كشوف حضور معلقة وغير معتمدة (${unsubmittedSessions.length} كشف)`,
      titleEn: 'Pending Unsubmitted Attendance Sessions',
      descriptionAr: `توجد ${unsubmittedSessions.length} كشوف حضور لا تزال بحالة "مسودة" أو "مُعاد فتحها" لم يتم اعتمادها رسمياً من المعلمين المعنيين، مما يعطل تدقيق الغياب الصباحي.`,
      metric: `${unsubmittedSessions.length} كشوف`,
      targetName: unsubmittedSessions.map((s) => `${s.className} (${s.subject || 'اليومي'})`).join('، '),
      suggestedActionAr: 'إلزام المعلمين المعنيين باعتماد الكشوف فوراً قبل بدء الحصة الأولى.',
    });
  }

  // Anomaly B: Class absence spikes
  const classStats: Record<string, { total: number; absent: number }> = {};
  students.forEach((s) => {
    if (!classStats[s.className]) classStats[s.className] = { total: 0, absent: 0 };
    classStats[s.className].total += 1;
    if (s.totalAbsences >= 3) {
      classStats[s.className].absent += 1;
    }
  });

  Object.entries(classStats).forEach(([className, stat]) => {
    const spikeRate = stat.total > 0 ? (stat.absent / stat.total) * 100 : 0;
    if (spikeRate >= (config.anomalySpikePercentage || 25)) {
      anomalies.push({
        id: `anom-spike-${className}`,
        type: 'class_spike',
        severity: spikeRate >= 40 ? 'critical' : 'warning',
        titleAr: `ارتفاع غير طبيعي في غياب الشعبة (${className})`,
        titleEn: `Abnormal Absence Spike in ${className}`,
        descriptionAr: `تجاوزت نسبة الطلاب متكرري الغياب في ${className} حاجز ${spikeRate.toFixed(0)}% (${stat.absent} من أصل ${stat.total} طالب)، وهو ما يتجاوز المعدل الطبيعي للمدرسة.`,
        metric: `${spikeRate.toFixed(0)}% غياب`,
        targetName: className,
        suggestedActionAr: 'تكليف رائد الفصل والموجه الطلابي ببحث الأسباب المشتركة لغياب هذه الشعبة.',
      });
    }
  });

  // Anomaly C: Consecutive Absences
  // Find students with consecutive recent absences (e.g. absent in 2 or more recent sessions)
  const consecutiveAbsentees: { student: Student; count: number }[] = [];
  students.forEach((st) => {
    let recentAbsenceHits = 0;
    sessions.forEach((sess) => {
      const records = Array.isArray(sess.records) ? sess.records : [];
      const rec = records.find((r) => r && r.studentId === st.id);
      if (rec && (rec.status === 'absent' || rec.status === 'under_review')) {
        recentAbsenceHits++;
      }
    });
    if (recentAbsenceHits >= (config.consecutiveAbsenceDaysThreshold || 2) || st.totalAbsences >= 6) {
      consecutiveAbsentees.push({ student: st, count: recentAbsenceHits });
    }
  });

  if (consecutiveAbsentees.length > 0) {
    const topConsecutive = consecutiveAbsentees.slice(0, 3);
    anomalies.push({
      id: `anom-consec-${today}`,
      type: 'consecutive_absence',
      severity: 'warning',
      titleAr: `غياب متتالي لعدة أيام دون عذر مسبق (${consecutiveAbsentees.length} طالب)`,
      titleEn: 'Consecutive Days Absence Pattern',
      descriptionAr: `رُصد غياب متتالٍ لعدد ${consecutiveAbsentees.length} طلاب لأيام متتابعة دون استئذان رسمي مسبق، مما يرفع مؤشر خطر الانقطاع غير المبرر.`,
      metric: `${consecutiveAbsentees.length} طلاب`,
      targetName: topConsecutive.map((c) => c.student.fullName).join('، '),
      suggestedActionAr: 'الاتصال الهاتفي الفوري بأولياء الأمور صباح اليوم للتحقق من سلامة الطلاب.',
    });
  }

  // Anomaly D: Suspicious medical excuses flagged with high risk
  const flaggedExcuses = justifications.filter(
    (j) => j.status === 'pending' && (j.aiAnalysis?.verificationStatus === 'irregular' || j.aiAnalysis?.overallRiskLevel === 'high')
  );
  if (flaggedExcuses.length > 0) {
    anomalies.push({
      id: `anom-excuse-${today}`,
      type: 'pattern_discrepancy',
      severity: 'critical',
      titleAr: `أعذار طبية مشبوهة رصدها الذكاء الاصطناعي (${flaggedExcuses.length} تقرير)`,
      titleEn: 'AI-Flagged Irregular Medical Excuses',
      descriptionAr: `فحص محرك الذكاء الاصطناعي أعذاراً طبية مقدمة ورصد تناقضات جوهرية (عدم تطابق اسم، تواريخ قديمة، أو فقدان أختام رسمية معتمدة).`,
      metric: `${flaggedExcuses.length} تقارير مشبوهة`,
      targetName: flaggedExcuses.map((j) => j.studentName).join('، '),
      suggestedActionAr: 'استدعاء ولي الأمر لإحضار الأصل الورقي وتقرير المنشأة الصحية المعتمدة قبل البت فيه.',
    });
  }

  // 3. High-Risk Students (Chronic absence threshold)
  const highRiskStudents: DailyDigestHighRiskStudent[] = students
    .filter((s) => s.totalAbsences >= (config.chronicAbsenceThreshold || 5) || s.attendanceRate < 85)
    .sort((a, b) => b.totalAbsences - a.totalAbsences)
    .map((s) => {
      let riskTier: DailyDigestHighRiskStudent['riskTier'] = 'tier_3_plus';
      let primaryConcernAr = 'تجاوز حد الغياب الأولي (3 أيام)';
      let actionRequiredAr = 'إرسال إشعار تنبيه أولي لولي الأمر عبر الرسائل القصيرة.';

      if (s.totalAbsences >= 8) {
        riskTier = 'tier_8_plus';
        primaryConcernAr = 'مستوى حرج جداً (8+ أيام) - خطر الحرمان النهائي وفق لائحة المواظبة';
        actionRequiredAr = 'استدعاء ولي الأمر وتوقيع تعهد انضباط وإحالة للموجه الطلابي فوراً.';
      } else if (s.totalAbsences >= 5) {
        riskTier = 'tier_5_plus';
        primaryConcernAr = 'مستوى مرتفع (5-7 أيام) - استحقاق الإنذار الإداري الثاني';
        actionRequiredAr = 'إصدار إنذار خطي رسمي وتكليف الأخصائي بدراسة حالة الطالب.';
      }

      return {
        id: s.id,
        name: s.fullName,
        grade: s.grade,
        className: s.className,
        totalAbsences: s.totalAbsences,
        totalLates: s.totalLates,
        attendanceRate: s.attendanceRate,
        riskTier,
        guardianName: s.guardianName,
        guardianPhone: s.guardianPhone,
        primaryConcernAr,
        actionRequiredAr,
      };
    });

  // 4. Pending Justifications
  const pendingJustifications: DailyDigestPendingExcuse[] = justifications
    .filter((j) => j.status === 'pending')
    .map((j) => {
      const flags: string[] = [];
      if (j.aiAnalysis?.verificationStatus === 'irregular') flags.push('تناقض في البيانات');
      if (j.aiAnalysis?.overallRiskLevel === 'high') flags.push('مستوى خطر مرتفع');
      if (j.aiAnalysis?.hasOfficialStampOrSignature === false) flags.push('بدون ختم أو توقيع');
      if (j.aiAnalysis?.checklist?.nameMatch?.passed === false) flags.push('الاسم غير مطابق');
      if (j.aiAnalysis?.checklist?.dateMatch?.passed === false) flags.push('التاريخ غير مطابق');

      let actionRequiredAr = 'مراجعة المرفق واعتماد العذر الطبي.';
      if (flags.length > 0) {
        actionRequiredAr = 'تدقيق يدوي مشدد لوجود ملاحظات في تقرير الذكاء الاصطناعي.';
      }

      return {
        id: j.id,
        studentName: j.studentName,
        className: j.className,
        absenceDate: j.absenceDate,
        reasonType: j.reasonType === 'medical' ? 'عذر طبي' : j.reasonType === 'family' ? 'ظرف عائلي' : 'أخرى',
        aiVerificationStatus: j.aiAnalysis?.verificationStatus,
        aiRiskLevel: j.aiAnalysis?.overallRiskLevel,
        integrityScore: j.aiAnalysis?.integrityScore,
        flagsAr: flags,
        actionRequiredAr,
      };
    });

  return {
    tenantId,
    date: today,
    scheduledTime: config.scheduledTime || '06:45',
    recipients: config.recipients,
    subject: `[نشرة الصباح ${config.scheduledTime || '06:45'}] ملخص انضباط المدرسة والشذوذات المرصودة - ${today}`,
    overallAttendanceRate,
    totalStudents,
    anomaliesCount: anomalies.length,
    pendingJustificationsCount: pendingJustifications.length,
    highRiskStudentsCount: highRiskStudents.length,
    anomalies,
    highRiskStudents,
    pendingJustifications,
  };
}

export function generateHtmlEmailTemplate(digest: DailyEmailDigestItem, tenantName: string): string {
  const anomaliesHtml = digest.anomalies.length > 0
    ? digest.anomalies
        .map(
          (a) => `
        <div style="background-color: ${a.severity === 'critical' ? '#fef2f2' : a.severity === 'warning' ? '#fffbeb' : '#f0fdf4'}; border: 1px solid ${a.severity === 'critical' ? '#fecaca' : a.severity === 'warning' ? '#fde68a' : '#bbf7d0'}; border-radius: 8px; padding: 12px 16px; margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="color: ${a.severity === 'critical' ? '#991b1b' : a.severity === 'warning' ? '#92400e' : '#166534'}; font-size: 14px;">
              ${a.severity === 'critical' ? '🔴' : a.severity === 'warning' ? '🟠' : '🟢'} ${a.titleAr}
            </strong>
            <span style="background-color: ${a.severity === 'critical' ? '#ef4444' : a.severity === 'warning' ? '#f59e0b' : '#10b981'}; color: #ffffff; font-size: 11px; font-weight: bold; padding: 2px 8px; border-radius: 12px;">
              ${a.metric}
            </span>
          </div>
          <p style="margin: 0 0 6px 0; color: #334155; font-size: 13px; line-height: 1.5;">${a.descriptionAr}</p>
          <div style="background-color: rgba(255,255,255,0.7); border-radius: 4px; padding: 6px 10px; font-size: 12px; color: #475569;">
            <b>الإجراء المقترح:</b> ${a.suggestedActionAr}
          </div>
        </div>
      `
        )
        .join('')
    : '<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: center; color: #64748b; font-size: 13px;">✅ لا توجد شذوذات سلوكية أو غيابات غير اعتيادية مرصودة هذا الصباح.</div>';

  const pendingJustificationsHtml = digest.pendingJustifications.length > 0
    ? `
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px;">
        <thead>
          <tr style="background-color: #f1f5f9; color: #334155; text-align: right;">
            <th style="padding: 8px 10px; border-bottom: 2px solid #e2e8f0;">الطالب</th>
            <th style="padding: 8px 10px; border-bottom: 2px solid #e2e8f0;">الصف</th>
            <th style="padding: 8px 10px; border-bottom: 2px solid #e2e8f0;">تاريخ الغياب</th>
            <th style="padding: 8px 10px; border-bottom: 2px solid #e2e8f0;">النوع</th>
            <th style="padding: 8px 10px; border-bottom: 2px solid #e2e8f0;">فحص الذكاء الاصطناعي</th>
            <th style="padding: 8px 10px; border-bottom: 2px solid #e2e8f0;">الإجراء</th>
          </tr>
        </thead>
        <tbody>
          ${digest.pendingJustifications
            .map(
              (j) => `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 10px; font-weight: bold; color: #1e293b;">${j.studentName}</td>
              <td style="padding: 8px 10px; color: #475569;">${j.className}</td>
              <td style="padding: 8px 10px; color: #475569;">${j.absenceDate}</td>
              <td style="padding: 8px 10px; color: #475569;">${j.reasonType}</td>
              <td style="padding: 8px 10px;">
                ${
                  j.aiRiskLevel === 'high'
                    ? '<span style="color: #dc2626; font-weight: bold; background: #fee2e2; padding: 2px 6px; border-radius: 4px;">⚠️ مشبوه / تناقض</span>'
                    : j.aiRiskLevel === 'medium'
                    ? '<span style="color: #d97706; background: #fef3c7; padding: 2px 6px; border-radius: 4px;">تنبيه فحص</span>'
                    : '<span style="color: #059669; background: #d1fae5; padding: 2px 6px; border-radius: 4px;">مستند رسمي سليم</span>'
                }
              </td>
              <td style="padding: 8px 10px; color: #2563eb; font-weight: bold;">${j.actionRequiredAr}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `
    : '<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: center; color: #64748b; font-size: 13px;">✅ لا توجد طلبات أعذار معلقة بانتظار الاعتماد.</div>';

  const highRiskStudentsHtml = digest.highRiskStudents.length > 0
    ? `
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px;">
        <thead>
          <tr style="background-color: #f1f5f9; color: #334155; text-align: right;">
            <th style="padding: 8px 10px; border-bottom: 2px solid #e2e8f0;">اسم الطالب</th>
            <th style="padding: 8px 10px; border-bottom: 2px solid #e2e8f0;">الصف</th>
            <th style="padding: 8px 10px; border-bottom: 2px solid #e2e8f0;">أيام الغياب</th>
            <th style="padding: 8px 10px; border-bottom: 2px solid #e2e8f0;">نسبة الحضور</th>
            <th style="padding: 8px 10px; border-bottom: 2px solid #e2e8f0;">مستوى الخطر</th>
            <th style="padding: 8px 10px; border-bottom: 2px solid #e2e8f0;">ولي الأمر والهاتف</th>
          </tr>
        </thead>
        <tbody>
          ${digest.highRiskStudents
            .map(
              (s) => `
            <tr style="border-bottom: 1px solid #f1f5f9; background-color: ${s.riskTier === 'tier_8_plus' ? '#fff5f5' : '#ffffff'};">
              <td style="padding: 8px 10px; font-weight: bold; color: #0f172a;">${s.name}</td>
              <td style="padding: 8px 10px; color: #475569;">${s.className}</td>
              <td style="padding: 8px 10px; font-weight: bold; color: ${s.totalAbsences >= 8 ? '#dc2626' : '#d97706'}; font-size: 13px;">${s.totalAbsences} يوم</td>
              <td style="padding: 8px 10px; font-weight: bold; color: #047857;">${s.attendanceRate}%</td>
              <td style="padding: 8px 10px;">
                ${
                  s.riskTier === 'tier_8_plus'
                    ? '<span style="color: #991b1b; font-weight: bold; background: #fee2e2; padding: 2px 8px; border-radius: 4px;">إنذار نهائي 3 (حرمان)</span>'
                    : s.riskTier === 'tier_5_plus'
                    ? '<span style="color: #b45309; font-weight: bold; background: #fef3c7; padding: 2px 8px; border-radius: 4px;">إنذار ثان (5-7 أيام)</span>'
                    : '<span style="color: #1e3a8a; background: #dbeafe; padding: 2px 8px; border-radius: 4px;">تنبيه أولي</span>'
                }
              </td>
              <td style="padding: 8px 10px; color: #334155;">
                <div>${s.guardianName}</div>
                <div dir="ltr" style="font-family: monospace; color: #0284c7; font-size: 11px;">${s.guardianPhone}</div>
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `
    : '<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: center; color: #64748b; font-size: 13px;">✅ لا يوجد طلاب في الشريحة الحرجة حالياً.</div>';

  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${digest.subject}</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; text-align: right; color: #1e293b;">
  <div style="max-width: 720px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
    
    <!-- Header Banner -->
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff; padding: 24px 28px; border-bottom: 4px solid #10b981;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <span style="background-color: #10b981; color: #ffffff; font-size: 11px; font-weight: bold; padding: 3px 10px; border-radius: 20px; letter-spacing: 0.5px;">
          ⏰ نشرة الصباح الاستباقية (${digest.scheduledTime} ص)
        </span>
        <span style="color: #94a3b8; font-size: 12px;">تاريخ الصدور: ${digest.date}</span>
      </div>
      <h1 style="margin: 0 0 6px 0; font-size: 20px; font-weight: bold; color: #ffffff;">${tenantName}</h1>
      <p style="margin: 0; color: #cbd5e1; font-size: 13px;">
        النشرة الصباحية اليومية لقيادة المدرسة: رصد الشذوذات، الأعذار الطبية المعلقة، والطلاب المعرضين لخطر الحرمان
      </p>
    </div>

    <!-- Executive Greeting & Date -->
    <div style="padding: 18px 28px; border-bottom: 1px solid #f1f5f9; background-color: #f8fafc; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <span style="font-size: 13px; color: #475569;">موجهة إلى: </span>
        <strong style="font-size: 13px; color: #0f172a;">فريق الإدارة المدرسية والموجه الطلابي</strong>
      </div>
      <div style="font-size: 12px; color: #64748b;">
        الحالة: <b style="color: #059669;">تم التدقيق الآلي قبل الحصة الأولى</b>
      </div>
    </div>

    <!-- 4 KPI Cards -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 20px 28px; background-color: #ffffff;">
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; text-align: center;">
        <div style="font-size: 11px; color: #166534; font-weight: bold;">نسبة الحضور التراكمية</div>
        <div style="font-size: 22px; font-weight: bold; color: #15803d; margin-top: 4px;">${digest.overallAttendanceRate}%</div>
      </div>
      <div style="background-color: ${digest.anomaliesCount > 0 ? '#fef2f2' : '#f8fafc'}; border: 1px solid ${digest.anomaliesCount > 0 ? '#fecaca' : '#e2e8f0'}; border-radius: 8px; padding: 12px; text-align: center;">
        <div style="font-size: 11px; color: ${digest.anomaliesCount > 0 ? '#991b1b' : '#64748b'}; font-weight: bold;">الشذوذات والتناقضات</div>
        <div style="font-size: 22px; font-weight: bold; color: ${digest.anomaliesCount > 0 ? '#dc2626' : '#64748b'}; margin-top: 4px;">${digest.anomaliesCount}</div>
      </div>
      <div style="background-color: ${digest.highRiskStudentsCount > 0 ? '#fffbeb' : '#f8fafc'}; border: 1px solid ${digest.highRiskStudentsCount > 0 ? '#fde68a' : '#e2e8f0'}; border-radius: 8px; padding: 12px; text-align: center;">
        <div style="font-size: 11px; color: ${digest.highRiskStudentsCount > 0 ? '#92400e' : '#64748b'}; font-weight: bold;">طلاب في النطاق الحرج</div>
        <div style="font-size: 22px; font-weight: bold; color: ${digest.highRiskStudentsCount > 0 ? '#d97706' : '#64748b'}; margin-top: 4px;">${digest.highRiskStudentsCount}</div>
      </div>
      <div style="background-color: ${digest.pendingJustificationsCount > 0 ? '#eff6ff' : '#f8fafc'}; border: 1px solid ${digest.pendingJustificationsCount > 0 ? '#bfdbfe' : '#e2e8f0'}; border-radius: 8px; padding: 12px; text-align: center;">
        <div style="font-size: 11px; color: ${digest.pendingJustificationsCount > 0 ? '#1e40af' : '#64748b'}; font-weight: bold;">أعذار معلقة للاعتماد</div>
        <div style="font-size: 22px; font-weight: bold; color: ${digest.pendingJustificationsCount > 0 ? '#2563eb' : '#64748b'}; margin-top: 4px;">${digest.pendingJustificationsCount}</div>
      </div>
    </div>

    <!-- Gemini AI Executive Briefing Box -->
    ${
      digest.geminiBriefing
        ? `
    <div style="margin: 0 28px 24px 28px; background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 1px solid #6ee7b7; border-radius: 10px; padding: 18px 20px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <span style="font-size: 16px;">✨</span>
        <strong style="color: #065f46; font-size: 14px;">موجز الذكاء الاصطناعي الصباحي (Gemini Executive Synthesis)</strong>
        <span style="margin-right: auto; background-color: #047857; color: #ffffff; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px;">تحليل فوري</span>
      </div>
      <p style="margin: 0 0 12px 0; color: #1e3a2b; font-size: 13px; line-height: 1.6;">
        ${digest.geminiBriefing.executiveSummary}
      </p>
      
      <div style="background-color: #ffffff; border-radius: 6px; padding: 12px; border: 1px solid #a7f3d0;">
        <div style="font-size: 12px; font-weight: bold; color: #047857; margin-bottom: 6px;">⚡ إجراءات الإدارة ذات الأولوية قبل انطلاق الحصة الأولى:</div>
        <ul style="margin: 0; padding-right: 20px; font-size: 12px; color: #334155; line-height: 1.6;">
          ${digest.geminiBriefing.keyPriorities.map((p) => `<li>${p}</li>`).join('')}
        </ul>
      </div>

      ${
        digest.geminiBriefing.counselorDirectives && digest.geminiBriefing.counselorDirectives.length > 0
          ? `
        <div style="margin-top: 10px; font-size: 12px; color: #065f46;">
          <b>🎯 توجيه الموجه الطلابي:</b> ${digest.geminiBriefing.counselorDirectives.join(' | ')}
        </div>
      `
          : ''
      }
    </div>
    `
        : ''
    }

    <!-- Section 1: Anomalies -->
    <div style="padding: 0 28px 24px 28px;">
      <h2 style="font-size: 15px; color: #0f172a; margin: 0 0 12px 0; padding-bottom: 6px; border-bottom: 2px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between;">
        <span>🔍 أولاً: شذوذات وتناقضات الحضور المرصودة (${digest.anomaliesCount})</span>
        <span style="font-size: 11px; font-weight: normal; color: #64748b;">تحديث الساعة 06:45 ص</span>
      </h2>
      ${anomaliesHtml}
    </div>

    <!-- Section 2: Pending Excuses & AI Verifications -->
    <div style="padding: 0 28px 24px 28px;">
      <h2 style="font-size: 15px; color: #0f172a; margin: 0 0 12px 0; padding-bottom: 6px; border-bottom: 2px solid #e2e8f0;">
        📑 ثانياً: طلبات الأعذار الطبية المعلقة بانتظار الاعتماد (${digest.pendingJustificationsCount})
      </h2>
      ${pendingJustificationsHtml}
    </div>

    <!-- Section 3: High Risk Students -->
    <div style="padding: 0 28px 28px 28px;">
      <h2 style="font-size: 15px; color: #0f172a; margin: 0 0 12px 0; padding-bottom: 6px; border-bottom: 2px solid #e2e8f0;">
        ⚠️ ثالثاً: الطلاب في النطاق الحرج وخطر الحرمان (${digest.highRiskStudentsCount})
      </h2>
      ${highRiskStudentsHtml}
    </div>

    <!-- Footer -->
    <div style="background-color: #f1f5f9; padding: 20px 28px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; line-height: 1.6; text-align: center;">
      <div>هذه النشرة الصباحية تم توليدها وإرسالها آلياً بواسطة <b>نظام مدرستي حضور الذكي (2026)</b> المعتمد لإدارة الانضباط المدرسي.</div>
      <div>مدعومة بنماذج الذكاء الاصطناعي Google Gemini للتحليل الجنائي للوثائق الطبية ورصد الأنماط الشاذة.</div>
      <div style="margin-top: 8px; color: #94a3b8;">
        المستلمون: ${digest.recipients.join(' | ')}
      </div>
    </div>

  </div>
</body>
</html>
  `.trim();
}
