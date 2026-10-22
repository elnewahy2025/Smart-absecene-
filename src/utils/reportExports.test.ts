// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Student } from '../types/attendance';
import { buildCsvReport, buildExcelReportHtml, downloadReportFile } from './reportExports';

const student = (overrides: Partial<Student> = {}): Student => ({
  id: 's1',
  tenantId: 'school-1',
  studentNumber: '1001',
  nationalId: '1234567890',
  fullName: 'أحمد محمد',
  grade: 'الصف الأول',
  className: '1/أ',
  classId: 'c1',
  guardianName: 'محمد علي',
  guardianPhone: '0555000000',
  guardianRelationship: 'أب',
  totalAbsences: 0,
  totalLates: 0,
  attendanceRate: 100,
  ...overrides,
});

const tenant = {
  name: 'مدرسة النور',
  academicYear: '1447',
  currentTerm: 'الفصل الأول',
} as const;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('buildCsvReport', () => {
  it('starts with a UTF-8 BOM and the Arabic header row', () => {
    const csv = buildCsvReport([]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const header = csv.slice(1).split('\n')[0];
    expect(header).toBe(
      'الرقم المدرسي,اسم الطالب,السجل المدني,المرحلة,الفصل,إجمالي الغياب,إجمالي التأخر,نسبة الحضور %,مستوى الخطورة,ولي الأمر,هاتف ولي الأمر,فصيلة الدم'
    );
  });

  it('keeps the incoming order and quotes text fields', () => {
    const csv = buildCsvReport([
      student({ id: 'a', studentNumber: '1', totalAbsences: 9, attendanceRate: 70 }),
      student({ id: 'b', studentNumber: '2', totalAbsences: 1, attendanceRate: 95 }),
    ]);
    const rows = csv.slice(1).split('\n').slice(1);
    expect(rows).toHaveLength(2);
    expect(rows[0].startsWith('"1","أحمد محمد","1234567890","الصف الأول","1/أ",9,0,"70%"')).toBe(true);
    expect(rows[1].startsWith('"2","أحمد محمد"')).toBe(true);
  });

  it('labels risk levels at the 8 and 5 thresholds', () => {
    const csv = buildCsvReport([
      student({ id: 'a', totalAbsences: 8 }),
      student({ id: 'b', totalAbsences: 5 }),
      student({ id: 'c', totalAbsences: 4 }),
    ]);
    const rows = csv.slice(1).split('\n').slice(1);
    expect(rows[0]).toContain('"حرج (8+ أيام)"');
    expect(rows[1]).toContain('"مرتفع (5+ أيام)"');
    expect(rows[2]).toContain('"طبيعي"');
  });

  it('falls back to an empty blood type', () => {
    const csv = buildCsvReport([student()]);
    expect(csv.endsWith('"0555000000",""')).toBe(true);
  });
});

describe('buildExcelReportHtml', () => {
  it('includes the tenant title, academic context and export date', () => {
    const html = buildExcelReportHtml([student()], tenant, '97.5', '2026-10-21');
    expect(html).toContain('مدرسة النور - تقرير الحضور والانضباط المدرسي');
    expect(html).toContain('العام الدراسي: 1447 | الفصل الأول | التاريخ: 2026-10-21');
    expect(html).toContain('<x:DisplayRightToLeft/>');
  });

  it('summarises totals, average rate and warning counts', () => {
    const html = buildExcelReportHtml(
      [
        student({ id: 'a', totalAbsences: 9 }),
        student({ id: 'b', totalAbsences: 5 }),
        student({ id: 'c', totalAbsences: 0 }),
      ],
      tenant,
      '88.3',
      '2026-10-21'
    );
    expect(html).toContain('إجمالي الطلاب: 3');
    expect(html).toContain('متوسط الحضور: 88.3%');
    expect(html).toContain('إنذار 5+ أيام: 2');
    expect(html).toContain('إنذار نهائي 8+ أيام: 1');
  });

  it('sorts rows by absences descending without mutating the input', () => {
    const input = [
      student({ id: 'a', fullName: 'الأول', totalAbsences: 1 }),
      student({ id: 'b', fullName: 'الثاني', totalAbsences: 9 }),
      student({ id: 'c', fullName: 'الثالث', totalAbsences: 5 }),
    ];
    const html = buildExcelReportHtml(input, tenant, '90', '2026-10-21');
    expect(input.map((s) => s.id)).toEqual(['a', 'b', 'c']);
    const rows = (html.match(/<b>(.*?)<\/b>/g) || []).map((row) => row.slice(3, -4));
    expect(rows).toEqual(['الثاني', 'الثالث', 'الأول']);
  });

  it('applies classification text and colour per risk tier', () => {
    const html = buildExcelReportHtml(
      [
        student({ id: 'a', totalAbsences: 9 }),
        student({ id: 'b', totalAbsences: 5 }),
        student({ id: 'c', totalAbsences: 3 }),
        student({ id: 'd', totalAbsences: 1 }),
      ],
      tenant,
      '90',
      '2026-10-21'
    );
    expect(html).toContain('حرج (8+ أيام - إنذار نهائي)');
    expect(html).toContain('مرتفع (5+ أيام - إنذار ثان)');
    expect(html).toContain('تنبيه أولي');
    expect(html).toContain('منضبط');
    expect(html).toContain('color:#dc2626');
    expect(html).toContain('color:#d97706');
    expect(html).toContain('color:#1e293b');
  });

  it('renders the guardian phone left-to-right and the blood type', () => {
    const html = buildExcelReportHtml([student({ bloodType: 'O+' })], tenant, '100', '2026-10-21');
    expect(html).toContain('<td dir="ltr">0555000000</td>');
    expect(html).toContain('<td>O+</td>');
  });
});

describe('downloadReportFile', () => {
  it('creates a temporary link, clicks it and removes it', () => {
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:report');
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true, writable: true });
    let clicked: HTMLAnchorElement | null = null;
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        clicked = this;
      });

    downloadReportFile('content', 'text/csv;charset=utf-8;', 'report.csv');

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('text/csv;charset=utf-8;');
    expect(click).toHaveBeenCalledTimes(1);
    const anchor = clicked as HTMLAnchorElement | null;
    expect(anchor).not.toBeNull();
    expect(anchor!.getAttribute('href')).toBe('blob:report');
    expect(anchor!.getAttribute('download')).toBe('report.csv');
    expect(document.body.querySelector('a[download="report.csv"]')).toBeNull();
  });
});
