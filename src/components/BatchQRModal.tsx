import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Student } from '../types/attendance';
import { useAttendance } from '../context/AttendanceContext';
import { Printer, Download, X, QrCode, Building, Layers } from 'lucide-react';

interface BatchQRModalProps {
  onClose: () => void;
  initialClass?: string;
}

export const BatchQRModal: React.FC<BatchQRModalProps> = ({ onClose, initialClass = 'all' }) => {
  const { students, currentTenant, lang } = useAttendance();

  const [selectedClass, setSelectedClass] = useState<string>(initialClass);
  const [qrCodeUrls, setQrCodeUrls] = useState<Record<string, string>>({});

  const filteredStudents = students.filter(
    (s) => selectedClass === 'all' || s.className === selectedClass
  );

  useEffect(() => {
    async function generateAll() {
      const urls: Record<string, string> = {};
      for (const s of filteredStudents) {
        const payload = JSON.stringify({
          app: 'SMART_ATTENDANCE',
          schoolId: currentTenant.id,
          studentId: s.id,
          studentNumber: s.studentNumber,
          nationalId: s.nationalId,
          fullName: s.fullName,
          className: s.className,
        });

        try {
          const dataUrl = await QRCode.toDataURL(payload, {
            width: 140,
            margin: 1,
            color: { dark: '#0f172a', light: '#ffffff' },
          });
          urls[s.id] = dataUrl;
        } catch (e) {
          console.error('Error generating QR', e);
        }
      }
      setQrCodeUrls(urls);
    }

    generateAll();
  }, [filteredStudents, currentTenant]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:p-0 print:bg-white print:static print:block">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto print:max-h-none print:shadow-none print:p-0 print:overflow-visible">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {lang === 'ar' ? 'طباعة بطاقات الحضور بالـ QR مجمعة (كافة طلاب الفصل)' : 'Batch QR Student Cards Print'}
              </h3>
              <p className="text-xs text-slate-500">
                {currentTenant.name} · بطاقات مهيأة للطباعة والتوزيع
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 cursor-pointer"
            >
              <option value="all">جميع الفصول ({students.length} طالب)</option>
              {Array.from(new Set(students.map((s) => s.className).filter(Boolean)))
                .sort()
                .map((cName) => (
                  <option key={cName} value={cName}>
                    فصل {cName}
                  </option>
                ))}
            </select>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'ar' ? 'طباعة البطاقات' : 'Print All'}</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Grid of ID Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2 print:grid-cols-3 print:gap-3">
          {filteredStudents.map((s) => (
            <div
              key={s.id}
              className="border-2 border-emerald-600 rounded-xl overflow-hidden bg-white shadow-xs p-3 text-center space-y-2 break-inside-avoid"
            >
              <div className="bg-emerald-800 text-white p-2 -mx-3 -mt-3">
                <span className="font-bold text-xs block leading-tight">{currentTenant.name}</span>
                <span className="text-[10px] text-emerald-200">بطاقة الحضور والانضباط المدرسي</span>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm">{s.fullName}</h4>
                <div className="text-[11px] text-emerald-700 font-semibold">
                  الفصل: {s.className} · رقم: {s.studentNumber}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">السجل: {s.nationalId}</div>
              </div>

              {/* QR Image */}
              <div className="border border-slate-200 rounded-lg p-2 bg-slate-50 inline-block mx-auto">
                {qrCodeUrls[s.id] ? (
                  <img src={qrCodeUrls[s.id]} alt="QR" className="w-28 h-28 mx-auto" />
                ) : (
                  <div className="w-28 h-28 flex items-center justify-center text-[10px] text-slate-400">
                    جارٍ التوليد...
                  </div>
                )}
              </div>

              <div className="text-[10px] text-slate-500 border-t border-slate-100 pt-1">
                امسح الرمز لتسجيل الحضور الذكي بدون لمس
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
