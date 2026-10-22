import { Search } from 'lucide-react';

interface EmptyStudentStateProps {
  isAr: boolean;
}

export function EmptyStudentState({ isAr }: EmptyStudentStateProps) {
  return (
<div
  className="app-card rounded-2xl border p-12 text-center shadow-2xs space-y-3"
  style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
>
  <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-xs">
    <Search className="w-8 h-8" />
  </div>
  <h3 className="text-base font-bold" style={{ color: 'var(--app-text-main)' }}>
    {isAr ? 'الرجاء اختيار أو البحث عن طالب لعرض ملف الغياب' : 'Please select or search for a student'}
  </h3>
  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
    {isAr
      ? 'اختر الصف ثم الفصل من الأعلى، أو اكتب اسم الطالب في مربع البحث لاحتساب مرات الغياب والتأخر والمخالفات في أي مدة تريدها.'
      : 'Select grade and class above, or type in search box to view absence counts, tardiness, and conduct violations for any chosen horizon.'}
  </p>
</div>
  );
}
