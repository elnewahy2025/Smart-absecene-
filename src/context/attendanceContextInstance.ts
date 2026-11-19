import { createContext } from 'react';
import type { AttendanceContextType } from './attendanceContextSupport';

// Kept in its own module so Vite HMR does not recreate the context object when
// AttendanceContext.tsx is hot-updated. A new context identity would make the
// provider and its consumers disagree and cause the misleading
// "useAttendance must be used within an AttendanceProvider" error in development.
export const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);
