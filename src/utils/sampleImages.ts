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
