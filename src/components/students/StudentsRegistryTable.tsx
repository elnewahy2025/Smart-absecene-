import React from 'react';
import { ArrowRightLeft, Award, Calendar, QrCode, RotateCcw, Trash2 } from 'lucide-react';
import type { Student, StudentBehaviourIncident } from '../../types/attendance';

interface StudentsRegistryTableProps {
  lang: 'ar' | 'en';
  students: Student[];
  behaviourIncidents: StudentBehaviourIncident[];
  canDeleteStudents: boolean;
  onOpenAbsence: (student: Student) => void;
  onOpenBehaviour: (student: Student) => void;
  onOpenQR: (student: Student) => void;
  onRestore: (studentId: string) => void;
  onTransfer: (student: Student) => void;
  onDelete: (student: Student) => void;
}

export const StudentsRegistryTable: React.FC<StudentsRegistryTableProps> = ({
  lang,
  students,
  behaviourIncidents,
  canDeleteStudents,
  onOpenAbsence,
  onOpenBehaviour,
  onOpenQR,
  onRestore,
  onTransfer,
  onDelete,
}) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-right text-xs">
        <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
          <tr>
            <th className="py-3 px-4">#</th>
            <th className="py-3 px-4">{lang === 'ar' ? 'اسم الطالب' : 'Student Name'}</th>
            <th className="py-3 px-4">{lang === 'ar' ? 'الرقم المدرسي' : 'Student No'}</th>
            <th className="py-3 px-4">{lang === 'ar' ? 'السجل المدني' : 'National ID'}</th>
            <th className="py-3 px-4">{lang === 'ar' ? 'الفصل الدراسي' : 'Class'}</th>
            <th className="py-3 px-4">{lang === 'ar' ? 'ولي الأمر' : 'Guardian'}</th>
            <th className="py-3 px-4">{lang === 'ar' ? 'هاتف التواصل' : 'Phone'}</th>
            <th className="py-3 px-4">{lang === 'ar' ? 'فصيلة الدم' : 'Blood'}</th>
            <th className="py-3 px-4">{lang === 'ar' ? 'نسبة الحضور' : 'Attendance %'}</th>
            <th className="py-3 px-4 text-center">{lang === 'ar' ? 'السلوك والمواظبة' : 'Behavior'}</th>
            <th className="py-3 px-4 text-center">{lang === 'ar' ? 'بطاقة الـ QR' : 'QR Badge'}</th>
            <th className="py-3 px-4 text-center">{lang === 'ar' ? 'إدارة القيد' : 'Actions'}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {students.length === 0 ? (
            <tr>
              <td colSpan={12} className="text-center py-8 text-slate-500">
                {lang === 'ar' ? 'لا يوجد طلاب مطابقين للتصفية' : 'No students found'}
              </td>
            </tr>
          ) : (
            students.map((s, idx) => {
              const studentIncidents = behaviourIncidents.filter((b) => b.studentId === s.id);
              const pointsSum = studentIncidents.reduce((sum, item) => sum + item.points, 0);
              const isTransferred = s.enrollmentStatus === 'transferred';

              return (
                <tr key={s.id} className={`hover:bg-slate-50 transition-colors ${isTransferred ? 'bg-amber-50/30' : ''}`}>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenAbsence(s)}
                        className="text-start hover:text-primary hover:underline cursor-pointer transition-colors"
                        title={lang === 'ar' ? 'انقر لعرض ملف وسجل غياب الطالب' : 'Click to view absence record'}
                      >
                        {s.fullName}
                      </button>
                      {isTransferred && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-amber-300">
                          {lang === 'ar' ? 'منقول' : 'Transferred'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">{s.studentNumber}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{s.nationalId}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    <div>{s.className}</div>
                    {isTransferred && s.destinationSchool && (
                      <div className="text-[10px] text-amber-800 font-medium truncate max-w-[150px]" title={s.destinationSchool}>
                        ← {s.destinationSchool}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-700">{s.guardianName}</td>
                  <td className="py-3 px-4 font-mono text-slate-600" dir="ltr">{s.guardianPhone}</td>
                  <td className="py-3 px-4">
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-700 font-bold">
                      {s.bloodType || ''}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div
                      className="flex flex-col cursor-pointer group"
                      onClick={() => onOpenAbsence(s)}
                      title={lang === 'ar' ? 'انقر لعرض تفاصيل وسجل الغياب' : 'Click to view absence details'}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded-md text-xs inline-block transition-transform group-hover:scale-105 ${
                            s.attendanceRate >= 95
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : s.attendanceRate >= 85
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-300 font-black'
                          }`}
                        >
                          %{s.attendanceRate}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium font-mono">
                          ({s.totalAbsences} {lang === 'ar' ? 'غياب' : 'abs'})
                        </span>
                      </div>
                      {s.attendanceRate < 85 || s.totalAbsences >= 5 ? (
                        <span className="text-[10px] text-rose-700 font-bold mt-0.5 flex items-center gap-0.5">
                          ⚠️ {lang === 'ar' ? 'بحاجة لتدخل عاجل' : 'Needs Intervention'}
                        </span>
                      ) : s.attendanceRate < 90 || s.totalAbsences >= 3 ? (
                        <span className="text-[10px] text-amber-700 font-medium mt-0.5">
                          ⚡ {lang === 'ar' ? 'إنذار متابعة' : 'Watch list'}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => onOpenBehaviour(s)}
                      className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                      title="عرض وتدوين سجل السلوك والمكافآت"
                    >
                      <Award className="w-3.5 h-3.5 text-indigo-600" />
                      <span>
                        {studentIncidents.length > 0
                          ? `${pointsSum >= 0 ? '+' : ''}${pointsSum} (${studentIncidents.length})`
                          : lang === 'ar' ? 'سجل السلوك' : 'Behavior'}
                      </span>
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => onOpenQR(s)}
                      className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                      title="عرض وتحميل بطاقة الحضور بالـ QR"
                    >
                      <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                      <span>رمز الـ QR</span>
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {isTransferred ? (
                        <>
                          <button
                            onClick={() => onRestore(s.id)}
                            className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                            title="إلغاء إجراء النقل واستعادة قيد الطالب للدوام"
                          >
                            <RotateCcw className="w-3 h-3 text-emerald-700" />
                            <span>{lang === 'ar' ? 'استعادة' : 'Restore'}</span>
                          </button>
                          {canDeleteStudents && (
                          <button
                            onClick={() => onDelete(s)}
                            className="inline-flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                            title="حذف نهائي لسجل الطالب"
                          >
                            <Trash2 className="w-3 h-3 text-red-600" />
                            <span>{lang === 'ar' ? 'حذف' : 'Delete'}</span>
                          </button>
                          )}
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => onTransfer(s)}
                            className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                            title="نقل رسمي لمدرسة أخرى وإخفاؤه من كشوف الحضور"
                          >
                            <ArrowRightLeft className="w-3 h-3 text-amber-700" />
                            <span>{lang === 'ar' ? 'نقل لمدرسة' : 'Transfer'}</span>
                          </button>
                          <button
                            onClick={() => onOpenAbsence(s)}
                            className="inline-flex items-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                            title={lang === 'ar' ? 'استعلام ومتابعة سجل الغياب والتقارير' : 'Absence Inquiry'}
                          >
                            <Calendar className="w-3 h-3 text-primary" />
                            <span>{lang === 'ar' ? 'استعلام' : 'Inquiry'}</span>
                          </button>
                          {canDeleteStudents && (
                          <button
                            onClick={() => onDelete(s)}
                            className="inline-flex items-center p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                            title="حذف سجل الطالب نهائياً"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  </div>
);
