import React, { useRef } from 'react';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';
import {
  X,
  Calendar,
  AlertTriangle,
  MessageSquare,
  FileCheck2,
  Award,
} from 'lucide-react';
import type { SelectedRecordType } from './parentRecordDetailTypes';
import { AbsenceLateRecordDetails } from './AbsenceLateRecordDetails';
import { BehaviourRecordDetails } from './BehaviourRecordDetails';
import { JustificationRecordDetails } from './JustificationRecordDetails';
import { NotificationRecordDetails } from './NotificationRecordDetails';

export type { SelectedRecordType } from './parentRecordDetailTypes';

interface ParentRecordDetailsModalProps {
  record: SelectedRecordType | null;
  onClose: () => void;
  onOpenExcuseForm?: (studentId: string, date: string) => void;
  studentId?: string;
}

export const ParentRecordDetailsModal: React.FC<ParentRecordDetailsModalProps> = ({
  record,
  onClose,
  onOpenExcuseForm,
  studentId,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalAccessibility({ isOpen: true, onClose, containerRef: dialogRef });
  if (!record) return null;

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="record-details-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            {record.type === 'absence_late' && (
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
            )}
            {record.type === 'infraction' && (
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  record.data.type === 'positive'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {record.data.type === 'positive' ? (
                  <Award className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
            )}
            {record.type === 'justification' && (
              <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                <FileCheck2 className="w-5 h-5" />
              </div>
            )}
            {record.type === 'notification' && (
              <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 id="record-details-title" className="font-bold text-base text-slate-900">
                {record.type === 'absence_late' && 'تفاصيل قيد الحضور والغياب'}
                {record.type === 'infraction' &&
                  (record.data.type === 'positive'
                    ? 'تفاصيل السلوك الإيجابي والتميز'
                    : 'تفاصيل المخالفة السلوكية')}
                {record.type === 'justification' && 'تفاصيل العذر والتقرير الطبي'}
                {record.type === 'notification' && 'تفاصيل الإشعار والرسالة الموجهة'}
              </h3>
              <p className="text-xs text-slate-500">
                سجل رسمي معتمد وموثق في قاعدة بيانات المدرسة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm">
          {/* 1. Absence / Late Details */}
          {record.type === 'absence_late' && (
            <AbsenceLateRecordDetails
              data={record.data}
              studentId={studentId}
              onClose={onClose}
              onOpenExcuseForm={onOpenExcuseForm}
            />
          )}

          {/* 2. Infraction / Behaviour Incident Details */}
          {record.type === 'infraction' && <BehaviourRecordDetails data={record.data} />}

          {/* 3. Justification Details */}
          {record.type === 'justification' && <JustificationRecordDetails data={record.data} />}

          {/* 4. Notification Details */}
          {record.type === 'notification' && <NotificationRecordDetails data={record.data} />}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
