import React, { useState } from 'react';
import { SchoolSubjectConfig } from '../../types/attendance';
import { BookOpen, Plus, Trash2, Edit2, Check, X, Tag, CheckCircle2 } from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';

interface Props {
  subjects: SchoolSubjectConfig[];
  onChange: (subjects: SchoolSubjectConfig[]) => void;
  onAutoSave?: (subjects: SchoolSubjectConfig[]) => Promise<void> | void;
  disabled?: boolean;
}

export const SubjectsManagementCard: React.FC<Props> = ({ subjects, onChange, onAutoSave, disabled }) => {
  const { lang } = useAttendance();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [deptInput, setDeptInput] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Add subject state
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDept, setNewDept] = useState('');

  const triggerAutoSave = async (updatedSubjects: SchoolSubjectConfig[], msg?: string) => {
    onChange(updatedSubjects);
    if (onAutoSave) {
      try {
        setIsSaving(true);
        await onAutoSave(updatedSubjects);
      } finally {
        setIsSaving(false);
      }
    }
    if (msg) {
      setFeedbackMsg(msg);
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };

  const startEdit = (subj: SchoolSubjectConfig) => {
    setEditingId(subj.id);
    setNameInput(subj.name);
    setCodeInput(subj.code || '');
    setDeptInput(subj.department || '');
  };

  const saveEdit = async (id: string) => {
    if (!nameInput.trim() || isSaving) return;
    const updated = subjects.map((s) =>
      s.id === id
        ? {
            ...s,
            name: nameInput.trim(),
            code: codeInput.trim() || undefined,
            department: deptInput.trim() || undefined,
          }
        : s
    );
    setEditingId(null);
    await triggerAutoSave(updated, lang === 'ar' ? `تم حفظ تعديلات المادة (${nameInput.trim()}) بنجاح ✓` : `Subject (${nameInput.trim()}) changes were saved successfully ✓`);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (disabled || isSaving) return;
    const target = subjects.find((s) => s.id === id);
    const updated = subjects.filter((s) => s.id !== id);
    await triggerAutoSave(
      updated,
      target ? (lang === 'ar' ? `تم حذف المادة (${target.name}) وحفظ التعديلات بنجاح ✓` : `Subject (${target.name}) was deleted and changes saved successfully ✓`) : (lang === 'ar' ? 'تم حذف المادة بنجاح ✓' : 'Subject deleted successfully ✓')
    );
  };

  const handleAddSubject = async () => {
    if (!newName.trim() || isSaving) return;
    const newSubjectItem: SchoolSubjectConfig = {
      id: `subj-${Date.now()}`,
      name: newName.trim(),
      code: newCode.trim() || undefined,
      department: newDept.trim() || undefined,
    };
    const updated = [...subjects, newSubjectItem];
    setNewName('');
    setNewCode('');
    setNewDept('');
    setIsAdding(false);
    await triggerAutoSave(updated, lang === 'ar' ? `تمت إضافة المادة (${newSubjectItem.name}) وحفظها بنجاح ✓` : `Subject (${newSubjectItem.name}) was added and saved successfully ✓`);
  };

  return (
    <div className="space-y-3">
      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <BookOpen className="w-4 h-4 text-blue-600" />
          <span>{lang === 'ar' ? `المواد الدراسية والمناهج المعتمدة (${subjects.length} مواد):` : `Approved subjects and curricula (${subjects.length} subjects):`}</span>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'إضافة مادة جديدة' : 'Add new subject'}</span>
          </button>
        )}
      </div>

      {/* Add New Subject */}
      {isAdding && (
        <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3 animate-in fade-in duration-200">
          <div className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>{lang === 'ar' ? 'تعريف مادة دراسية جديدة' : 'Define a new subject'}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div>
              <label className="text-slate-600 block mb-1">{lang === 'ar' ? 'اسم المادة *' : 'Subject name *'}</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={lang === 'ar' ? 'مثال: علم البيئة أو التاريخ' : 'Example: Environmental Science or History'}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-semibold"
                autoFocus
              />
            </div>
            <div>
              <label className="text-slate-600 block mb-1">{lang === 'ar' ? 'رمز المادة (Course Code)' : 'Course code'}</label>
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder={lang === 'ar' ? 'مثال: BIO-102' : 'Example: BIO-102'}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900"
              />
            </div>
            <div>
              <label className="text-slate-600 block mb-1">{lang === 'ar' ? 'القسم الأكاديمي' : 'Academic department'}</label>
              <input
                type="text"
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                placeholder={lang === 'ar' ? 'مثال: قسم العلوم الطبيعية' : 'Example: Natural Sciences Department'}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 text-xs cursor-pointer"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleAddSubject}
              disabled={!newName.trim()}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              {lang === 'ar' ? 'حفظ المادة' : 'Save subject'}
            </button>
          </div>
        </div>
      )}

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {subjects.map((subj) => {
          const isEditing = editingId === subj.id;
          if (isEditing) {
            return (
              <div key={subj.id} className="p-2.5 bg-blue-50/60 border border-blue-300 rounded-xl space-y-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold text-slate-900"
                  placeholder={lang === 'ar' ? 'اسم المادة' : 'Subject name'}
                />
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono text-slate-900"
                  placeholder={lang === 'ar' ? 'الرمز' : 'Code'}
                />
                <input
                  type="text"
                  value={deptInput}
                  onChange={(e) => setDeptInput(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900"
                  placeholder={lang === 'ar' ? 'القسم' : 'Department'}
                />
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => saveEdit(subj.id)}
                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={subj.id}
              className="p-2.5 bg-white border border-slate-200 rounded-xl hover:border-blue-200 transition-colors flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                  <span>{subj.name}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  {subj.code && (
                    <span className="font-mono bg-slate-100 px-1 rounded text-slate-600">
                      {subj.code}
                    </span>
                  )}
                  {subj.department && <span>{subj.department}</span>}
                </div>
              </div>
              {!disabled && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(subj)}
                    className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                    title={lang === 'ar' ? 'تعديل' : 'Edit'}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(subj.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                    title={lang === 'ar' ? 'حذف' : 'Delete'}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
