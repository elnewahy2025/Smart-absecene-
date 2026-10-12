import React from 'react';
import { TenantSchoolProfile, AssemblyPointConfig } from '../../types/attendance';
import { ShieldAlert, Plus, Trash2, FileCheck } from 'lucide-react';

interface Props {
  profile: TenantSchoolProfile;
  onChange: (updates: Partial<TenantSchoolProfile>) => void;
  disabled?: boolean;
}

export const EmergencyPolicyTab: React.FC<Props> = ({ profile, onChange, disabled }) => {
  const assemblyPoints = profile.assemblyPoints || [];

  const handlePointChange = (id: string, field: keyof AssemblyPointConfig, value: any) => {
    const updated = assemblyPoints.map((p) => {
      if (p.id === id) {
        return { ...p, [field]: value };
      }
      return p;
    });
    onChange({ assemblyPoints: updated });
  };

  const handleAddPoint = () => {
    const newPoint: AssemblyPointConfig = {
      id: `ap-${Date.now()}`,
      name: `نقطة تجمع جديدة`,
      zone: `Zone ${String.fromCharCode(65 + assemblyPoints.length)}`,
      capacity: 200,
      assignedGrades: ['جميع المراحل'],
    };
    onChange({ assemblyPoints: [...assemblyPoints, newPoint] });
  };

  const handleDeletePoint = (id: string) => {
    onChange({ assemblyPoints: assemblyPoints.filter((p) => p.id !== id) });
  };

  return (
    <div className="space-y-5 text-xs">
      <div className="settings-group-header flex items-center justify-between p-3 rounded-xl border font-bold shadow-2xs">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span className="text-sm">سياسات الطوارئ، نقاط الإخلاء، وهوامش التقارير الرسمية</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/40 border border-current font-mono">
          {assemblyPoints.length} نقاط إخلاء
        </span>
      </div>

      {/* Assembly Points */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-800">
            نقاط التجمع والإخلاء المعتمدة في كشف الطوارئ ({assemblyPoints.length} نقاط):
          </h4>
          {!disabled && (
            <button
              type="button"
              onClick={handleAddPoint}
              className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-semibold cursor-pointer text-[11px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة نقطة تجمع</span>
            </button>
          )}
        </div>

        <div className="space-y-2">
          {assemblyPoints.map((point) => (
            <div key={point.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
              <div>
                <label className="text-slate-500 block mb-1 text-[11px]">اسم نقطة التجمع:</label>
                <input
                  type="text"
                  disabled={disabled}
                  value={point.name}
                  onChange={(e) => handlePointChange(point.id, 'name', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900"
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1 text-[11px]">المنطقة الجغرافية (Zone):</label>
                <input
                  type="text"
                  disabled={disabled}
                  value={point.zone}
                  onChange={(e) => handlePointChange(point.id, 'zone', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono text-slate-900"
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1 text-[11px]">الطاقة الاستيعابية (طالب):</label>
                <input
                  type="number"
                  disabled={disabled}
                  value={point.capacity}
                  onChange={(e) => handlePointChange(point.id, 'capacity', parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono text-slate-900"
                />
              </div>
              <div className="flex items-center gap-2 justify-end">
                {!disabled && assemblyPoints.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeletePoint(point.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg cursor-pointer"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Official PDF Footer */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          <FileCheck className="w-4 h-4 text-emerald-600" />
          <span>هامش وملاحظة الاعتماد في أسفل التقارير الرسمية (PDF Footer Note):</span>
        </div>
        <textarea
          rows={2}
          disabled={disabled}
          value={profile.officialReportFooterNote}
          onChange={(e) => onChange({ officialReportFooterNote: e.target.value })}
          className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900"
          placeholder="وثيقة رسمية صادرة آلياً وموثقة برمز الاستجابة السريعة (QR)..."
        />
      </div>
    </div>
  );
};
