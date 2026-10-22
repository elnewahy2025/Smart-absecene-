export interface AbsenceNotificationTemplate {
  id: string;
  titleAr: string;
  titleEn: string;
  badgeAr: string;
  badgeEn: string;
  category: 'absence' | 'warning';
  text: string;
}

export const absenceTemplates: AbsenceNotificationTemplate[] = [
  {
    id: 'tpl-daily-absence',
    titleAr: 'تذكير بتقديم عذر طبي لغياب اليوم',
    titleEn: 'Today Absence & Medical Excuse Request',
    badgeAr: 'تذكير يومي',
    badgeEn: 'Daily Reminder',
    category: 'absence' as const,
    text: 'المكرم ولي أمر الطالب ({student_name}): نود إشعاركم بتسجيل غياب نجلكم المقيد بالصف ({class_name}) اليوم. نأمل الدخول إلى بوابة ولي الأمر لتقديم العذر الطبي المعتمد خلال 3 أيام لتفادي حسم درجات المواظبة. مدرسة ({school_name}).',
  },
  {
    id: 'tpl-chronic-warning',
    titleAr: 'إنذار رسمي لتجاوز نصاب أيام الغياب',
    titleEn: 'Official Warning for Repeated Absences',
    badgeAr: 'إنذار رسمي',
    badgeEn: 'Official Warning',
    category: 'warning' as const,
    text: 'إشعار رسمي عاجل: المكرم ولي أمر الطالب ({student_name})، نفيدكم بأن إجمالي أيام غياب نجلكم بلغ ({absences_count}) أيام. نرجو الدخول لبوابة ولي الأمر والمبادرة بتقديم الأعذار المقبولة ومراجعة إدارة مدرسة ({school_name}) حفظاً على مستواه الأكاديمي.',
  },
  {
    id: 'tpl-excuse-deadline',
    titleAr: 'تذكير بانتهاء مهلة رفع التقرير الطبي (3 أيام)',
    titleEn: 'Medical Excuse Deadline Approaching',
    badgeAr: 'مهلة التقرير',
    badgeEn: 'Deadline Notice',
    category: 'absence' as const,
    text: 'المكرم ولي أمر الطالب ({student_name}): نود تذكيركم بقرب انتهاء المهلة النظامية (3 أيام) لرفع العذر الطبي المعتمد لغياب نجلكم. يرجى إرفاق صورة التقرير عبر بوابة ولي الأمر لاعتماده تلقائياً قبل إغلاق الفترة.',
  },
  {
    id: 'tpl-unexcused-alert',
    titleAr: 'تنبيه غياب غير مبرر والتأثير على السلوك والمواظبة',
    titleEn: 'Unexcused Absence Policy Notice',
    badgeAr: 'لائحة المواظبة',
    badgeEn: 'Policy Notice',
    category: 'absence' as const,
    text: 'المكرم ولي أمر الطالب ({student_name}): تم رصد غياب بدون عذر مقبول لنجلكم بالصف ({class_name}). حرصاً على درجات المواظبة والانضباط المدرسي، نرجو مراجعة التوجيه الطلابي بمدرسة ({school_name}).',
  },
  {
    id: 'tpl-custom',
    titleAr: 'صياغة رسالة تذكير مخصصة',
    titleEn: 'Custom Reminder Message',
    badgeAr: 'مخصص',
    badgeEn: 'Custom',
    category: 'absence' as const,
    text: 'المكرم ولي أمر الطالب ({student_name}): نأمل منكم التكرم بتقديم العذر المعتمد لغياب نجلكم بالصف ({class_name}) لدى مدرسة ({school_name}).',
  },
];
