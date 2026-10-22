import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Tenant,
  UserProfile,
  Student,
  AttendanceSession,
  StudentAttendanceRecord,
  Justification,
  NotificationOutboxItem,
  AuditLog,
  SchoolSettings,
  UserRole,
  TenantSchoolProfile,
  StudentBehaviourIncident,
  SchoolEnrollmentStats,
} from '../types/attendance';
import { localCache } from '../utils/localCache';

import {
  TenantDomainConfig,
  resolveTenantFromHostname,
  extractQueryTenant,
} from '../config/tenantRegistry';

import { auth, db } from '../lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import type { AttendanceContextType } from './attendanceContextSupport';
import { authenticatedFetch, setApiTenantOverride } from '../lib/api';
import type { TenantSubscription } from '../config/subscription';
import { useDailyDigest } from './useDailyDigest';
import { useUserManagement } from './useUserManagement';
import { useStudentLifecycle } from './useStudentLifecycle';
import { useNotificationOutbox } from './useNotificationOutbox';
import { useSessionActions } from './useSessionActions';
import { useJustifications } from './useJustifications';
import { useSchoolSettings } from './useSchoolSettings';
import { useTenantProvisioning } from './useTenantProvisioning';
import { useAuthActions } from './useAuthActions';
import { useFirestoreDataSync } from './useFirestoreDataSync';
import { useAuthStateSync } from './useAuthStateSync';
import { useParentAttendanceRecords } from './useParentAttendanceRecords';
import { useSettingsPersistence } from './useSettingsPersistence';
import { useSessionPersistence } from './useSessionPersistence';
import { useTenantSubscription } from './useTenantSubscription';
import { useSchoolAnalytics } from './useSchoolAnalytics';
import { useEntityCachePersistence } from './useEntityCachePersistence';
import { useCurrentSchoolContext } from './useCurrentSchoolContext';
import { useScopedEntities } from './useScopedEntities';
import { useAuditLogger } from './useAuditLogger';
import { useAccessFlags } from './useAccessFlags';
import {
  loadUsers,
  loadStudents,
  loadSessions,
  loadJustifications,
  loadNotifications,
  loadAuditLogs,
  loadBehaviourIncidents,
  loadSettingsMap,
  loadSchoolProfilesMap,
} from './attendanceStateFactories';
import { useBehaviourIncidents } from './useBehaviourIncidents';

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider: React.FC<{ children: React.ReactNode; initialTenantId?: string }> = ({
  children,
  initialTenantId,
}) => {
  const [tenantId, setTenantIdState] = useState<string>(() => {
    if (initialTenantId) return initialTenantId;
    if (typeof window !== 'undefined') {
      const res = resolveTenantFromHostname(window.location.hostname, window.location.search);
      if (res.status === 'resolved' && res.tenantId) {
        return res.tenantId;
      }
    }
    return (typeof localCache !== 'undefined' && localCache.getItem('school_current_tenant_id')) || 'school-1';
  });
  const [authenticatedPhone, setAuthenticatedPhone] = useState('');

  // An explicit ?tenant=/?school= selection in the URL. It is honoured for the
  // platform owner (who may inspect any school); ordinary school accounts always
  // stay pinned to their own claim tenant without ever being signed out.
  const requestedTenantId = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const search = window.location.search;
    if (!extractQueryTenant(search) && !extractQueryTenant(search, 'school')) return null;
    const resolution = resolveTenantFromHostname(window.location.hostname, search);
    return resolution.status === 'resolved' && resolution.tenantId ? resolution.tenantId : null;
  }, []);

  // Tell the API client which school this session belongs to. The server still
  // authorises every call from the account's own claims, so this only routes
  // the request to the right tenant.
  useEffect(() => {
    setApiTenantOverride(tenantId);
  }, [tenantId]);

  const [currentUserRole, setCurrentUserRoleState] = useState<UserRole>(() => {
    return ((typeof localCache !== 'undefined' && localCache.getItem('school_current_user_role')) as UserRole) || 'parent';
  });
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  const setTenantId = (id: string) => {
    setTenantIdState(id);
    if (typeof localCache !== 'undefined') {
      localCache.setItem('school_current_tenant_id', id);
    }
  };

  const setUserRole = (role: UserRole) => {
    setCurrentUserRoleState(role);
    if (typeof localCache !== 'undefined') {
      localCache.setItem('school_current_user_role', role);
    }
  };

  const {
    dynamicTenants,
    setDynamicTenants,
    tenants,
    tenantSubscription,
    subscriptionAccess,
    refreshSubscription,
    syncTenantsWithServer,
  } = useTenantSubscription(tenantId);


  const [allUsers, setAllUsers] = useState<UserProfile[]>(loadUsers);

  const [allStudents, setAllStudents] = useState<Student[]>(loadStudents);

  const sessionHashesRef = useRef<Record<string, string>>({});
  const sessionsHydratedRef = useRef(false);
  const sessionsSeededRef = useRef(false);
  const sessionsRef = useRef<AttendanceSession[]>([]);

  const [allSessions, setAllSessions] = useState<AttendanceSession[]>(loadSessions);
  sessionsRef.current = allSessions;
  const [parentAttendanceRecords, setParentAttendanceRecords] = useState<StudentAttendanceRecord[]>([]);

  const [allJustifications, setAllJustifications] = useState<Justification[]>(loadJustifications);
  const [allNotifications, setAllNotifications] = useState<NotificationOutboxItem[]>(loadNotifications);
  const [allAuditLogs, setAllAuditLogs] = useState<AuditLog[]>(loadAuditLogs);

  const [allBehaviourIncidents, setAllBehaviourIncidents] = useState<StudentBehaviourIncident[]>(loadBehaviourIncidents);

  const [settingsMap, setSettingsMap] = useState<Record<string, SchoolSettings>>(loadSettingsMap);

  const [schoolProfilesMap, setSchoolProfilesMap] = useState<Record<string, TenantSchoolProfile>>(loadSchoolProfilesMap);

  useAuthStateSync({
    requestedTenantId,
    allUsers,
    currentUserRole,
    tenantId,
    setTenantId,
    setUserRole,
    setAuthenticatedPhone,
    setAllUsers,
    setFirebaseUser,
  });

  useFirestoreDataSync({
    firebaseUser,
    tenantId,
    currentUserRole,
    authenticatedPhone,
    allUsers,
    setAllUsers,
    setAllStudents,
    setAllSessions,
    setAllJustifications,
    setAllNotifications,
    setAllAuditLogs,
    sessionHashesRef,
    sessionsHydratedRef,
    sessionsSeededRef,
    sessionsRef,
  });

  const { signInWithGoogle, signOutGoogle, signInWithCredentials } = useAuthActions({
    tenantId,
    setTenantId,
    allUsers,
    currentUserRole,
    setUserRole,
  });

  useEntityCachePersistence({
    allStudents,
    allSessions,
    allJustifications,
    allNotifications,
    allAuditLogs,
    settingsMap,
    schoolProfilesMap,
  });


  const {
    isSuperAdmin,
    currentUser,
    schoolProfile,
    currentTenant,
    tenantDomainConfig,
    settings,
    weekendDays,
    officialHolidays,
    messagingGateway,
  } = useCurrentSchoolContext({
    tenants,
    tenantId,
    schoolProfilesMap,
    settingsMap,
    allUsers,
    currentUserRole,
    firebaseUser,
    authenticatedPhone,
  });


  const {
    isOffDay,
    canManageSettings,
    canReviewJustifications,
    canReopenSessions,
    canImportStudents,
    canDispatchDigest,
    canManageOutbox,
    canEditSession,
  } = useAccessFlags({
    currentUserRole,
    isSuperAdmin,
    currentUser,
    weekendDays,
    officialHolidays,
  });

  const {
    parentChildIds,
    students,
    sessions,
    justifications,
    notifications,
    auditLogs,
    users,
    behaviourIncidents,
  } = useScopedEntities({
    allStudents,
    allSessions,
    allJustifications,
    allNotifications,
    allAuditLogs,
    allBehaviourIncidents,
    parentAttendanceRecords,
    allUsers,
    tenantId,
    currentUserRole,
    currentUser,
  });

  const { classesStats, schoolEnrollmentStats } = useSchoolAnalytics({
    allStudents,
    allUsers,
    tenantId,
    configuredClasses: schoolProfile.classes,
  });

  const addAuditLog = useAuditLogger({ tenantId, firebaseUser, setAllAuditLogs });

  const { addBehaviourIncident } = useBehaviourIncidents({
    tenantId,
    currentUser,
    currentUserRole,
    setAllBehaviourIncidents,
    addAuditLog,
  });

  const { createUser, updateUser, deleteUser } = useUserManagement({
    tenantId,
    currentUser,
    currentUserRole,
    allUsers,
    setAllUsers,
    addAuditLog,
  });

  const {
    updateRecord,
    setAllPresentInDraft,
    quickMarkGroupAsPresent,
    submitSession,
    reopenSession,
    createNewSession,
  } = useSessionActions({
    tenantId,
    firebaseUser,
    currentUser,
    canEditSession,
    canReopenSessions,
    allSessions,
    sessions,
    setAllSessions,
    students,
    settings,
    setAllNotifications,
    addAuditLog,
  });

  const { createJustification, reviewJustification, updateJustificationAnalysis } = useJustifications({
    tenantId,
    firebaseUser,
    currentUser,
    currentUserRole,
    parentChildIds,
    canReviewJustifications,
    schoolProfile,
    isOffDay,
    allStudents,
    students,
    justifications,
    settings,
    setAllJustifications,
    setAllSessions,
    setAllNotifications,
    addAuditLog,
  });

  const {
    retryNotification,
    retryAllFailedNotifications,
    sendCustomParentNotification,
    sendChronicWarningNotification,
    sendAllChronicWarningNotifications,
  } = useNotificationOutbox({
    tenantId,
    currentTenant,
    firebaseUser,
    canManageOutbox,
    allNotifications,
    setAllNotifications,
    students,
    settings,
    currentUser,
    addAuditLog,
  });

  const { importStudents, addStudent, updateStudent, transferStudent, restoreStudent, deleteStudent } = useStudentLifecycle({
    tenantId,
    firebaseUser,
    canImportStudents,
    students,
    allStudents,
    setAllStudents,
    schoolClasses: schoolProfile.classes,
    currentUser,
    currentUserRole,
    addAuditLog,
  });

  const { updateSettings, updateSchoolProfile, updateMessagingGateway } = useSchoolSettings({
    tenantId,
    currentUser,
    isSuperAdmin,
    canManageSettings,
    settings,
    schoolProfile,
    setSettingsMap,
    setSchoolProfilesMap,
    addAuditLog,
  });

  const {
    digestConfig,
    digestHistory,
    updateDigestConfig,
    generateCurrentDigest,
    dispatchDailyDigest,
  } = useDailyDigest({
    tenantId,
    tenantName: currentTenant.name,
    currentUser,
    students,
    sessions,
    justifications,
    canDispatchDigest,
    addAuditLog,
  });

  const { provisionNewSchool } = useTenantProvisioning({
    tenantId,
    currentUser,
    dynamicTenants,
    setDynamicTenants,
    setSchoolProfilesMap,
    setSettingsMap,
    setAllUsers,
    addAuditLog,
  });

  return (
    <AttendanceContext.Provider
      value={{
        firebaseUser,
        signInWithGoogle,
        signOutGoogle,
        signInWithCredentials,
        currentTenant,
        tenantDomainConfig,
        tenantSubscription,
        subscriptionAccess,
        refreshSubscription,
        tenants,
        setTenantId,
        currentUser,
        setUserRole,
        lang,
        setLang,
        isSuperAdmin,
        canManageSettings,
        canReviewJustifications,
        canReopenSessions,
        canImportStudents,
        canDispatchDigest,
        canManageOutbox,
        canEditSession,
        provisionNewSchool,
        refreshDynamicTenants: syncTenantsWithServer,
        users,
        createUser,
        updateUser,
        deleteUser,
        students,
        sessions,
        justifications,
        notifications,
        auditLogs,
        settings,
        updateRecord,
        setAllPresentInDraft,
        quickMarkGroupAsPresent,
        submitSession,
        reopenSession,
        createNewSession,
        createJustification,
        reviewJustification,
        updateJustificationAnalysis,
        retryNotification,
        retryAllFailedNotifications,
        sendCustomParentNotification,
        sendChronicWarningNotification,
        sendAllChronicWarningNotifications,
        addAuditLog,
        addStudent,
        updateStudent,
        transferStudent,
        restoreStudent,
        deleteStudent,
        importStudents,
        classesStats,
        schoolEnrollmentStats,
        updateSettings,
        schoolProfile,
        updateSchoolProfile,
        messagingGateway,
        updateMessagingGateway,
        isOffDay,
        weekendDays,
        officialHolidays,
        behaviourIncidents,
        addBehaviourIncident,
        digestConfig,
        digestHistory,
        updateDigestConfig,
        generateCurrentDigest,
        dispatchDailyDigest,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};
