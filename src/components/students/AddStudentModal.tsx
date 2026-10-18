import React, { useRef, useState } from 'react';
import { Student, SchoolClassSummary } from '../../types/attendance';
import { UserPlus, X, Check } from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStudent: (student: Omit<Student, 'id' | 'tenantId' | 'attendanceRate' | 'totalAbsences' | 'totalLates'>) => void;
  classesStats: SchoolClassSummary[];
  educationalGrades?: string[];
  lang: 'ar' | 'en';
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  onAddStudent,
  classesStats,
  educationalGrades,
  lang,
}) => {
  const isAr = lang === 'ar';
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalAccessibility({ isOpen, onClose, containerRef: dialogRef });
  const { schoolProfile } = useAttendance();
  const dialCode = schoolProfile?.countryCallingCode || schoolProfile?.address?.countryCallingCode || '+966';

  const availableGrades = React.useMemo(() => {
    if (educationalGrades && educationalGrades.length > 0) {
      return educationalGrades;
    }
    const fromStats = Array.from(new Set(classesStats.map((c) => c.grade).filter(Boolean)));
    if (fromStats.length > 0) return fromStats;
    return ['الصف العاشر', 'الصف الحادي عشر', 'الصف الثاني عشر'];
  }, [educationalGrades, classesStats]);

  const [fullName, setFullName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [grade, setGrade] = useState(availableGrades[0] || 'الصف العاشر');
  const [className, setClassName] = useState(classesStats[0]?.className || '');
  const [customClass, setCustomClass] = useState('');
  const [useCustomClass, setUseCustomClass] = useState(false);
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState(dialCode);
  const [guardianRelationship, setGuardianRelationship] = useState('الأب');
  const [bloodType, setBloodType] = useState('O+');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !nationalId.trim() || !studentNumber.trim()) {
      setError(isAr ? 'يرجى استكمال الحقول الإلزامية المطلوبة' : 'Please complete required fields');
      return;
    }

    if (nationalId.trim().length !== 10) {
      setError(isAr ? 'السجل المدني يجب أن يتكون من 10 أرقام' : 'National ID must be 10 digits');
      return;
    }

    const finalClassName = useCustomClass ? customClass.trim() : className;
    if (!finalClassName) {
      setError(isAr ? 'يرجى تحديد الفصل الدراسي' : 'Please specify a class');
      return;
    }

    const classId = `class-${finalClassName.replace(/[^a-zA-Z0-9]/g, '')}`;

    onAddStudent({
      fullName: fullName.trim(),
      nationalId: nationalId.trim(),
      studentNumber: studentNumber.trim(),
      grade,
      className: finalClassName,
      classId,
      guardianName: guardianName.trim() || (isAr ? 'ولي أمر الطالب' : 'Guardian'),
      guardianPhone: guardianPhone.trim(),
      guardianRelationship,
      bloodType,
      enrollmentStatus: 'active',
    });

    onClose();
  };

  return (
    <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Add student" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isAr ? 'إضافة قيد طالب جديد فردي' : 'Add New Enrolled Student'}
              </h3>
              <p className="text-xs text-slate-500">
                {isAr ? 'تسجيل طالب مباشرة في السجلات المدرسية دون الحاجة لإعادة رفع القوائم' : 'Register a single student directly'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">{isAr ? 'اسم الطالب رباعي *' : 'Full Name *'}</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={isAr ? 'مثال: عبد العزيز بن ناصر العتيبي' : 'e.g. Abdulaziz Nasser'}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">{isAr ? 'السجل المدني (10 أرقام) *' : 'National ID *'}</label>
              <input
                type="text"
                required
                maxLength={10}
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))}
                placeholder="10XXXXXXXX"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono text-xs focus:bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">{isAr ? 'الرقم المدرسي / الأكاديمي *' : 'Student No. *'}</label>
              <input
                type="text"
                required
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                placeholder="2026XXXX"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono text-xs focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">{isAr ? 'المرحلة الدراسية' : 'Grade'}</label>
              <select
                value={grade}
                onChange={(e) => {
                  const newG = e.target.value;
                  setGrade(newG);
                  const matchingClass = classesStats.find((c) => c.grade === newG);
                  if (matchingClass) {
                    setClassName(matchingClass.className);
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:bg-white font-medium"
              >
                {availableGrades.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">{isAr ? 'الفصل الدراسي' : 'Class Section'}</label>
              {!useCustomClass ? (
                <div className="flex gap-1.5">
                  <select
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-800 text-xs focus:bg-white"
                  >
                    {classesStats.map((c) => (
                      <option key={c.className} value={c.className}>
                        {c.className} {c.grade ? `(${c.grade})` : ''} ({c.activeStudents} {isAr ? 'طالب' : 'students'})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setUseCustomClass(true)}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold"
                  >
                    {isAr ? 'جديد' : 'New'}
                  </button>
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={customClass}
                    onChange={(e) => setCustomClass(e.target.value)}
                    placeholder={isAr ? 'مثال: 10 / ج' : 'e.g. 10 / C'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setUseCustomClass(false)}
                    className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px]"
                  >
                    {isAr ? 'قائمة' : 'List'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">{isAr ? 'اسم ولي الأمر' : 'Guardian Name'}</label>
              <input
                type="text"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                placeholder={isAr ? 'اسم ولي الأمر' : 'Guardian Name'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 flex items-center justify-between">
                <span>{isAr ? 'جوال ولي الأمر *' : 'Guardian Phone *'}</span>
                <span className="font-mono text-[10px] text-emerald-600 font-normal" dir="ltr">{dialCode}</span>
              </label>
              <input
                type="text"
                required
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                placeholder={`${dialCode}5XXXXXXXX`}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono text-xs focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">{isAr ? 'صلة القرابة' : 'Relationship'}</label>
              <select
                value={guardianRelationship}
                onChange={(e) => setGuardianRelationship(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:bg-white"
              >
                <option value="الأب">{isAr ? 'الأب' : 'Father'}</option>
                <option value="الأم">{isAr ? 'الأم' : 'Mother'}</option>
                <option value="الأخ">{isAr ? 'الأخ' : 'Brother'}</option>
                <option value="ولي أمر">{isAr ? 'ولي أمر / وصي' : 'Legal Guardian'}</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">{isAr ? 'فصيلة الدم' : 'Blood Type'}</label>
              <select
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:bg-white"
              >
                {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bt) => (
                  <option key={bt} value={bt}>{bt}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium text-xs cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isAr ? 'إضافة وتثبيت في السجل' : 'Enroll Student'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
