import React, { useState } from 'react';
import { SchoolClassConfig } from '../../types/attendance';
import { GraduationCap, Plus, Trash2, Edit2, Check, X, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';

interface Props {
  educationalGrades: string[];
  classes?: SchoolClassConfig[];
  onChange: (grades: string[]) => void;
  onAutoSave?: (grades: string[]) => Promise<void> | void;
  disabled?: boolean;
}

const COMMON_SUGGESTIONS = [
  'الصف الأول الابتدائي',
  'الصف الثاني الابتدائي',
  'الصف الثالث الابتدائي',
  'الصف الرابع الابتدائي',
  'الصف الخامس الابتدائي',
  'الصف السادس',
  'الصف السابع',
  'الصف الثامن',
  'الصف التاسع',
  'الصف العاشر',
  'الصف الحادي عشر',
  'الصف الثاني عشر',
];

export const GradeLevelsCard: React.FC<Props> = ({
  educationalGrades = [],
  classes = [],
  onChange,
  onAutoSave,
  disabled,
}) => {
  const { lang } = useAttendance();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editNameInput, setEditNameInput] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // New grade state
  const [isAdding, setIsAdding] = useState(false);
  const [newGradeName, setNewGradeName] = useState('');

  const triggerAutoSave = async (updatedGrades: string[], msg?: string) => {
    onChange(updatedGrades);
    if (onAutoSave) {
      try {
        setIsSaving(true);
        await onAutoSave(updatedGrades);
      } finally {
        setIsSaving(false);
      }
    }
    if (msg) {
      setFeedbackMsg(msg);
      setErrorMsg(null);
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };

  const handleAddGrade = async (gradeToAdd?: string) => {
    const targetName = (gradeToAdd || newGradeName).trim();
    if (!targetName || isSaving) return;

    if (educationalGrades.includes(targetName)) {
      setErrorMsg(lang === 'ar' ? `المرحلة الدراسية (${targetName}) مضافة مسبقاً.` : `The grade level (${targetName}) has already been added.`);
      setTimeout(() => setErrorMsg(null), 3500);
      return;
    }

    const updated = [...educationalGrades, targetName];
    setNewGradeName('');
    setIsAdding(false);
    await triggerAutoSave(updated, lang === 'ar' ? `تمت إضافة المرحلة الدراسية (${targetName}) وحفظها بنجاح ✓` : `Grade level (${targetName}) was added and saved successfully ✓`);
  };

  const startEdit = (index: number, currentName: string) => {
    setEditingIndex(index);
    setEditNameInput(currentName);
  };

  const saveEdit = async (index: number) => {
    const trimmed = editNameInput.trim();
    if (!trimmed || isSaving) return;

    const oldName = educationalGrades[index];
    if (trimmed !== oldName && educationalGrades.includes(trimmed)) {
      setErrorMsg(lang === 'ar' ? `المرحلة الدراسية (${trimmed}) موجودة بالفعل.` : `The grade level (${trimmed}) already exists.`);
      setTimeout(() => setErrorMsg(null), 3500);
      return;
    }

    const updated = [...educationalGrades];
    updated[index] = trimmed;
    setEditingIndex(null);
    await triggerAutoSave(updated, lang === 'ar' ? `تم تعديل المرحلة (${oldName} ← ${trimmed}) وحفظها بنجاح ✓` : `Grade level updated (${oldName} ← ${trimmed}) and saved successfully ✓`);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
  };

  const handleDelete = async (gradeName: string) => {
    if (disabled || isSaving) return;

    // Check if any existing classes are bound to this grade
    const boundClasses = classes.filter((c) => c.grade === gradeName);
    if (boundClasses.length > 0) {
      const confirmDelete = window.confirm(
        lang === 'ar'
          ? `تنبيه: يوجد (${boundClasses.length}) فصول مرتبطة بهذه المرحلة (${boundClasses.map((c) => c.name).join(', ')}).\nهل أنت متأكد من حذف المرحلة (${gradeName})؟`
          : `Warning: there are (${boundClasses.length}) classes linked to this grade level (${boundClasses.map((c) => c.name).join(', ')}).\nAre you sure you want to delete the grade level (${gradeName})?`
      );
      if (!confirmDelete) return;
    }

    const updated = educationalGrades.filter((g) => g !== gradeName);
    await triggerAutoSave(updated, lang === 'ar' ? `تم حذف المرحلة (${gradeName}) وتحديث الإعدادات بنجاح ✓` : `Grade level (${gradeName}) was deleted and settings updated successfully ✓`);
  };

  // Quick suggestions not yet added
  const availableSuggestions = COMMON_SUGGESTIONS.filter((s) => !educationalGrades.includes(s));

  return (
    <div className="space-y-3">
      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <GraduationCap className="w-4 h-4 text-indigo-600" />
          <span>{lang === 'ar' ? `المراحل والصفوف الدراسية المعتمدة (${educationalGrades.length} مراحل):` : `Approved grade levels and classes (${educationalGrades.length} grades):`}</span>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'إضافة مرحلة / صف دراسي جديد' : 'Add new grade level'}</span>
          </button>
        )}
      </div>

      {/* Quick Add Suggestions Chips */}
      {!disabled && availableSuggestions.length > 0 && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{lang === 'ar' ? 'إضافة سريعة لمراحل شائعة بنقرة واحدة:' : 'Quick add common grade levels in one click:'}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {availableSuggestions.slice(0, 8).map((sugg) => (
              <button
                key={sugg}
                type="button"
                onClick={() => handleAddGrade(sugg)}
                className="px-2.5 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 rounded-lg text-slate-700 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                title={lang === 'ar' ? `إضافة ${sugg}` : `Add ${sugg}`}
              >
                <Plus className="w-3 h-3 text-indigo-500" />
                <span>{sugg}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add New Grade Form */}
      {isAdding && (
        <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-3 animate-in fade-in duration-200">
          <div className="font-bold text-indigo-900 text-xs flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-indigo-600" />
            <span>{lang === 'ar' ? 'تعريف مرحلة / صف دراسي جديد' : 'Define a new grade level'}</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newGradeName}
              onChange={(e) => setNewGradeName(e.target.value)}
              placeholder={lang === 'ar' ? 'مثال: الصف السادس، الصف السابع، الأول ثانوي...' : 'Example: Sixth grade, Seventh grade, First secondary...'}
              className="flex-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-semibold text-xs"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddGrade();
                }
              }}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 text-xs cursor-pointer"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => handleAddGrade()}
                disabled={!newGradeName.trim()}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold cursor-pointer shadow-2xs"
              >
                {lang === 'ar' ? 'حفظ المرحلة' : 'Save grade level'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grades Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <table className="w-full text-right border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px]">
              <th className="p-2.5 font-bold">{lang === 'ar' ? 'اسم المرحلة / الصف الدراسي' : 'Grade level name'}</th>
              <th className="p-2.5 font-bold">{lang === 'ar' ? 'الفصول المسندة للمرحلة' : 'Classes assigned to the grade'}</th>
              <th className="p-2.5 font-bold text-center">{lang === 'ar' ? 'إجمالي الشعب' : 'Total sections'}</th>
              {!disabled && <th className="p-2.5 text-center w-20">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {educationalGrades.length === 0 ? (
              <tr>
                <td colSpan={disabled ? 3 : 4} className="p-6 text-center text-slate-400">
                  {lang === 'ar' ? 'لم يتم تعريف مراحل دراسية بعد. انقر على "إضافة مرحلة / صف دراسي جديد" أو استخدم الإضافة السريعة أعلاه.' : 'No grade levels defined yet. Click "Add new grade level" or use the quick add above.'}
                </td>
              </tr>
            ) : (
              educationalGrades.map((gradeName, index) => {
                const isEditing = editingIndex === index;
                const assignedClasses = classes.filter((c) => c.grade === gradeName);

                return (
                  <tr key={`${gradeName}-${index}`} className="hover:bg-slate-50/60 transition-colors">
                    {isEditing ? (
                      <>
                        <td className="p-2" colSpan={disabled ? 2 : 3}>
                          <input
                            type="text"
                            value={editNameInput}
                            onChange={(e) => setEditNameInput(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-bold text-slate-900"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                saveEdit(index);
                              } else if (e.key === 'Escape') {
                                cancelEdit();
                              }
                            }}
                          />
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => saveEdit(index)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                              title={lang === 'ar' ? 'حفظ' : 'Save'}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded cursor-pointer"
                              title={lang === 'ar' ? 'إلغاء' : 'Cancel'}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-2.5 font-bold text-slate-900 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                          <span className="text-sm font-semibold">{gradeName}</span>
                        </td>
                        <td className="p-2.5 text-slate-700">
                          {assignedClasses.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {assignedClasses.map((cls) => (
                                <span
                                  key={cls.id}
                                  className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold"
                                >
                                  {cls.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">
                              {lang === 'ar' ? 'لا توجد فصول مسندة لهذه المرحلة بعد' : 'No classes assigned to this grade level yet'}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-center font-mono">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              assignedClasses.length > 0
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {lang === 'ar' ? `${assignedClasses.length} شعبة` : `${assignedClasses.length} sections`}
                          </span>
                        </td>
                        {!disabled && (
                          <td className="p-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => startEdit(index, gradeName)}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer transition-colors"
                                title={lang === 'ar' ? 'تعديل اسم المرحلة' : 'Edit grade level name'}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(gradeName)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                                title={lang === 'ar' ? 'حذف المرحلة' : 'Delete grade level'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
