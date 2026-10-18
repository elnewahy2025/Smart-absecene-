import { describe, it, expect } from 'vitest';
import { getCountryPreset, COUNTRY_PRESETS } from '../config/countryPresets';
import { OfficialHoliday } from '../types/attendance';

describe('Country Presets & Smart Holidays Import Verification', () => {
  it('provides verified preset for Saudi Arabia (المملكة العربية السعودية)', () => {
    const preset = getCountryPreset('المملكة العربية السعودية');
    expect(preset.countryNameAr).toBe('المملكة العربية السعودية');
    expect(preset.callingCode).toBe('+966');
    expect(preset.defaultWeekendDays).toEqual([5, 6]);
    expect(preset.ministryHeaderAr).toContain('وزارة التعليم');
    expect(preset.directoratePlaceholderAr).toContain('الرياض');
    expect(preset.regionLabelAr).toBe('المنطقة الإدارية:');

    // Holidays presence
    expect(preset.officialHolidays.length).toBeGreaterThan(3);
    const nationalDay = preset.officialHolidays.find((h) => h.id === 'hol-sa-national-day');
    expect(nationalDay).toBeDefined();
    expect(nationalDay?.nameAr).toContain('اليوم الوطني');
    expect(nationalDay?.type).toBe('national');
  });

  it('provides verified preset for Egypt (جمهورية مصر العربية)', () => {
    const preset = getCountryPreset('مصر');
    expect(preset.countryNameAr).toBe('جمهورية مصر العربية');
    expect(preset.callingCode).toBe('+20');
    expect(preset.defaultWeekendDays).toEqual([5, 6]);
    expect(preset.ministryHeaderAr).toContain('وزارة التربية والتعليم والتعليم الفني');
    expect(preset.directorateLabelAr).toContain('مديرية التربية والتعليم');
    expect(preset.directoratePlaceholderAr).toContain('القاهرة');
    expect(preset.officeLabelAr).toContain('الإدارة التعليمية');
    expect(preset.regionLabelAr).toBe('المحافظة:');

    // Holidays presence
    const oct6 = preset.officialHolidays.find((h) => h.id === 'hol-eg-6oct');
    expect(oct6).toBeDefined();
    expect(oct6?.nameAr).toContain('6 أكتوبر');
    expect(oct6?.startDate).toBe('2026-10-06');
  });

  it('provides verified preset for UAE (دولة الإمارات العربية المتحدة) with Sat-Sun weekend', () => {
    const preset = getCountryPreset('الإمارات العربية المتحدة');
    expect(preset.countryNameAr).toBe('الإمارات العربية المتحدة');
    expect(preset.callingCode).toBe('+971');
    // UAE weekend is Sat & Sun
    expect(preset.defaultWeekendDays).toEqual([6, 0]);
    expect(preset.ministryHeaderAr).toContain('مؤسسة الإمارات للتعليم المدرسي');
    expect(preset.directoratePlaceholderAr).toContain('دبي');
    expect(preset.regionLabelAr).toBe('الإمارة:');

    const uaeNational = preset.officialHolidays.find((h) => h.id === 'hol-ae-national-day');
    expect(uaeNational).toBeDefined();
    expect(uaeNational?.startDate).toBe('2026-12-02');
  });

  it('provides verified preset for Kuwait, Qatar, Oman, Bahrain, Jordan, and Morocco', () => {
    const countries = ['الكويت', 'قطر', 'سلطنة عمان', 'البحرين', 'الأردن', 'المغرب'];
    for (const c of countries) {
      const preset = getCountryPreset(c);
      expect(preset).toBeDefined();
      expect(preset.callingCode.startsWith('+')).toBe(true);
      expect(preset.defaultWeekendDays.length).toBeGreaterThanOrEqual(1);
      expect(preset.officialHolidays.length).toBeGreaterThan(0);
      expect(preset.ministryHeaderAr.length).toBeGreaterThan(5);
    }
  });

  it('gracefully generates dynamic international preset for any unlisted country', () => {
    const customCountry = 'سنغافورة';
    const preset = getCountryPreset(customCountry);
    expect(preset.countryNameAr).toBe('سنغافورة');
    expect(preset.ministryHeaderAr).toContain('سنغافورة');
    expect(preset.officialHolidays.length).toBeGreaterThan(0);
    expect(preset.defaultWeekendDays).toEqual([5, 6]);
  });

  it('verifies that all holidays conform strictly to OfficialHoliday specifications', () => {
    Object.values(COUNTRY_PRESETS).forEach((preset) => {
      preset.officialHolidays.forEach((h: OfficialHoliday) => {
        expect(h.id).toBeTruthy();
        expect(h.nameAr).toBeTruthy();
        expect(h.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(h.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(h.endDate >= h.startDate).toBe(true);
        expect(['official', 'religious', 'national', 'extended_weekend', 'emergency']).toContain(h.type);
      });
    });
  });

  it('validates that weekendDays arrays only contain day numbers between 0 and 6', () => {
    Object.values(COUNTRY_PRESETS).forEach((preset) => {
      preset.defaultWeekendDays.forEach((dayNum) => {
        expect(dayNum).toBeGreaterThanOrEqual(0);
        expect(dayNum).toBeLessThanOrEqual(6);
      });
    });
  });
});
