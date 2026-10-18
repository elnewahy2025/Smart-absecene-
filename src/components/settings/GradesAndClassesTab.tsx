import React from 'react';
import { TenantSchoolProfile } from '../../types/attendance';
import { School, GraduationCap, BookOpen } from 'lucide-react';
import { GradeLevelsCard } from './GradeLevelsCard';
import { ClassesManagementCard } from './ClassesManagementCard';
import { SubjectsManagementCard } from './SubjectsManagementCard';

interface Props {
  profile: TenantSchoolProfile;
  onChange: (updates: Partial<TenantSchoolProfile>) => void;
  onAutoSave?: (updates: Partial<TenantSchoolProfile>) => Promise<void> | void;
  disabled?: boolean;
}

export const GradesAndClassesTab: React.FC<Props> = ({
  profile,
  onChange,
  onAutoSave,
  disabled,
}) => {
  const educationalGrades = profile.educationalGrades || [];
  const classes = profile.classes || [];
  const subjects = profile.subjects || [];

  const handleGradesChange = (newGrades: string[]) => {
    onChange({ educationalGrades: newGrades });
  };

  const handleGradesAutoSave = async (newGrades: string[]) => {
    onChange({ educationalGrades: newGrades });
    if (onAutoSave) {
      await onAutoSave({ educationalGrades: newGrades });
    }
  };

  const handleClassesChange = (newClasses: typeof classes) => {
    onChange({ classes: newClasses });
  };

  const handleClassesAutoSave = async (newClasses: typeof classes) => {
    onChange({ classes: newClasses });
    if (onAutoSave) {
      await onAutoSave({ classes: newClasses });
    }
  };

  const handleSubjectsChange = (newSubjects: typeof subjects) => {
    onChange({ subjects: newSubjects });
  };

  const handleSubjectsAutoSave = async (newSubjects: typeof subjects) => {
    onChange({ subjects: newSubjects });
    if (onAutoSave) {
      await onAutoSave({ subjects: newSubjects });
    }
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Tab Group Header */}
      <div className="settings-group-header flex items-center justify-between p-3 rounded-xl border font-bold shadow-2xs">
        <div className="flex items-center gap-2.5">
          <GraduationCap className="w-4 h-4 shrink-0 text-indigo-600" />
          <span className="text-sm">المراحل، الصفوف والفصول الدراسية والمواد المعتمدة</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
            {educationalGrades.length} مراحل
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
            {classes.length} فصول
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-mono">
            {subjects.length} مواد
          </span>
        </div>
      </div>

      {/* 1. Educational Grade Levels Management (الصف السادس، الصف السابع، إلخ) */}
      <GradeLevelsCard
        educationalGrades={educationalGrades}
        classes={classes}
        onChange={handleGradesChange}
        onAutoSave={handleGradesAutoSave}
        disabled={disabled}
      />

      {/* 2. School Classes & Classrooms Management (Linked to configured grades) */}
      <ClassesManagementCard
        classes={classes}
        educationalGrades={educationalGrades}
        onChange={handleClassesChange}
        onAutoSave={handleClassesAutoSave}
        disabled={disabled}
      />

      {/* 3. Approved School Subjects */}
      <SubjectsManagementCard
        subjects={subjects}
        onChange={handleSubjectsChange}
        onAutoSave={handleSubjectsAutoSave}
        disabled={disabled}
      />
    </div>
  );
};
