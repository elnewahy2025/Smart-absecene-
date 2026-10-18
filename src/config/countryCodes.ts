export interface CountryInfo {
  nameAr: string;
  nameEn: string;
  code: string; // ISO 3166-1 alpha-2
  dialCode: string; // e.g. "+966"
  flag: string; // Emoji flag
  examplePhone: string;
}

export const COUNTRIES_LIST: CountryInfo[] = [
  // الدول العربية (Arab Countries)
  {
    nameAr: 'المملكة العربية السعودية',
    nameEn: 'Saudi Arabia',
    code: 'SA',
    dialCode: '+966',
    flag: '🇸🇦',
    examplePhone: '50 123 4567',
  },
  {
    nameAr: 'جمهورية مصر العربية',
    nameEn: 'Egypt',
    code: 'EG',
    dialCode: '+20',
    flag: '🇪🇬',
    examplePhone: '10 1234 5678',
  },
  {
    nameAr: 'الإمارات العربية المتحدة',
    nameEn: 'United Arab Emirates',
    code: 'AE',
    dialCode: '+971',
    flag: '🇦🇪',
    examplePhone: '50 123 4567',
  },
  {
    nameAr: 'دولة الكويت',
    nameEn: 'Kuwait',
    code: 'KW',
    dialCode: '+965',
    flag: '🇰🇼',
    examplePhone: '9012 3456',
  },
  {
    nameAr: 'دولة قطر',
    nameEn: 'Qatar',
    code: 'QA',
    dialCode: '+974',
    flag: '🇶🇦',
    examplePhone: '3312 3456',
  },
  {
    nameAr: 'سلطنة عمان',
    nameEn: 'Oman',
    code: 'OM',
    dialCode: '+968',
    flag: '🇴🇲',
    examplePhone: '9123 4567',
  },
  {
    nameAr: 'مملكة البحرين',
    nameEn: 'Bahrain',
    code: 'BH',
    dialCode: '+973',
    flag: '🇧🇭',
    examplePhone: '3912 3456',
  },
  {
    nameAr: 'المملكة الأردنية الهاشمية',
    nameEn: 'Jordan',
    code: 'JO',
    dialCode: '+962',
    flag: '🇯🇴',
    examplePhone: '7 9123 4567',
  },
  {
    nameAr: 'جمهورية العراق',
    nameEn: 'Iraq',
    code: 'IQ',
    dialCode: '+964',
    flag: '🇮🇶',
    examplePhone: '770 123 4567',
  },
  {
    nameAr: 'المملكة المغربية',
    nameEn: 'Morocco',
    code: 'MA',
    dialCode: '+212',
    flag: '🇲🇦',
    examplePhone: '612 345678',
  },
  {
    nameAr: 'الجمهورية الجزائرية الديمقراطية الشعبية',
    nameEn: 'Algeria',
    code: 'DZ',
    dialCode: '+213',
    flag: '🇩🇿',
    examplePhone: '551 234567',
  },
  {
    nameAr: 'الجمهورية التونسية',
    nameEn: 'Tunisia',
    code: 'TN',
    dialCode: '+216',
    flag: '🇹🇳',
    examplePhone: '20 123 456',
  },
  {
    nameAr: 'دولة ليبيا',
    nameEn: 'Libya',
    code: 'LY',
    dialCode: '+218',
    flag: '🇱🇾',
    examplePhone: '91 234 5678',
  },
  {
    nameAr: 'جمهورية السودان',
    nameEn: 'Sudan',
    code: 'SD',
    dialCode: '+249',
    flag: '🇸🇩',
    examplePhone: '91 234 5678',
  },
  {
    nameAr: 'الجمهورية اليمنية',
    nameEn: 'Yemen',
    code: 'YE',
    dialCode: '+967',
    flag: '🇾🇪',
    examplePhone: '771 234 567',
  },
  {
    nameAr: 'الجمهورية اللبنانية',
    nameEn: 'Lebanon',
    code: 'LB',
    dialCode: '+961',
    flag: '🇱🇧',
    examplePhone: '71 123 456',
  },
  {
    nameAr: 'الجمهورية العربية السورية',
    nameEn: 'Syria',
    code: 'SY',
    dialCode: '+963',
    flag: '🇸🇾',
    examplePhone: '944 123 456',
  },
  {
    nameAr: 'دولة فلسطين',
    nameEn: 'Palestine',
    code: 'PS',
    dialCode: '+970',
    flag: '🇵🇸',
    examplePhone: '599 123 456',
  },
  {
    nameAr: 'جمهورية الصومال الفيدرالية',
    nameEn: 'Somalia',
    code: 'SO',
    dialCode: '+252',
    flag: '🇸🇴',
    examplePhone: '61 234 567',
  },
  {
    nameAr: 'الجمهورية الإسلامية الموريتانية',
    nameEn: 'Mauritania',
    code: 'MR',
    dialCode: '+222',
    flag: '🇲🇷',
    examplePhone: '22 12 34 56',
  },
  {
    nameAr: 'جمهورية جيبوتي',
    nameEn: 'Djibouti',
    code: 'DJ',
    dialCode: '+253',
    flag: '🇩🇯',
    examplePhone: '77 12 34 56',
  },
  {
    nameAr: 'اتحاد جزر القمر',
    nameEn: 'Comoros',
    code: 'KM',
    dialCode: '+269',
    flag: '🇰🇲',
    examplePhone: '321 23 45',
  },

  // دول عالمية شائعة (Global & International)
  {
    nameAr: 'المملكة المتحدة',
    nameEn: 'United Kingdom',
    code: 'GB',
    dialCode: '+44',
    flag: '🇬🇧',
    examplePhone: '7911 123456',
  },
  {
    nameAr: 'الولايات المتحدة الأمريكية',
    nameEn: 'United States',
    code: 'US',
    dialCode: '+1',
    flag: '🇺🇸',
    examplePhone: '202 555 0123',
  },
  {
    nameAr: 'كندا',
    nameEn: 'Canada',
    code: 'CA',
    dialCode: '+1',
    flag: '🇨🇦',
    examplePhone: '416 555 0123',
  },
  {
    nameAr: 'تركيا',
    nameEn: 'Turkey',
    code: 'TR',
    dialCode: '+90',
    flag: '🇹🇷',
    examplePhone: '532 123 4567',
  },
  {
    nameAr: 'ماليزيا',
    nameEn: 'Malaysia',
    code: 'MY',
    dialCode: '+60',
    flag: '🇲🇾',
    examplePhone: '12 345 6789',
  },
  {
    nameAr: 'إندونيسيا',
    nameEn: 'Indonesia',
    code: 'ID',
    dialCode: '+62',
    flag: '🇮🇩',
    examplePhone: '812 3456 7890',
  },
  {
    nameAr: 'باكستان',
    nameEn: 'Pakistan',
    code: 'PK',
    dialCode: '+92',
    flag: '🇵🇰',
    examplePhone: '300 1234567',
  },
  {
    nameAr: 'الهند',
    nameEn: 'India',
    code: 'IN',
    dialCode: '+91',
    flag: '🇮🇳',
    examplePhone: '98765 43210',
  },
  {
    nameAr: 'فرنسا',
    nameEn: 'France',
    code: 'FR',
    dialCode: '+33',
    flag: '🇫🇷',
    examplePhone: '6 12 34 56 78',
  },
  {
    nameAr: 'ألمانيا',
    nameEn: 'Germany',
    code: 'DE',
    dialCode: '+49',
    flag: '🇩🇪',
    examplePhone: '151 12345678',
  },
  {
    nameAr: 'أستراليا',
    nameEn: 'Australia',
    code: 'AU',
    dialCode: '+61',
    flag: '🇦🇺',
    examplePhone: '412 345 678',
  },
];

/**
 * Clean & normalize a phone dial code (e.g., '966' -> '+966', '+ 966' -> '+966')
 */
export function cleanDialCode(val: string): string {
  if (!val) return '+966';
  const digitsOnly = val.replace(/[^\d]/g, '');
  if (!digitsOnly) return '+966';
  return `+${digitsOnly}`;
}

/**
 * Find country info by name (supports Arabic, English, partial matching, or code)
 */
export function findCountryByName(query: string): CountryInfo | undefined {
  if (!query || !query.trim()) return undefined;
  const q = query.trim().toLowerCase();

  // 1. Exact match on code (e.g. 'SA', 'EG')
  const byCode = COUNTRIES_LIST.find((c) => c.code.toLowerCase() === q);
  if (byCode) return byCode;

  // 2. Exact match on dialCode (e.g. '+966')
  const byDial = COUNTRIES_LIST.find((c) => c.dialCode === q || c.dialCode.replace('+', '') === q);
  if (byDial) return byDial;

  // 3. Exact match on Arabic or English name
  const exact = COUNTRIES_LIST.find(
    (c) => c.nameAr.toLowerCase() === q || c.nameEn.toLowerCase() === q
  );
  if (exact) return exact;

  // 4. Normalized match (remove 'المملكة', 'جمهورية', 'دولة', 'ال')
  const normalizeAr = (s: string) =>
    s
      .replace(/^(المملكة|جمهورية|دولة|سلطنة|اتحاد)\s+/g, '')
      .replace(/^ال/g, '')
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .trim()
      .toLowerCase();

  const qNorm = normalizeAr(query);
  const byNorm = COUNTRIES_LIST.find((c) => {
    const arNorm = normalizeAr(c.nameAr);
    return arNorm.includes(qNorm) || qNorm.includes(arNorm);
  });
  if (byNorm) return byNorm;

  // 5. English partial match
  const byEnPartial = COUNTRIES_LIST.find((c) => c.nameEn.toLowerCase().includes(q));
  if (byEnPartial) return byEnPartial;

  return undefined;
}

/**
 * Get the calling code for a country, or fallback
 */
export function getCallingCodeForCountry(countryName: string, fallback = '+966'): string {
  const match = findCountryByName(countryName);
  return match ? match.dialCode : fallback;
}
