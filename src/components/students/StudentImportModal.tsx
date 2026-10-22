import React, { useEffect, useRef, useState } from 'react';
import {
  Upload,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  FileSpreadsheet,
  ArrowRight,
  Info,
  X,
} from 'lucide-react';
import type { Student, TenantSchoolProfile } from '../../types/attendance';
import type { AttendanceContextType } from '../../context/attendanceContextSupport';
import type { SchoolClassSummary } from '../../types/attendance';

// Sample CSV text with deliberate mix of valid and duplicate rows for testing
import {
  buildStudentImportErrorReport,
  buildStudentImportTemplate,
  parseCsvLine,
  SAMPLE_IMPORT_TEXT,
  validateStudentImportRows,
} from '../../utils/studentImport';
import type { ParsedImportRow } from '../../utils/studentImport';

export { SAMPLE_IMPORT_TEXT } from '../../utils/studentImport';
export type { ParsedImportRow } from '../../utils/studentImport';

export function downloadStudentImportTemplate(
  schoolProfile: TenantSchoolProfile | undefined,
  tenantCode: string
) {
  const csvContent = buildStudentImportTemplate(schoolProfile);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `قالب_استيراد_الطلاب_${tenantCode}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


interface StudentImportModalProps {
  isOpen: boolean;
  lang: 'ar' | 'en';
  students: Student[];
  schoolProfile?: TenantSchoolProfile;
  classesStats: SchoolClassSummary[];
  remainingStudentSeats: number;
  tenantCode: string;
  importStudents: AttendanceContextType['importStudents'];
  prefill?: string;
  onClose: () => void;
}

export const StudentImportModal: React.FC<StudentImportModalProps> = ({
  isOpen,
  lang,
  students,
  schoolProfile,
  classesStats,
  remainingStudentSeats,
  tenantCode,
  importStudents,
  prefill,
  onClose,
}) => {
  // 2-Stage Import modal state
  const [importStage, setImportStage] = useState<1 | 2>(1); // 1 = Input, 2 = Validation Preview
  const [rawCsvText, setRawCsvText] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [validatedRows, setValidatedRows] = useState<ParsedImportRow[]>([]);
  const [previewFilter, setPreviewFilter] = useState<'all' | 'valid' | 'errors'>('all');
  const [importResultSummary, setImportResultSummary] = useState<{ imported: number; duplicates: number } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && prefill) setRawCsvText(prefill);
  }, [isOpen, prefill]);


  const validCount = validatedRows.filter((r) => r.isValid).length;
  const errorCount = validatedRows.filter((r) => !r.isValid).length;
  const settingsViolationCount = validatedRows.filter(
    (r) => !r.isValid && r.errorReason && r.errorReason.includes('صفحة الإعدادات')
  ).length;

  const previewDisplayRows = validatedRows.filter((r) => {
    if (previewFilter === 'valid') return r.isValid;
    if (previewFilter === 'errors') return !r.isValid;
    return true;
  });

  // Download official CSV template with UTF-8 BOM, generated directly from Settings classes
  const handleDownloadTemplate = () => downloadStudentImportTemplate(schoolProfile, tenantCode);

  // Download CSV Error Report for rejected rows
  // Download CSV Error Report for rejected rows
  const handleDownloadErrorReport = () => {
    const csvContent = buildStudentImportErrorReport(validatedRows);
    if (!csvContent) return;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير_أخطاء_استيراد_الطلاب_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle uploaded file via input or drop
  const processUploadedFile = (file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      alert('يرجى اختيار ملف بصيغة CSV (.csv)');
      return;
    }

    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setRawCsvText(text || '');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  // Helper to split CSV line safely handling quoted fields
  // Stage 1 -> Stage 2 Validation parser
  const handleValidateInput = () => {
    if (!rawCsvText.trim()) return;

    setValidatedRows(validateStudentImportRows(rawCsvText, { students, schoolProfile, classesStats }));
    setImportStage(2);
  };

  // Commit valid rows
  const handleCommitImport = async () => {
    const validRows = validatedRows.filter((r) => r.isValid);
    if (isImporting || validRows.length === 0 || validRows.length > remainingStudentSeats) return;

    setIsImporting(true);
    setImportError(null);
    try {
      const res = await importStudents(
        validRows.map((r) => ({
          fullName: r.fullName,
          nationalId: r.nationalId,
          studentNumber: r.studentNumber,
          grade: r.grade,
          className: r.className,
          classId:
            classesStats.find((c) => c.className === r.className)?.classId ||
            `class-${r.className.replace(/[^a-zA-Z0-9]/g, '')}`,
          guardianName: r.guardianName,
          guardianPhone: r.guardianPhone,
          bloodType: r.bloodType,
        }))
      );
      setImportResultSummary(res);
    } catch (error) {
      setImportError(
        error instanceof Error
          ? error.message
          : lang === 'ar'
            ? 'تعذّر استيراد الطلاب. حاول مجدداً.'
            : 'Could not import the students. Please try again.'
      );
    } finally {
      setIsImporting(false);
    }
  };


  const handleCloseModal = () => {
    onClose();
    setImportStage(1);
    setRawCsvText('');
    setUploadedFile(null);
    setValidatedRows([]);
    setImportResultSummary(null);
    setImportError(null);
    setPreviewFilter('all');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>{lang === 'ar' ? 'استيراد قائمة الطلاب عبر ملف CSV' : 'Import Students via CSV'}</span>
            </h3>
            <span className="text-xs text-slate-500">
              المرحلة {importStage} من 2: {importStage === 1 ? 'اختيار أو رفع ملف CSV' : 'المعاينة والفحص قبل الحفظ'}
            </span>
          </div>
          <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STAGE 1: FILE UPLOAD OR TEXT INPUT */}
        {importStage === 1 && (
          <div className="space-y-4 text-xs">
            {/* Guidelines note */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'ar' ? 'تعليمات استيراد ملف CSV:' : 'CSV Guidelines:'}</span>
                </span>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="text-emerald-700 hover:text-emerald-900 font-bold underline flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'تنزيل ملف القالب النموذجي' : 'Download Sample CSV'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                يجب أن يحتوي الملف على الأعمدة التالية (الرقم المدرسي، السجل المدني، اسم الطالب، المرحلة، الفصل، ولي الأمر، الهاتف). يدعم النظام ترميز UTF-8 واللغة العربية تلقائياً.
              </p>
            </div>

            {/* Drag-and-drop file upload box */}
            <div>
              <label className="font-semibold text-slate-800 block mb-1.5">
                {lang === 'ar' ? 'اختر أو اسحب ملف CSV من جهازك:' : 'Select or drag CSV file:'}
              </label>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors cursor-pointer ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : uploadedFile
                    ? 'border-emerald-400 bg-emerald-50/20'
                    : 'border-slate-300 bg-slate-50 hover:bg-slate-100/70 hover:border-slate-400'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {uploadedFile ? (
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{uploadedFile.name}</div>
                      <div className="text-slate-500 text-[11px]">
                        حجم الملف: {(uploadedFile.size / 1024).toFixed(1)} كيلوبايت · جاهز للتحقق
                      </div>
                    </div>
                    <div className="pt-1 flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedFile(null);
                          setRawCsvText('');
                        }}
                        className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold"
                      >
                        إلغاء واختيار ملف آخر
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                    <div>
                      <span className="font-bold text-slate-800 block">
                        اسحب وأفلت ملف CSV هنا، أو انقر للتصفح
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        الملفات المدعومة: CSV (.csv) بترميز UTF-8
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Or paste CSV text directly */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-800">
                  {lang === 'ar' ? 'أو الصق محتوى CSV مباشرةً:' : 'Or paste CSV data directly:'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setUploadedFile(null);
                    setRawCsvText(SAMPLE_IMPORT_TEXT);
                  }}
                  className="text-emerald-700 hover:text-emerald-900 font-bold underline"
                >
                  {lang === 'ar' ? 'تجربة عينة طلاب نموذجية' : 'Load Demo Sample'}
                </button>
              </div>
              <textarea
                rows={5}
                value={rawCsvText}
                onChange={(e) => {
                  setRawCsvText(e.target.value);
                  if (uploadedFile) setUploadedFile(null);
                }}
                placeholder="الرقم المدرسي,السجل المدني,اسم الطالب,المرحلة,الفصل,ولي الأمر,الهاتف..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleValidateInput}
                disabled={!rawCsvText.trim()}
                className="flex items-center gap-1.5 px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
              >
                <span>{lang === 'ar' ? 'الانتقال للمعاينة والتحقق الآلي' : 'Validate & Preview'}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
        )}

        {/* STAGE 2: VALIDATION PREVIEW */}
        {importStage === 2 && (
          <div className="space-y-4 text-xs">
            {importResultSummary ? (
              <div className="bg-emerald-50 border border-emerald-300 p-5 rounded-xl text-center space-y-2.5">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-900 text-base">
                  {lang === 'ar' ? 'تم استيراد واعتماد قائمة الطلاب بنجاح!' : 'Import Completed Successfully!'}
                </h4>
                <p className="text-emerald-800 text-xs max-w-md mx-auto leading-relaxed">
                  نجح استيراد وتأسيس <strong>{importResultSummary.imported}</strong> طالب جديد في كشوف المدرسة، وتم استبعاد <strong>{importResultSummary.duplicates}</strong> سجل مكرر لحماية سلامة قاعدة البيانات.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleCloseModal}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2 rounded-lg font-bold cursor-pointer shadow-xs"
                  >
                    {lang === 'ar' ? 'إغلاق والعودة لسجل الطلاب' : 'Done'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Settings Violation Warning Banner */}
                {settingsViolationCount > 0 && (
                  <div className="bg-rose-50 border-2 border-rose-300 p-3.5 rounded-xl text-rose-950 flex items-start gap-3 shadow-2xs">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h5 className="font-bold text-xs text-rose-900">
                        {lang === 'ar'
                          ? `⚠️ تحذير نظامي: تم رفض (${settingsViolationCount}) سجلات لمخالفتها البيانات المعتمدة في صفحة الإعدادات`
                          : `⚠️ Regulatory Alert: (${settingsViolationCount}) rows rejected due to Settings mismatch`}
                      </h5>
                      <p className="text-[11px] text-rose-800 leading-relaxed">
                        {lang === 'ar'
                          ? 'طبقاً للائحة الحوكمة المدرسية، يُمنع منعاً باتاً استيراد أي طالب بفصل أو مرحلة دراسية غير معتمدة في صفحة إعدادات المدرسة. تم استبعاد السجلات المخالفة تلقائياً ولن يتم اعتماد سوى السجلات المتوافقة تماماً.'
                          : 'Per governance rules, student records with unapproved classes or grades in School Settings are strictly rejected.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Validation Summary Cards */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                    <span className="text-[11px] text-slate-500 block">إجمالي الصفوف المفحوصة</span>
                    <span className="text-lg font-bold text-slate-900">{validatedRows.length}</span>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-center">
                    <span className="text-[11px] text-emerald-700 block font-semibold">جاهز للحفظ (صالح)</span>
                    <span className="text-lg font-bold text-emerald-800">{validCount}</span>
                  </div>
                  <div className="bg-rose-50 p-3 rounded-lg border border-rose-200 text-center">
                    <span className="text-[11px] text-rose-700 block font-semibold">أخطاء أو مكرر (مستبعد)</span>
                    <span className="text-lg font-bold text-rose-800">{errorCount}</span>
                  </div>
                </div>

                {/* Filter tabs and error report download */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 text-[11px]">عرض:</span>
                    <button
                      type="button"
                      onClick={() => setPreviewFilter('all')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                        previewFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      الكل ({validatedRows.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewFilter('valid')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                        previewFilter === 'valid' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      الصالحة فقط ({validCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewFilter('errors')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                        previewFilter === 'errors' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      المستبعدة ({errorCount})
                    </button>
                  </div>

                  {errorCount > 0 && (
                    <button
                      type="button"
                      onClick={handleDownloadErrorReport}
                      className="flex items-center gap-1 text-rose-700 hover:text-rose-900 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تنزيل تقرير الأخطاء CSV</span>
                    </button>
                  )}
                </div>

                {/* Preview Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">الصف</th>
                        <th className="py-2.5 px-3">اسم الطالب</th>
                        <th className="py-2.5 px-3">الرقم المدرسي</th>
                        <th className="py-2.5 px-3">السجل المدني</th>
                        <th className="py-2.5 px-3">الفصل</th>
                        <th className="py-2.5 px-3">نتيجة التحقق</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewDisplayRows.map((row) => (
                        <tr
                          key={row.rowNumber}
                          className={row.isValid ? 'bg-white' : 'bg-rose-50/60'}
                        >
                          <td className="py-2 px-3 font-mono text-slate-400">{row.rowNumber}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">{row.fullName}</td>
                          <td className="py-2 px-3 font-mono text-slate-600">{row.studentNumber || '---'}</td>
                          <td className="py-2 px-3 font-mono text-slate-600">{row.nationalId || '---'}</td>
                          <td className="py-2 px-3 text-slate-700">{row.className}</td>
                          <td className="py-2 px-3">
                            {row.isValid ? (
                              <span className="text-emerald-700 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>جاهز للحفظ</span>
                              </span>
                            ) : (
                              <span className="text-rose-700 font-semibold flex items-center gap-1" title={row.errorReason}>
                                <XCircle className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate max-w-[200px]">{row.errorReason}</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {validCount > remainingStudentSeats && (
                  <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-300">
                    {lang === 'ar'
                      ? `عدد الطلاب الصالحين (${validCount}) يتجاوز المقاعد المتبقية (${remainingStudentSeats}).`
                      : `The ${validCount} valid students exceed the remaining ${remainingStudentSeats} seat(s).`}
                  </p>
                )}

                {importError && (
                  <p className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
                    {importError}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setImportStage(1)}
                    className="px-3.5 py-2 text-xs border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    {lang === 'ar' ? 'رجوع لتعديل الملف' : 'Back'}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-3.5 py-2 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                      {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCommitImport}
                      disabled={isImporting || validCount === 0 || validCount > remainingStudentSeats}
                      className="px-5 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold cursor-pointer shadow-xs"
                    >
                      {isImporting
                        ? lang === 'ar'
                          ? 'جارٍ الاستيراد...'
                          : 'Importing...'
                        : lang === 'ar'
                          ? `اعتماد وحفظ (${validCount}) طلاب صالحين`
                          : `Commit (${validCount}) Valid Students`}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
