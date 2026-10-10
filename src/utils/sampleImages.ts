// Helper to create a base64 image of a realistic medical certificate / excuse letter
export function generateSampleMedicalNoteBase64(studentName = 'يوسف خالد المطيري', hospital = 'مستشفى الملك فيصل التخصصي'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 1050;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background - paper textured tint
  ctx.fillStyle = '#fbfbf9';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Decorative border
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 4;
  ctx.strokeRect(25, 25, canvas.width - 50, canvas.height - 50);

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.strokeRect(35, 35, canvas.width - 70, canvas.height - 70);

  // Header
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 24px Cairo, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('المملكة العربية السعودية - وزارة الصحة', canvas.width / 2, 80);

  ctx.fillStyle = '#0284c7';
  ctx.font = 'bold 22px Cairo, sans-serif';
  ctx.fillText(hospital, canvas.width / 2, 115);

  ctx.fillStyle = '#64748b';
  ctx.font = '16px Cairo, sans-serif';
  ctx.fillText('قسم الطوارئ والرعاية العاجلة - تقرير إجازة مرضية مدرسية', canvas.width / 2, 145);

  // Divider line
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, 165);
  ctx.lineTo(canvas.width - 60, 165);
  ctx.stroke();

  // Document details
  ctx.textAlign = 'right';
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 18px Cairo, sans-serif';

  const rightX = canvas.width - 80;
  let y = 210;

  ctx.fillText('رقم التقرير: MED-2026-98412', rightX, y);
  ctx.fillText('تاريخ الكشف: 2026-10-10 م', rightX - 350, y);
  y += 45;

  ctx.font = '17px Cairo, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText(`اسم المريض / الطالب: ${studentName}`, rightX, y);
  y += 35;
  ctx.fillText('السجل المدني: 1098765431', rightX, y);
  y += 35;
  ctx.fillText('المرحلة الدراسية: الصف العاشر (الأول الثانوي)', rightX, y);
  y += 45;

  // Diagnosis section box
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(60, y, canvas.width - 120, 160);
  ctx.strokeStyle = '#94a3b8';
  ctx.strokeRect(60, y, canvas.width - 120, 160);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px Cairo, sans-serif';
  ctx.fillText('التشخيص الطبي وتوصية الطبيب المعالج:', rightX - 20, y + 40);

  ctx.font = '16px Cairo, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText('تم فحص الطالب المذكور أعلاه وتبين إصابته بنزلة معوية حادة وارتفاع بدرجة الحرارة.', rightX - 20, y + 75);
  ctx.fillText('يوصى بمنحه إجازة مرضية وراحة تامة لمدة يومين (2) تبدأ من 2026-10-10 م حتى 2026-10-11 م.', rightX - 20, y + 105);
  ctx.fillText('يمنع من مزاولة النشاط البدني والمجهود الدراسي لحين استقرار الحالة.', rightX - 20, y + 135);

  y += 210;

  // Doctor section
  ctx.fillText('اسم الطبيب المعالج: د. عبد المحسن آل الشيخ (استشاري طب الأسرة)', rightX, y);
  y += 35;
  ctx.fillText('الترخيص الطبي رقم: SCFHS-882194', rightX, y);
  y += 60;

  // Official Stamp (Circular imitation)
  ctx.save();
  ctx.translate(220, y + 40);
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 75, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, 68, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 13px Cairo, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ختم الاعتماد الرسمي', 0, -25);
  ctx.fillText('وزارة الصحة - الرياض', 0, 0);
  ctx.fillText('معتمد - إجازة رسمية', 0, 25);
  ctx.fillText('OFFICIAL MEDICAL SEAL', 0, 45);
  ctx.restore();

  // Signature line
  ctx.fillStyle = '#0f172a';
  ctx.font = '16px Cairo, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('توقيع الطبيب المعتمد: _____________________', rightX, y + 60);

  // Footer note
  ctx.textAlign = 'center';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px Cairo, sans-serif';
  ctx.fillText('هذا التقرير صادر إلكترونياً ومصادق عليه عبر المنصة الصحية المعتمدة.', canvas.width / 2, canvas.height - 45);

  return canvas.toDataURL('image/jpeg', 0.9);
}

// Helper to create a base64 image of an irregular medical report with intentional inconsistencies
// (e.g. Mismatched student name, old/unmatched dates, missing or unverified stamp)
export function generateSampleIrregularMedicalNoteBase64(
  mismatchedName = 'عبدالله بن فهد الدوسري',
  oldDate = '2024-03-12'
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 1050;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background - slightly degraded/yellowed paper
  ctx.fillStyle = '#faf8f2';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Faint draft watermark across background
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(-Math.PI / 5);
  ctx.font = 'bold 50px Cairo, sans-serif';
  ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
  ctx.textAlign = 'center';
  ctx.fillText('نسخة غير مصادقة - مسودة', 0, 0);
  ctx.restore();

  // Border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 3;
  ctx.strokeRect(25, 25, canvas.width - 50, canvas.height - 50);

  // Header
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 22px Cairo, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('مستوصف السلام الأهلي - تقرير استشارة طبية أولية', canvas.width / 2, 85);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '15px Cairo, sans-serif';
  ctx.fillText('(نموذج غير رسمي للمراجعة الداخلية فقط)', canvas.width / 2, 120);

  // Divider line
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, 150);
  ctx.lineTo(canvas.width - 60, 150);
  ctx.stroke();

  // Document details with obvious inconsistencies
  ctx.textAlign = 'right';
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 17px Cairo, sans-serif';

  const rightX = canvas.width - 80;
  let y = 195;

  ctx.fillText('رقم الكشف: 00482-DRAFT', rightX, y);
  // Date inconsistency: old date from 2024 instead of current absence date
  ctx.fillStyle = '#b91c1c';
  ctx.fillText(`تاريخ الزيارة: ${oldDate} م (تاريخ قديم غير مطابق)`, rightX - 320, y);
  y += 45;

  // Name inconsistency: mismatched name
  ctx.font = 'bold 18px Cairo, sans-serif';
  ctx.fillStyle = '#b91c1c';
  ctx.fillText(`اسم المريض: ${mismatchedName} (اسم غير مطابق لسجل الطالب)`, rightX, y);
  y += 40;

  ctx.font = '16px Cairo, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('السجل المدني: 1045981240', rightX, y);
  y += 35;
  ctx.fillText('المرحلة: الصف التاسع (المتوسط الثالث)', rightX, y);
  y += 45;

  // Diagnosis box with generic unverified text
  ctx.fillStyle = '#fff';
  ctx.fillRect(60, y, canvas.width - 120, 150);
  ctx.strokeStyle = '#fca5a5';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(60, y, canvas.width - 120, 150);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 17px Cairo, sans-serif';
  ctx.fillText('التشخيص والملاحظات:', rightX - 20, y + 35);

  ctx.font = '15px Cairo, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('حضر المريض يشكو من إرهاق عام وصداع.', rightX - 20, y + 70);
  ctx.fillText('التقرير لا يتضمن مدة إجازة صريحة أو توصية غياب رسمية معتمدة.', rightX - 20, y + 100);
  ctx.fillText('المستند ينقصه اعتماد منصة صحتي وتوقيع الاستشاري المسجل.', rightX - 20, y + 130);

  y += 190;

  ctx.fillStyle = '#334155';
  ctx.fillText('طبيب عام مناوب: د. طارق (طبيب متدرب)', rightX, y);
  y += 35;
  ctx.fillText('رقم الترخيص: قيد التجديد', rightX, y);
  y += 60;

  // Missing Stamp box with red warning
  ctx.save();
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(120, y, 220, 100);
  ctx.fillStyle = '#b91c1c';
  ctx.font = 'bold 14px Cairo, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('تنبيه: لا يوجد ختم رسمي معتمد', 230, y + 45);
  ctx.font = '12px Cairo, sans-serif';
  ctx.fillText('مستند غير مكتمل الأختام النظامية', 230, y + 70);
  ctx.restore();

  // Signature line blank
  ctx.fillStyle = '#64748b';
  ctx.font = '15px Cairo, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('توقيع الطبيب المعتمد: [فارغ وغير موقع]', rightX, y + 45);

  // Footer note warning
  ctx.textAlign = 'center';
  ctx.fillStyle = '#b91c1c';
  ctx.font = 'bold 13px Cairo, sans-serif';
  ctx.fillText('تنبيه أمني: هذا التقرير غير معتمد من وزارة الصحة ولا يخول الطالب الحصول على إجازة رسمية.', canvas.width / 2, canvas.height - 45);

  return canvas.toDataURL('image/jpeg', 0.9);
}

