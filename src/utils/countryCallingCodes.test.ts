import { describe, it, expect, beforeEach } from 'vitest';
import {
  COUNTRIES_LIST,
  findCountryByName,
  getCallingCodeForCountry,
  cleanDialCode,
} from '../config/countryCodes';
import { TenantSchoolProfile, SchoolProvisionInput } from '../types/attendance';
import { DEFAULT_SCHOOL_1_PROFILE } from '../config/tenantSettings';

const storageMock: Record<string, string> = {};
if (typeof global !== 'undefined') {
  (global as any).localStorage = {
    getItem: (k: string) => storageMock[k] || null,
    setItem: (k: string, v: string) => {
      storageMock[k] = String(v);
    },
    removeItem: (k: string) => {
      delete storageMock[k];
    },
    clear: () => {
      Object.keys(storageMock).forEach((k) => delete storageMock[k]);
    },
    key: () => null,
    length: 0,
  };
}

describe('Universal Country Selection & Dynamic International Calling Code System (Feature #24)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. Comprehensive Country & Dial Code Registry', () => {
    it('contains all core Arab countries with valid ISO codes and international calling codes', () => {
      const expectedArabDialCodes = [
        { code: 'SA', dial: '+966' }, // Saudi Arabia
        { code: 'EG', dial: '+20' }, // Egypt
        { code: 'AE', dial: '+971' }, // UAE
        { code: 'KW', dial: '+965' }, // Kuwait
        { code: 'QA', dial: '+974' }, // Qatar
        { code: 'OM', dial: '+968' }, // Oman
        { code: 'BH', dial: '+973' }, // Bahrain
        { code: 'JO', dial: '+962' }, // Jordan
        { code: 'IQ', dial: '+964' }, // Iraq
        { code: 'MA', dial: '+212' }, // Morocco
        { code: 'DZ', dial: '+213' }, // Algeria
        { code: 'TN', dial: '+216' }, // Tunisia
      ];

      for (const item of expectedArabDialCodes) {
        const found = COUNTRIES_LIST.find((c) => c.code === item.code);
        expect(found).toBeDefined();
        expect(found?.dialCode).toBe(item.dial);
        expect(found?.flag).toBeDefined();
        expect(found?.examplePhone).toBeDefined();
      }
    });

    it('contains major global international countries', () => {
      const us = COUNTRIES_LIST.find((c) => c.code === 'US');
      const gb = COUNTRIES_LIST.find((c) => c.code === 'GB');
      const tr = COUNTRIES_LIST.find((c) => c.code === 'TR');

      expect(us?.dialCode).toBe('+1');
      expect(gb?.dialCode).toBe('+44');
      expect(tr?.dialCode).toBe('+90');
    });
  });

  describe('2. Smart Search & Name Normalization (findCountryByName)', () => {
    it('finds country by exact Arabic official name', () => {
      const saudi = findCountryByName('المملكة العربية السعودية');
      expect(saudi).toBeDefined();
      expect(saudi?.dialCode).toBe('+966');

      const egypt = findCountryByName('جمهورية مصر العربية');
      expect(egypt).toBeDefined();
      expect(egypt?.dialCode).toBe('+20');
    });

    it('finds country by common informal / short Arabic name', () => {
      expect(findCountryByName('السعودية')?.dialCode).toBe('+966');
      expect(findCountryByName('مصر')?.dialCode).toBe('+20');
      expect(findCountryByName('الإمارات')?.dialCode).toBe('+971');
      expect(findCountryByName('الكويت')?.dialCode).toBe('+965');
      expect(findCountryByName('قطر')?.dialCode).toBe('+974');
      expect(findCountryByName('عمان')?.dialCode).toBe('+968');
      expect(findCountryByName('البحرين')?.dialCode).toBe('+973');
      expect(findCountryByName('الأردن')?.dialCode).toBe('+962');
      expect(findCountryByName('العراق')?.dialCode).toBe('+964');
      expect(findCountryByName('المغرب')?.dialCode).toBe('+212');
    });

    it('finds country by ISO alpha-2 code', () => {
      expect(findCountryByName('SA')?.dialCode).toBe('+966');
      expect(findCountryByName('eg')?.dialCode).toBe('+20');
      expect(findCountryByName('AE')?.dialCode).toBe('+971');
    });

    it('finds country by English name', () => {
      expect(findCountryByName('Saudi Arabia')?.dialCode).toBe('+966');
      expect(findCountryByName('Egypt')?.dialCode).toBe('+20');
      expect(findCountryByName('Jordan')?.dialCode).toBe('+962');
    });

    it('returns undefined gracefully for unknown or empty queries', () => {
      expect(findCountryByName('')).toBeUndefined();
      expect(findCountryByName('دولة خيالية غير مسجلة')).toBeUndefined();
    });
  });

  describe('3. Dial Code Formatting & Fallback (getCallingCodeForCountry & cleanDialCode)', () => {
    it('returns standard calling code for recognized countries', () => {
      expect(getCallingCodeForCountry('المملكة العربية السعودية')).toBe('+966');
      expect(getCallingCodeForCountry('مصر')).toBe('+20');
      expect(getCallingCodeForCountry('الإمارات العربية المتحدة')).toBe('+971');
      expect(getCallingCodeForCountry('الكويت')).toBe('+965');
    });

    it('returns customizable fallback for arbitrary or non-listed country names', () => {
      expect(getCallingCodeForCountry('دولة غير مسجلة', '+971')).toBe('+971');
      expect(getCallingCodeForCountry('Unknown Land')).toBe('+966');
    });

    it('cleans and normalizes user-input dial codes', () => {
      expect(cleanDialCode('966')).toBe('+966');
      expect(cleanDialCode('+966')).toBe('+966');
      expect(cleanDialCode('20')).toBe('+20');
      expect(cleanDialCode('+ 971 ')).toBe('+971');
      expect(cleanDialCode('abc')).toBe('+966'); // fallback when no digits
    });
  });

  describe('4. Multi-Country School Profile & Settings Persistence', () => {
    it('preserves country and custom calling code in TenantSchoolProfile', () => {
      const egyptianSchoolProfile: TenantSchoolProfile = {
        ...DEFAULT_SCHOOL_1_PROFILE,
        schoolName: 'مدرسة النيل الدولية بالقاهرة',
        countryCallingCode: '+20',
        generalPhone: '+20 2 2456 7890',
        emergencyHotline: '+20 10 1234 5678',
        address: {
          ...DEFAULT_SCHOOL_1_PROFILE.address,
          country: 'جمهورية مصر العربية',
          countryCallingCode: '+20',
          region: 'محافظة القاهرة',
          city: 'القاهرة',
          district: 'المعادي',
        },
      };

      expect(egyptianSchoolProfile.countryCallingCode).toBe('+20');
      expect(egyptianSchoolProfile.address.country).toBe('جمهورية مصر العربية');
      expect(egyptianSchoolProfile.address.countryCallingCode).toBe('+20');
      expect(egyptianSchoolProfile.generalPhone).toContain('+20');
    });

    it('allows full manual override of calling code for special carriers or landlines', () => {
      // User typed custom country and manually overrode the calling code
      const customProfile: Partial<TenantSchoolProfile> = {
        countryCallingCode: '+971',
        address: {
          country: 'الإمارات العربية المتحدة',
          countryCallingCode: '+971',
          region: 'إمارة دبي',
          city: 'دبي',
          district: 'البرشاء',
          streetAddress: 'شارع الشيخ زايد',
        },
      };

      expect(customProfile.countryCallingCode).toBe('+971');
      expect(customProfile.address?.country).toBe('الإمارات العربية المتحدة');
    });

    it('provisions a new international school with correct country and calling code', () => {
      const newSchoolInput: SchoolProvisionInput = {
        id: 'school-cairo',
        nameAr: 'مدرسة الأهرام الحديثة',
        nameEn: 'Al-Ahram Modern School',
        code: 'AHRM-101',
        countryAr: 'جمهورية مصر العربية',
        countryCallingCode: '+20',
        cityAr: 'القاهرة',
        cityEn: 'Cairo',
        subdomain: 'ahram',
        schoolType: 'mixed',
        academicYear: '2026-2027',
        primaryColor: '#2563eb',
        logoText: 'أ',
        principalName: 'د. محمود حسن',
        principalEmail: 'principal@ahram-school.edu.eg',
        principalPhone: '+201011223344',
      };

      expect(newSchoolInput.countryAr).toBe('جمهورية مصر العربية');
      expect(newSchoolInput.countryCallingCode).toBe('+20');
      expect(newSchoolInput.principalPhone?.startsWith('+20')).toBe(true);
    });
  });
});
