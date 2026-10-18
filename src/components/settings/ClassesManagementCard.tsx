import React, { useState } from 'react';
import { SchoolClassConfig } from '../../types/attendance';
import { School, Plus, Trash2, Edit2, Check, X, DoorOpen, Users, CheckCircle2 } from 'lucide-react';

interface Props {
  classes: SchoolClassConfig[];
  educationalGrades?: string[];
  onChange: (classes: SchoolClassConfig[]) => void;
  onAutoSave?: (classes: SchoolClassConfig[]) => Promise<void> | void;
  disabled?: boolean;
}

export const ClassesManagementCard: React.FC<Props> = ({
  classes,
  educationalGrades = [],
  onChange,
  onAutoSave,
  disabled,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [gradeInput, setGradeInput] = useState('');
  const [roomInput, setRoomInput] = useState('');
  const [capacityInput, setCapacityInput] = useState<number>(30);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // New class modal / inline row
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGrade, setNewGrade] = useState(educationalGrades[0] || 'الصف العاشر');
  const [newRoom, setNewRoom] = useState('');
  const [newCapacity, setNewCapacity] = useState<number>(35);

  const triggerAutoSave = async (updatedClasses: SchoolClassConfig[], msg?: string) => {
    onChange(updatedClasses);
    if (onAutoSave) {
      try {
        setIsSaving(true);
        await onAutoSave(updatedClasses);
      } finally {
        setIsSaving(false);
      }
    }
    if (msg) {
      setFeedbackMsg(msg);
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };

  const startEdit = (cls: SchoolClassConfig) => {
    setEditingId(cls.id);
    setNameInput(cls.name);
    setGradeInput(cls.grade);
    setRoomInput(cls.room || '');
    setCapacityInput(cls.capacity || 30);
  };

  const saveEdit = async (id: string) => {
    if (!nameInput.trim() || isSaving) return;
    const updated = classes.map((c) =>
      c.id === id
        ? {
            ...c,
            name: nameInput.trim(),
            grade: gradeInput.trim() || 'المرحلة الدراسية',
            room: roomInput.trim() || undefined,
            capacity: Number(capacityInput) || 30,
          }
        : c
    );
    setEditingId(null);
    await triggerAutoSave(updated, `تم حفظ تعديلات الشعبة (${nameInput.trim()}) بنجاح ✓`);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (disabled || isSaving) return;
    const target = classes.find((c) => c.id === id);
    const updated = classes.filter((c) => c.id !== id);
    await triggerAutoSave(
      updated,
      target ? `تم حذف الشعبة (${target.name}) وحفظ التعديلات بنجاح ✓` : 'تم حذف الفصل بنجاح ✓'
    );
  };

  const handleAddClass = async () => {
    if (!newName.trim() || isSaving) return;
    const newClassItem: SchoolClassConfig = {
      id: `class-${Date.now()}`,
      name: newName.trim(),
      grade: newGrade.trim() || 'المرحلة الدراسية',
      room: newRoom.trim() || undefined,
      capacity: Number(newCapacity) || 30,
    };
    const updated = [...classes, newClassItem];
    setNewName('');
    setNewRoom('');
    setIsAdding(false);
    await triggerAutoSave(updated, `تمت إضافة الشعبة (${newClassItem.name}) وحفظها بنجاح ✓`);
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
          <School className="w-4 h-4 text-emerald-600" />
          <span>الفصول والشعب المدرسية المعتمدة ({classes.length} فصول):</span>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة فصل / شعبة جديدة</span>
          </button>
        )}
      </div>

      {/* Add New Class Form */}
      {isAdding && (
        <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3 animate-in fade-in duration-200">
          <div className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>تعريف فصل دراسي جديد</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <label className="text-slate-600 block mb-1">اسم الفصل / الشعبة *</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="مثال: 10 / ج أو 11 / أ"
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-semibold"
                autoFocus
              />
            </div>
            <div>
              <label className="text-slate-600 block mb-1">الصف / المرحلة الدراسية *</label>
              {educationalGrades.length > 0 ? (
                <select
                  value={newGrade}
                  onChange={(e) => setNewGrade(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-medium"
                >
                  {educationalGrades.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={newGrade}
                  onChange={(e) => setNewGrade(e.target.value)}
                  placeholder="الصف العاشر"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
                />
              )}
            </div>
            <div>
              <label className="text-slate-600 block mb-1">القاعة / الغرفة الصفية</label>
              <input
                type="text"
                value={newRoom}
                onChange={(e) => setNewRoom(e.target.value)}
                placeholder="قاعة 103"
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
              />
            </div>
            <div>
              <label className="text-slate-600 block mb-1">السعة الاستيعابية</label>
              <input
                type="number"
                value={newCapacity}
                onChange={(e) => setNewCapacity(Number(e.target.value))}
                min={10}
                max={60}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 text-xs cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleAddClass}
              disabled={!newName.trim()}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              حفظ الفصل
            </button>
          </div>
        </div>
      )}

      {/* Classes Table / Cards */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <table className="w-full text-right border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px]">
              <th className="p-2.5 font-bold">اسم الفصل / الشعبة</th>
              <th className="p-2.5 font-bold">المرحلة / الصف</th>
              <th className="p-2.5 font-bold">القاعة الصفية</th>
              <th className="p-2.5 font-bold text-center">السعة</th>
              {!disabled && <th className="p-2.5 text-center w-20">إجراءات</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {classes.length === 0 ? (
              <tr>
                <td colSpan={disabled ? 4 : 5} className="p-6 text-center text-slate-400">
                  لم يتم إضافة فصول دراسية بعد. انقر على "إضافة فصل / شعبة جديدة" للبدء.
                </td>
              </tr>
            ) : (
              classes.map((cls) => {
                const isEditing = editingId === cls.id;
                return (
                  <tr key={cls.id} className="hover:bg-slate-50/60 transition-colors">
                    {isEditing ? (
                      <>
                        <td className="p-2">
                          <input
                            type="text"
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 font-bold text-slate-900"
                          />
                        </td>
                        <td className="p-2">
                          {educationalGrades.length > 0 ? (
                            <select
                              value={gradeInput}
                              onChange={(e) => setGradeInput(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-800 font-medium"
                            >
                              {!educationalGrades.includes(gradeInput) && gradeInput && (
                                <option value={gradeInput}>{gradeInput} (مخصص)</option>
                              )}
                              {educationalGrades.map((g) => (
                                <option key={g} value={g}>
                                  {g}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={gradeInput}
                              onChange={(e) => setGradeInput(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-800"
                            />
                          )}
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={roomInput}
                            onChange={(e) => setRoomInput(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-800"
                          />
                        </td>
                        <td className="p-2 w-20 text-center">
                          <input
                            type="number"
                            value={capacityInput}
                            onChange={(e) => setCapacityInput(Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-center font-mono text-slate-800"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => saveEdit(cls.id)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                              title="حفظ"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded cursor-pointer"
                              title="إلغاء"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-2.5 font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                          <span>{cls.name}</span>
                        </td>
                        <td className="p-2.5 text-slate-700">{cls.grade}</td>
                        <td className="p-2.5 text-slate-500 flex items-center gap-1">
                          <DoorOpen className="w-3.5 h-3.5 text-slate-400" />
                          <span>{cls.room || 'غير محدد'}</span>
                        </td>
                        <td className="p-2.5 text-center font-mono text-slate-700">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-[11px]">
                            <Users className="w-3 h-3 text-slate-500" />
                            <span>{cls.capacity || 30}</span>
                          </span>
                        </td>
                        {!disabled && (
                          <td className="p-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => startEdit(cls)}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer transition-colors"
                                title="تعديل"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(cls.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                                title="حذف"
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
