import { OfficialHoliday } from '../types/attendance';

export interface CountryPreset {
  countryNameAr: string;
  countryNameEn: string;
  callingCode: string;
  flag: string;
  ministryHeaderAr: string;
  directorateLabelAr: string;
  directoratePlaceholderAr: string;
  officeLabelAr: string;
  officePlaceholderAr: string;
  regionLabelAr: string;
  regionPlaceholderAr: string;
  cityPlaceholderAr: string;
  districtPlaceholderAr: string;
  postalCodePlaceholder: string;
  phoneExample: string;
  defaultWeekendDays: number[]; // [5, 6] = Fri-Sat, [6, 0] = Sat-Sun
  officialHolidays: OfficialHoliday[];
}

export const COUNTRY_PRESETS: Record<string, CountryPreset> = {
  // 1. المملكة العربية السعودية
  'المملكة العربية السعودية': {
    countryNameAr: 'المملكة العربية السعودية',
    countryNameEn: 'Saudi Arabia',
    callingCode: '+966',
    flag: '🇸🇦',
    ministryHeaderAr: 'المملكة العربية السعودية\nوزارة التعليم\nالإدارة العامة للتعليم بمنطقة...',
    directorateLabelAr: 'الإدارة العامة للتعليم:',
    directoratePlaceholderAr: 'الإدارة العامة للتعليم بمنطقة الرياض',
    officeLabelAr: 'مكتب التعليم التابع له:',
    officePlaceholderAr: 'مكتب تعليم الروضة',
    regionLabelAr: 'المنطقة الإدارية:',
    regionPlaceholderAr: 'منطقة الرياض / مكة المكرمة / المنطقة الشرقية',
    cityPlaceholderAr: 'الرياض / جدة / الدمام',
    districtPlaceholderAr: 'حي الأندلس / حي النرجس / حي العليا',
    postalCodePlaceholder: '13214',
    phoneExample: '+966 50 123 4567',
    defaultWeekendDays: [5, 6],
    officialHolidays: [
      {
        id: 'hol-sa-national-day',
        nameAr: 'اليوم الوطني للمملكة العربية السعودية (94)',
        nameEn: 'Saudi National Day 94',
        startDate: '2026-09-23',
        endDate: '2026-09-23',
        type: 'national',
        notes: 'إجازة رسمية لكافة المدارس والجامعات والقطاعات الحكومية والخاصة بالمملكة.',
      },
      {
        id: 'hol-sa-extended-weekend-1',
        nameAr: 'إجازة نهاية أسبوع مطولة (الفصل الأول)',
        nameEn: 'Extended Weekend 1',
        startDate: '2026-10-14',
        endDate: '2026-10-15',
        type: 'extended_weekend',
        notes: 'عطلة نهاية أسبوع مطولة معتمدة بالتقويم الدراسي لوزارة التعليم.',
      },
      {
        id: 'hol-sa-founding-day',
        nameAr: 'يوم التأسيس السعودي',
        nameEn: 'Saudi Founding Day',
        startDate: '2027-02-22',
        endDate: '2027-02-22',
        type: 'national',
        notes: 'إجازة رسمية لذكرى تأسيس الدولة السعودية.',
      },
      {
        id: 'hol-sa-eid-fitr',
        nameAr: 'إجازة عيد الفطر المبارك',
        nameEn: 'Eid Al-Fitr Holiday',
        startDate: '2027-03-18',
        endDate: '2027-04-03',
        type: 'religious',
        notes: 'إجازة عيد الفطر المبارك لجميع المدارس ومنسوبيها.',
      },
      {
        id: 'hol-sa-extended-weekend-2',
        nameAr: 'إجازة نهاية أسبوع مطولة (الفصل الثاني)',
        nameEn: 'Extended Weekend 2',
        startDate: '2027-05-02',
        endDate: '2027-05-03',
        type: 'extended_weekend',
        notes: 'عطلة نهاية أسبوع مطولة لتعزيز الانضباط وتجديد النشاط المدرسي.',
      },
      {
        id: 'hol-sa-eid-adha',
        nameAr: 'إجازة عيد الأضحى المبارك',
        nameEn: 'Eid Al-Adha Holiday',
        startDate: '2027-05-25',
        endDate: '2027-06-05',
        type: 'religious',
        notes: 'إجازة عيد الأضحى المبارك وموسم الحج.',
      },
    ],
  },

  // 2. جمهورية مصر العربية
  'مصر': {
    countryNameAr: 'جمهورية مصر العربية',
    countryNameEn: 'Egypt',
    callingCode: '+20',
    flag: '🇪🇬',
    ministryHeaderAr: 'جمهورية مصر العربية\nوزارة التربية والتعليم والتعليم الفني\nمديرية التربية والتعليم بمحافظة...',
    directorateLabelAr: 'مديرية التربية والتعليم:',
    directoratePlaceholderAr: 'مديرية التربية والتعليم بمحافظة القاهرة',
    officeLabelAr: 'الإدارة التعليمية التابع لها:',
    officePlaceholderAr: 'إدارة مصر الجديدة التعليمية',
    regionLabelAr: 'المحافظة:',
    regionPlaceholderAr: 'محافظة القاهرة / الجيزة / الإسكندرية',
    cityPlaceholderAr: 'القاهرة / الإسكندرية / الجيزة',
    districtPlaceholderAr: 'مدينة نصر / المعادي / الدقي',
    postalCodePlaceholder: '11511',
    phoneExample: '+20 10 1234 5678',
    defaultWeekendDays: [5, 6],
    officialHolidays: [
      {
        id: 'hol-eg-6oct',
        nameAr: 'عيد القوات المسلحة (نصر 6 أكتوبر)',
        nameEn: 'Armed Forces Day (6th of October)',
        startDate: '2026-10-06',
        endDate: '2026-10-06',
        type: 'national',
        notes: 'إجازة رسمية لجميع المدارس والجامعات بمناسبة ذكرى نصر أكتوبر.',
      },
      {
        id: 'hol-eg-25jan',
        nameAr: 'عيد الشرطة وثورة 25 يناير',
        nameEn: 'Police Day & 25 January Revolution',
        startDate: '2027-01-25',
        endDate: '2027-01-25',
        type: 'national',
        notes: 'إجازة وطنية رسمية لكافة المصالح والمدارس.',
      },
      {
        id: 'hol-eg-mid-year',
        nameAr: 'إجازة نصف العام الدراسي',
        nameEn: 'Mid-Year School Vacation',
        startDate: '2027-01-23',
        endDate: '2027-02-04',
        type: 'official',
        notes: 'عطلة منتصف العام لجميع المدارس المعتمدة بالخريطة الزمنية لوزارة التربية والتعليم.',
      },
      {
        id: 'hol-eg-eid-fitr',
        nameAr: 'إجازة عيد الفطر المبارك',
        nameEn: 'Eid Al-Fitr Holiday',
        startDate: '2027-03-20',
        endDate: '2027-03-24',
        type: 'religious',
        notes: 'عطلة رسمية بمناسبة عيد الفطر السعيد.',
      },
      {
        id: 'hol-eg-sinai',
        nameAr: 'عيد تحرير سيناء',
        nameEn: 'Sinai Liberation Day',
        startDate: '2027-04-25',
        endDate: '2027-04-25',
        type: 'national',
        notes: 'إجازة رسمية لذكرى تحرير سيناء.',
      },
      {
        id: 'hol-eg-labor',
        nameAr: 'عيد العمال',
        nameEn: 'Labor Day',
        startDate: '2027-05-01',
        endDate: '2027-05-01',
        type: 'national',
        notes: 'إجازة رسمية لجميع القطاعات التعليمية والعمالية.',
      },
      {
        id: 'hol-eg-sham-nessim',
        nameAr: 'إجازة شم النسيم',
        nameEn: 'Sham El-Nessim Holiday',
        startDate: '2027-05-03',
        endDate: '2027-05-03',
        type: 'official',
        notes: 'عطلة وطنية سنوية معتمدة.',
      },
      {
        id: 'hol-eg-eid-adha',
        nameAr: 'إجازة عيد الأضحى المبارك',
        nameEn: 'Eid Al-Adha Holiday',
        startDate: '2027-05-26',
        endDate: '2027-05-30',
        type: 'religious',
        notes: 'إجازة عيد الأضحى المبارك ووقفة عرفات.',
      },
      {
        id: 'hol-eg-30june',
        nameAr: 'ثورة 30 يونيو',
        nameEn: '30 June Revolution Day',
        startDate: '2027-06-30',
        endDate: '2027-06-30',
        type: 'national',
        notes: 'إجازة وطنية رسمية في عموم المدارس والمؤسسات.',
      },
    ],
  },

  // 3. الإمارات العربية المتحدة
  'الإمارات': {
    countryNameAr: 'الإمارات العربية المتحدة',
    countryNameEn: 'United Arab Emirates',
    callingCode: '+971',
    flag: '🇦🇪',
    ministryHeaderAr: 'دولة الإمارات العربية المتحدة\nمؤسسة الإمارات للتعليم المدرسي\nدائرة التعليم والمعرفة...',
    directorateLabelAr: 'الجهة / الهيئة التعليمية:',
    directoratePlaceholderAr: 'دائرة التعليم والمعرفة - أبوظبي / هيئة المعرفة دبي',
    officeLabelAr: 'النطاق / القطاع التعليمي:',
    officePlaceholderAr: 'نطاق دبي والشارقة المدرسي',
    regionLabelAr: 'الإمارة:',
    regionPlaceholderAr: 'إمارة أبوظبي / إمارة دبي / إمارة الشارقة',
    cityPlaceholderAr: 'أبوظبي / دبي / الشارقة / العين',
    districtPlaceholderAr: 'الخالدية / البرشاء / ديرة / المجاز',
    postalCodePlaceholder: '00000',
    phoneExample: '+971 50 123 4567',
    defaultWeekendDays: [6, 0], // Saturday & Sunday
    officialHolidays: [
      {
        id: 'hol-ae-commemoration',
        nameAr: 'يوم الشهيد',
        nameEn: 'Commemoration Day',
        startDate: '2026-11-30',
        endDate: '2026-11-30',
        type: 'national',
        notes: 'مناسبة وطنية رسمية تخليداً لشهداء الوطن.',
      },
      {
        id: 'hol-ae-national-day',
        nameAr: 'عيد الاتحاد (اليوم الوطني الـ 55)',
        nameEn: 'UAE National Day (Union Day)',
        startDate: '2026-12-02',
        endDate: '2026-12-03',
        type: 'national',
        notes: 'إجازة رسمية لجميع المدارس الحكومية والخاصة احتفاءً باليوم الوطني.',
      },
      {
        id: 'hol-ae-winter-break',
        nameAr: 'إجازة الشتاء المدرسية',
        nameEn: 'Winter School Vacation',
        startDate: '2026-12-14',
        endDate: '2027-01-01',
        type: 'official',
        notes: 'عطلة منتصف الفصل الدراسي المعتمدة من مؤسسة الإمارات للتعليم المدرسي.',
      },
      {
        id: 'hol-ae-eid-fitr',
        nameAr: 'إجازة عيد الفطر المبارك',
        nameEn: 'Eid Al-Fitr Holiday',
        startDate: '2027-03-20',
        endDate: '2027-03-23',
        type: 'religious',
        notes: 'عطلة رسمية لمدارس الدولة وكافة المنشآت.',
      },
      {
        id: 'hol-ae-spring-break',
        nameAr: 'إجازة الربيع المدرسية',
        nameEn: 'Spring School Vacation',
        startDate: '2027-03-22',
        endDate: '2027-04-09',
        type: 'official',
        notes: 'إجازة الربيع بين الفصلين الثاني والثالث.',
      },
      {
        id: 'hol-ae-eid-adha',
        nameAr: 'إجازة عيد الأضحى المبارك',
        nameEn: 'Eid Al-Adha Holiday',
        startDate: '2027-05-26',
        endDate: '2027-05-29',
        type: 'religious',
        notes: 'إجازة عيد الأضحى ووقفة عرفة.',
      },
    ],
  },

  // 4. دولة الكويت
  'الكويت': {
    countryNameAr: 'دولة الكويت',
    countryNameEn: 'Kuwait',
    callingCode: '+965',
    flag: '🇰🇼',
    ministryHeaderAr: 'دولة الكويت\nوزارة التربية\nالإدارة العامة للتعليم الخاص / التعليم العام...',
    directorateLabelAr: 'المنطقة التعليمية:',
    directoratePlaceholderAr: 'منطقة العاصمة التعليمية / منطقة حولي التعليمية',
    officeLabelAr: 'المراقبة التعليمية:',
    officePlaceholderAr: 'مراقبة التعليم الثانوي / المتوسط',
    regionLabelAr: 'المحافظة:',
    regionPlaceholderAr: 'محافظة العاصمة / محافظة حولي / الأحمدي',
    cityPlaceholderAr: 'مدينة الكويت / حولي / السالمية / الفروانية',
    districtPlaceholderAr: 'الشويخ / السالمية / كيفان / اليرموك',
    postalCodePlaceholder: '13001',
    phoneExample: '+965 9123 4567',
    defaultWeekendDays: [5, 6],
    officialHolidays: [
      {
        id: 'hol-kw-national-day',
        nameAr: 'العيد الوطني لدولة الكويت',
        nameEn: 'Kuwait National Day',
        startDate: '2027-02-25',
        endDate: '2027-02-25',
        type: 'national',
        notes: 'إجازة رسمية لجميع المدارس والمؤسسات.',
      },
      {
        id: 'hol-kw-liberation-day',
        nameAr: 'يوم التحرير الكويتي',
        nameEn: 'Kuwait Liberation Day',
        startDate: '2027-02-26',
        endDate: '2027-02-26',
        type: 'national',
        notes: 'عطلة رسمية بمناسبة ذكرى تحرير دولة الكويت.',
      },
      {
        id: 'hol-kw-mid-year',
        nameAr: 'إجازة منتصف العام الدراسي',
        nameEn: 'Mid-Year School Vacation',
        startDate: '2027-01-17',
        endDate: '2027-01-28',
        type: 'official',
        notes: 'إجازة الربيع لمدارس وزارة التربية.',
      },
      {
        id: 'hol-kw-eid-fitr',
        nameAr: 'إجازة عيد الفطر المبارك',
        nameEn: 'Eid Al-Fitr Holiday',
        startDate: '2027-03-20',
        endDate: '2027-03-24',
        type: 'religious',
        notes: 'عطلة عيد الفطر المبارك الرسمية.',
      },
      {
        id: 'hol-kw-eid-adha',
        nameAr: 'إجازة عيد الأضحى المبارك',
        nameEn: 'Eid Al-Adha Holiday',
        startDate: '2027-05-26',
        endDate: '2027-05-30',
        type: 'religious',
        notes: 'عطلة عيد الأضحى المبارك.',
      },
    ],
  },

  // 5. دولة قطر
  'قطر': {
    countryNameAr: 'دولة قطر',
    countryNameEn: 'Qatar',
    callingCode: '+974',
    flag: '🇶🇦',
    ministryHeaderAr: 'دولة قطر\nوزارة التربية والتعليم والتعليم العالي\nقطاع الشؤون التعليمية...',
    directorateLabelAr: 'إدارة التوجيه التربوي:',
    directoratePlaceholderAr: 'إدارة التعليم الحكومي والخاص',
    officeLabelAr: 'المكتب التعليمي:',
    officePlaceholderAr: 'مركز الدعم والإرشاد المدرسي',
    regionLabelAr: 'البلدية:',
    regionPlaceholderAr: 'بلدية الدوحة / بلدية الريان / بلدية الوكرة',
    cityPlaceholderAr: 'الدوحة / الريان / الوكرة / الخور',
    districtPlaceholderAr: 'الدفنة / الوعب / لوسيل',
    postalCodePlaceholder: '00974',
    phoneExample: '+974 5512 3456',
    defaultWeekendDays: [5, 6],
    officialHolidays: [
      {
        id: 'hol-qa-national-day',
        nameAr: 'اليوم الوطني لدولة قطر',
        nameEn: 'Qatar National Day',
        startDate: '2026-12-18',
        endDate: '2026-12-18',
        type: 'national',
        notes: 'إجازة رسمية لجميع قطاعات الدولة والمدارس.',
      },
      {
        id: 'hol-qa-sports-day',
        nameAr: 'اليوم الرياضي للدولة',
        nameEn: 'National Sports Day',
        startDate: '2027-02-09',
        endDate: '2027-02-09',
        type: 'national',
        notes: 'إجازة وطنية سنوية معتمدة لتعزيز الرياضة والصحة.',
      },
      {
        id: 'hol-qa-mid-year',
        nameAr: 'إجازة منتصف العام الأكاديمي',
        nameEn: 'Mid-Year School Vacation',
        startDate: '2026-12-20',
        endDate: '2027-01-07',
        type: 'official',
        notes: 'عطلة الفصل الدراسي المعتمدة بوزارة التربية والتعليم والتعليم العالي.',
      },
      {
        id: 'hol-qa-eid-fitr',
        nameAr: 'إجازة عيد الفطر المبارك',
        nameEn: 'Eid Al-Fitr Holiday',
        startDate: '2027-03-20',
        endDate: '2027-03-25',
        type: 'religious',
        notes: 'إجازة عيد الفطر المبارك.',
      },
      {
        id: 'hol-qa-eid-adha',
        nameAr: 'إجازة عيد الأضحى المبارك',
        nameEn: 'Eid Al-Adha Holiday',
        startDate: '2027-05-26',
        endDate: '2027-05-31',
        type: 'religious',
        notes: 'إجازة عيد الأضحى المبارك.',
      },
    ],
  },

  // 6. سلطنة عمان
  'عمان': {
    countryNameAr: 'سلطنة عمان',
    countryNameEn: 'Oman',
    callingCode: '+968',
    flag: '🇴🇲',
    ministryHeaderAr: 'سلطنة عمان\nوزارة التربية والتعليم\nالمديرية العامة للتربية والتعليم بمحافظة...',
    directorateLabelAr: 'المديرية العامة للتربية:',
    directoratePlaceholderAr: 'المديرية العامة للتربية والتعليم بمحافظة مسقط',
    officeLabelAr: 'الدائرة التعليمية:',
    officePlaceholderAr: 'دائرة الإشراف التربوي وتطوير الأداء',
    regionLabelAr: 'المحافظة:',
    regionPlaceholderAr: 'محافظة مسقط / محافظة ظفار / شمال الباطنة',
    cityPlaceholderAr: 'مسقط / صلالة / صحار / نزوى',
    districtPlaceholderAr: 'السيب / مطرح / بوشر / روي',
    postalCodePlaceholder: '100',
    phoneExample: '+968 9123 4567',
    defaultWeekendDays: [5, 6],
    officialHolidays: [
      {
        id: 'hol-om-national-day',
        nameAr: 'العيد الوطني العماني المجيد (56)',
        nameEn: 'Oman National Day',
        startDate: '2026-11-18',
        endDate: '2026-11-19',
        type: 'national',
        notes: 'عطلة رسمية لكافة المدارس والمؤسسات الحكومية والخاصة.',
      },
      {
        id: 'hol-om-accession',
        nameAr: 'يوم تولي السلطان مقاليد الحكم',
        nameEn: 'Sultan Accession Day',
        startDate: '2027-01-11',
        endDate: '2027-01-11',
        type: 'national',
        notes: 'إجازة رسمية لكافة العاملين بالدولة والمدارس.',
      },
      {
        id: 'hol-om-eid-fitr',
        nameAr: 'إجازة عيد الفطر السعيد',
        nameEn: 'Eid Al-Fitr Holiday',
        startDate: '2027-03-20',
        endDate: '2027-03-24',
        type: 'religious',
        notes: 'عطلة عيد الفطر المبارك.',
      },
      {
        id: 'hol-om-eid-adha',
        nameAr: 'إجازة عيد الأضحى المبارك',
        nameEn: 'Eid Al-Adha Holiday',
        startDate: '2027-05-26',
        endDate: '2027-05-30',
        type: 'religious',
        notes: 'عطلة عيد الأضحى المبارك.',
      },
    ],
  },

  // 7. مملكة البحرين
  'البحرين': {
    countryNameAr: 'مملكة البحرين',
    countryNameEn: 'Bahrain',
    callingCode: '+973',
    flag: '🇧🇭',
    ministryHeaderAr: 'مملكة البحرين\nوزارة التربية والتعليم\nقطاع التعليم والمناهج...',
    directorateLabelAr: 'إدارة التعليم:',
    directoratePlaceholderAr: 'إدارة التعليم الثانوي والابتدائي',
    officeLabelAr: 'المكتب / المنطقة:',
    officePlaceholderAr: 'المنطقة التعليمية الوسطى',
    regionLabelAr: 'المحافظة:',
    regionPlaceholderAr: 'محافظة العاصمة / محافظة المحرق / المحافظة الشمالية',
    cityPlaceholderAr: 'المنامة / المحرق / الرفاع / مدينة عيسى',
    districtPlaceholderAr: 'الجفير / السيف / السلمانية',
    postalCodePlaceholder: '316',
    phoneExample: '+973 3912 3456',
    defaultWeekendDays: [5, 6],
    officialHolidays: [
      {
        id: 'hol-bh-national-day',
        nameAr: 'اليوم الوطني لمملكة البحرين',
        nameEn: 'Bahrain National Day',
        startDate: '2026-12-16',
        endDate: '2026-12-17',
        type: 'national',
        notes: 'إجازة رسمية لجميع مدارس ومؤسسات المملكة.',
      },
      {
        id: 'hol-bh-labor',
        nameAr: 'عيد العمال العالمي',
        nameEn: 'Labor Day',
        startDate: '2027-05-01',
        endDate: '2027-05-01',
        type: 'national',
        notes: 'عطلة رسمية لكافة المدارس.',
      },
      {
        id: 'hol-bh-eid-fitr',
        nameAr: 'إجازة عيد الفطر المبارك',
        nameEn: 'Eid Al-Fitr Holiday',
        startDate: '2027-03-20',
        endDate: '2027-03-23',
        type: 'religious',
        notes: 'إجازة عيد الفطر السعيد.',
      },
      {
        id: 'hol-bh-eid-adha',
        nameAr: 'إجازة عيد الأضحى المبارك',
        nameEn: 'Eid Al-Adha Holiday',
        startDate: '2027-05-26',
        endDate: '2027-05-29',
        type: 'religious',
        notes: 'إجازة عيد الأضحى المبارك.',
      },
    ],
  },

  // 8. المملكة الأردنية الهاشمية
  'الأردن': {
    countryNameAr: 'المملكة الأردنية الهاشمية',
    countryNameEn: 'Jordan',
    callingCode: '+962',
    flag: '🇯🇴',
    ministryHeaderAr: 'المملكة الأردنية الهاشمية\nوزارة التربية والتعليم\nمديرية التربية والتعليم لـ...',
    directorateLabelAr: 'مديرية التربية والتعليم:',
    directoratePlaceholderAr: 'مديرية التربية والتعليم للواء الجامعة / قصبة عمان',
    officeLabelAr: 'القسم التعليمي:',
    officePlaceholderAr: 'قسم التعليم العام وشؤون الطلبة',
    regionLabelAr: 'المحافظة:',
    regionPlaceholderAr: 'محافظة العاصمة / محافظة إربد / الزرقاء',
    cityPlaceholderAr: 'عمان / إربد / الزرقاء / العقبة',
    districtPlaceholderAr: 'الجبيهة / الشميساني / تلاع العلي',
    postalCodePlaceholder: '11118',
    phoneExample: '+962 7 9123 4567',
    defaultWeekendDays: [5, 6],
    officialHolidays: [
      {
        id: 'hol-jo-independence',
        nameAr: 'عيد الاستقلال للمملكة الأردنية الهاشمية',
        nameEn: 'Jordan Independence Day',
        startDate: '2027-05-25',
        endDate: '2027-05-25',
        type: 'national',
        notes: 'عطلة وطنية رسمية في عموم المدارس والمؤسسات.',
      },
      {
        id: 'hol-jo-labor',
        nameAr: 'عيد العمال',
        nameEn: 'Labor Day',
        startDate: '2027-05-01',
        endDate: '2027-05-01',
        type: 'national',
        notes: 'إجازة رسمية لجميع قطاعات التعليم والعمل.',
      },
      {
        id: 'hol-jo-winter',
        nameAr: 'عطلة الشتاء المدرسية بين الفصلين',
        nameEn: 'Winter School Vacation',
        startDate: '2027-01-03',
        endDate: '2027-01-18',
        type: 'official',
        notes: 'عطلة نصف العام لمدارس المملكة الأردنية الهاشمية.',
      },
      {
        id: 'hol-jo-eid-fitr',
        nameAr: 'إجازة عيد الفطر المبارك',
        nameEn: 'Eid Al-Fitr Holiday',
        startDate: '2027-03-20',
        endDate: '2027-03-23',
        type: 'religious',
        notes: 'عطلة عيد الفطر المبارك.',
      },
      {
        id: 'hol-jo-eid-adha',
        nameAr: 'إجازة عيد الأضحى المبارك',
        nameEn: 'Eid Al-Adha Holiday',
        startDate: '2027-05-26',
        endDate: '2027-05-29',
        type: 'religious',
        notes: 'عطلة عيد الأضحى المبارك.',
      },
    ],
  },

  // 9. المملكة المغربية
  'المغرب': {
    countryNameAr: 'المملكة المغربية',
    countryNameEn: 'Morocco',
    callingCode: '+212',
    flag: '🇲🇦',
    ministryHeaderAr: 'المملكة المغربية\nوزارة التربية الوطنية والتعليم الأولي والرياضة\nالأكاديمية الجهوية للتربية والتكوين بجهة...',
    directorateLabelAr: 'الأكاديمية الجهوية:',
    directoratePlaceholderAr: 'الأكاديمية الجهوية للتربية والتكوين لجهة الدار البيضاء - سطات',
    officeLabelAr: 'المديرية الإقليمية:',
    officePlaceholderAr: 'المديرية الإقليمية بالدار البيضاء أنفا',
    regionLabelAr: 'الجهة / العمالة:',
    regionPlaceholderAr: 'جهة الدار البيضاء - سطات / جهة الرباط - سلا - القنيطرة',
    cityPlaceholderAr: 'الدار البيضاء / الرباط / مراكش / طنجة / فاس',
    districtPlaceholderAr: 'حي المعاريف / أكدال / كليز',
    postalCodePlaceholder: '20000',
    phoneExample: '+212 612 345678',
    defaultWeekendDays: [5, 6],
    officialHolidays: [
      {
        id: 'hol-ma-green-march',
        nameAr: 'ذكرى المسيرة الخضراء المظفرة',
        nameEn: 'Green March Anniversary',
        startDate: '2026-11-06',
        endDate: '2026-11-06',
        type: 'national',
        notes: 'عطلة وطنية رسمية في عموم المدارس والمؤسسات.',
      },
      {
        id: 'hol-ma-independence',
        nameAr: 'عيد الاستقلال المجيد',
        nameEn: 'Morocco Independence Day',
        startDate: '2026-11-18',
        endDate: '2026-11-18',
        type: 'national',
        notes: 'إجازة وطنية لكافة المدارس المغربية.',
      },
      {
        id: 'hol-ma-proclamation',
        nameAr: 'ذكرى تقديم وثيقة الاستقلال',
        nameEn: 'Proclamation of Independence',
        startDate: '2027-01-11',
        endDate: '2027-01-11',
        type: 'national',
        notes: 'عطلة رسمية بمناسبة تقديم وثيقة الاستقلال.',
      },
      {
        id: 'hol-ma-mid-year',
        nameAr: 'عطلة منتصف السنة الدراسية',
        nameEn: 'Mid-Year School Vacation',
        startDate: '2027-01-24',
        endDate: '2027-01-31',
        type: 'official',
        notes: 'عطلة الفاصل بين الأسدوس الأول والأسدوس الثاني.',
      },
      {
        id: 'hol-ma-eid-fitr',
        nameAr: 'عيد الفطر السعيد',
        nameEn: 'Eid Al-Fitr Holiday',
        startDate: '2027-03-20',
        endDate: '2027-03-23',
        type: 'religious',
        notes: 'عطلة عيد الفطر المبارك.',
      },
      {
        id: 'hol-ma-labor',
        nameAr: 'عيد الشغل (عيد العمال)',
        nameEn: 'Labor Day',
        startDate: '2027-05-01',
        endDate: '2027-05-01',
        type: 'national',
        notes: 'عطلة رسمية مؤدى عنها لكافة الأطر والمدارس.',
      },
      {
        id: 'hol-ma-eid-adha',
        nameAr: 'عيد الأضحى المبارك',
        nameEn: 'Eid Al-Adha Holiday',
        startDate: '2027-05-26',
        endDate: '2027-05-29',
        type: 'religious',
        notes: 'عطلة عيد الأضحى المبارك.',
      },
    ],
  },
};

/**
 * Intelligent helper that extracts or synthesizes a country preset for any given country name or calling code.
 */
export function getCountryPreset(countryNameOrCode?: string): CountryPreset {
  if (!countryNameOrCode) {
    return COUNTRY_PRESETS['المملكة العربية السعودية'];
  }

  const normalized = countryNameOrCode.trim().toLowerCase();

  // 1. Direct match in dictionary keys
  for (const [key, preset] of Object.entries(COUNTRY_PRESETS)) {
    if (
      normalized.includes(key.toLowerCase()) ||
      preset.countryNameAr.toLowerCase().includes(normalized) ||
      preset.countryNameEn.toLowerCase().includes(normalized) ||
      preset.callingCode === countryNameOrCode.trim()
    ) {
      return preset;
    }
  }

  // 2. Generic international fallback
  const isWeekendSatSun =
    normalized.includes('united arab emirates') ||
    normalized.includes('إمارات') ||
    normalized.includes('united states') ||
    normalized.includes('أمريكا') ||
    normalized.includes('بريطانيا') ||
    normalized.includes('فرنسا') ||
    normalized.includes('ألمانيا') ||
    normalized.includes('تركيا');

  return {
    countryNameAr: countryNameOrCode.trim(),
    countryNameEn: countryNameOrCode.trim(),
    callingCode: countryNameOrCode.startsWith('+') ? countryNameOrCode.trim() : '+966',
    flag: '🌐',
    ministryHeaderAr: `${countryNameOrCode.trim()}\nوزارة التعليم والتربية\nالجهة التعليمية الرسمية...`,
    directorateLabelAr: 'المديرية / المنطقة التعليمية:',
    directoratePlaceholderAr: 'المديرية العامة للتعليم',
    officeLabelAr: 'المكتب / الإدارة التعليمية:',
    officePlaceholderAr: 'الإدارة التعليمية التابع لها',
    regionLabelAr: 'المنطقة / المحافظة / الولاية:',
    regionPlaceholderAr: 'اسم المقاطعة / المحافظة / المنطقة',
    cityPlaceholderAr: 'اسم المدينة الرئيسية',
    districtPlaceholderAr: 'اسم الحي / المنطقة السكنية',
    postalCodePlaceholder: '00000',
    phoneExample: '+1 234 567 8900',
    defaultWeekendDays: isWeekendSatSun ? [6, 0] : [5, 6],
    officialHolidays: [
      {
        id: `hol-${Date.now()}-1`,
        nameAr: `اليوم الوطني لـ ${countryNameOrCode.trim()}`,
        nameEn: 'National Day',
        startDate: '2026-10-01',
        endDate: '2026-10-01',
        type: 'national',
        notes: 'إجازة وطنية رسمية لكافة المدارس.',
      },
      {
        id: `hol-${Date.now()}-2`,
        nameAr: 'إجازة منتصف العام الدراسي',
        nameEn: 'Mid-Year School Vacation',
        startDate: '2027-01-15',
        endDate: '2027-01-25',
        type: 'official',
        notes: 'عطلة منتصف العام لجميع المدارس.',
      },
    ],
  };
}
