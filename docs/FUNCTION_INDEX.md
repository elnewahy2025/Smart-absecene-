# Function Index

Key functions observed in the repository:

- `callGeminiWithFallback` in `server.ts`
- `startServer` in `server.ts`
- `testConnection` in `src/lib/firebase.ts`
- `handleFirestoreError` in `src/lib/firebase.ts`
- `AttendanceProvider` in `src/context/AttendanceContext.tsx`
- `useAttendance` in `src/context/AttendanceContext.tsx`
- `signInWithGoogle`
- `signOutGoogle`
- `updateRecord`
- `submitSession`
- `reopenSession`
- `createJustification`
- `reviewJustification`
- `sendCustomParentNotification`
- `retryNotification`
- `importStudents`
- `updateSettings`
- `generateCurrentDigest`
- `dispatchDailyDigest`

## Summary

The app has a strong set of domain operations but the functions are concentrated in a large context object, which increases complexity and reduces isolation.
