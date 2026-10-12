import React, { useState } from 'react';
import { AcademicTerm } from '../../types/attendance';
import { Calendar, CheckCircle2, Plus, Trash2, Edit2, Check, X } from 'lucide-react';

interface Props {
  terms: AcademicTerm[];
  onChange: (terms: AcademicTerm[]) => void;
  onAutoSave?: (terms: AcademicTerm[]) => Promise<void> | void;
  disabled?: boolean;
}

export const AcademicTermsCard: React.FC<Props> = ({ terms, onChange, onAutoSave, disabled }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameArInput, setNameArInput] = useState('');
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Add Term State
  const [isAdding, setIsAdding] = useState(false);
  const [newNameAr, setNewNameAr] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');

  const triggerAutoSave = async (updatedTerms: AcademicTerm[], msg?: string) => {
    onChange(updatedTerms);
    if (onAutoSave) {
      try {
        setIsSaving(true);
        await onAutoSave(updatedTerms);
      } finally {
        setIsSaving(false);
      }
    }
    if (msg) {
      setSaveFeedback(msg);
      setTimeout(() => setSaveFeedback(null), 3500);
    }
  };

  const handleSetActive = async (termId: string) => {
    if (disabled || isSaving) return;
    const target = terms.find((t) => t.id === termId);
    const updated = terms.map((t) => ({
      ...t,
      isActive: t.id === termId,
    }));
    await triggerAutoSave(
      updated,
      target ? `تم تعيين (${target.nameAr}) كفصل دراسي نشط حالياً وحفظ الإعدادات بنجاح ✓` : 'تم تحديد الفصل الدراسي النشط وحفظه بنجاح ✓'
    );
  };

  const startEdit = (term: AcademicTerm, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(term.id);
    setNameArInput(term.nameAr);
    setStartDateInput(term.startDate);
    setEndDateInput(term.endDate);
  };

  const saveEdit = async (id: string, e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    if (!nameArInput.trim() || isSaving) return;
    const updated = terms.map((t) =>
      t.id === id
        ? {
            ...t,
            nameAr: nameArInput.trim(),
            startDate: startDateInput || t.startDate,
            endDate: endDateInput || t.endDate,
          }
        : t
    );
    setEditingId(null);
    await triggerAutoSave(updated, `تم حفظ تعديلات (${nameArInput.trim()}) وتحديث التقويم بنجاح ✓`);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (terms.length <= 1 || isSaving) return;
    const target = terms.find((t) => t.id === id);
    const remaining = terms.filter((t) => t.id !== id);
    if (!remaining.some((t) => t.isActive) && remaining.length > 0) {
      remaining[0].isActive = true;
    }
    await triggerAutoSave(
      remaining,
      target ? `تم حذف (${target.nameAr}) وحفظ التعديلات بنجاح ✓` : 'تم حذف الفصل الدراسي بنجاح ✓'
    );
  };

  const handleAddTerm = async () => {
    if (!newNameAr.trim() || isSaving) return;
    const newTermItem: AcademicTerm = {
      id: `term-${Date.now()}`,
      nameAr: newNameAr.trim(),
      nameEn: `Term ${terms.length + 1}`,
      startDate: newStartDate || '2026-09-01',
      endDate: newEndDate || '2027-01-01',
      isActive: terms.length === 0,
    };
    const updated = [...terms, newTermItem];
    setNewNameAr('');
    setNewStartDate('');
    setNewEndDate('');
    setIsAdding(false);
    await triggerAutoSave(updated, `تمت إضافة (${newTermItem.nameAr}) وحفظ التقويم المدرسي بنجاح ✓`);
  };

  return (
    <div className="space-y-3">
      {saveFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in slide-in-from-top-1 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveFeedback}</span>
        </div>
      )}

      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <Calendar className="w-4 h-4 text-purple-600" />
          <span>الفصول الدراسية (انقر لتحديد الفصل النشط حالياً):</span>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة فصل دراسي (ترم) جديد</span>
          </button>
        )}
      </div>

      {/* Add New Term Form */}
      {isAdding && (
        <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-xl space-y-3 animate-in fade-in duration-200 text-xs">
          <div className="font-bold text-purple-900 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-purple-600" />
            <span>تعريف ترم / فصل دراسي جديد</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-slate-600 block mb-1">اسم الترم (عربي) *</label>
              <input
                type="text"
                value={newNameAr}
                onChange={(e) => setNewNameAr(e.target.value)}
                placeholder="الفصل الدراسي الأول"
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-semibold"
                autoFocus
              />
            </div>
            <div>
              <label className="text-slate-600 block mb-1">تاريخ البداية</label>
              <input
                type="date"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900"
              />
            </div>
            <div>
              <label className="text-slate-600 block mb-1">تاريخ النهاية</label>
              <input
                type="date"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleAddTerm}
              disabled={!newNameAr.trim()}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg font-bold cursor-pointer"
            >
              حفظ الترم
            </button>
          </div>
        </div>
      )}

      {/* Terms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {terms.map((term) => {
          const isEditing = editingId === term.id;
          return (
            <div
              key={term.id}
              onClick={() => !isEditing && handleSetActive(term.id)}
              className={`p-3 rounded-xl border transition-all ${
                term.isActive
                  ? 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-400/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-purple-200'
              } ${isEditing ? 'cursor-default' : 'cursor-pointer'}`}
            >
              {isEditing ? (
                <div className="space-y-2 text-xs" onClick={(e) => e.stopPropagation()}>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5 font-semibold">اسم الفصل الدراسي:</label>
                    <input
                      type="text"
                      value={nameArInput}
                      onChange={(e) => setNameArInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(term.id, e);
                      }}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 font-bold text-slate-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5 font-semibold">تاريخ البداية:</label>
                    <input
                      type="date"
                      value={startDateInput}
                      onChange={(e) => setStartDateInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(term.id, e);
                      }}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 font-mono text-slate-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5 font-semibold">تاريخ النهاية:</label>
                    <input
                      type="date"
                      value={endDateInput}
                      onChange={(e) => setEndDateInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(term.id, e);
                      }}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 font-mono text-slate-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-1.5 pt-1.5">
                    <button
                      type="button"
                      onClick={(e) => saveEdit(term.id, e)}
                      disabled={isSaving || !nameArInput.trim()}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isSaving ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={isSaving}
                      className="px-2.5 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs hover:bg-slate-100 cursor-pointer transition-colors"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      {term.isActive && <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />}
                      <span>{term.nameAr}</span>
                    </span>
                    <div className="flex items-center gap-1">
                      {term.isActive && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                      {!disabled && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => startEdit(term, e)}
                            className="p-1 text-slate-400 hover:text-purple-600 rounded cursor-pointer"
                            title="تعديل المواعيد"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {terms.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => handleDelete(term.id, e)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-1 font-mono bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-400">من:</span>
                      <span className="font-semibold text-slate-800">{term.startDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">إلى:</span>
                      <span className="font-semibold text-slate-800">{term.endDate}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
