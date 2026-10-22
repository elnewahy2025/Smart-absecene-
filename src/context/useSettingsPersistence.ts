import { useEffect, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { db } from '../lib/firebase';
import { authenticatedFetch } from '../lib/api';
import { getDefaultSchoolSettings } from '../config/defaultSettings';
import { getDefaultSchoolProfile } from '../config/tenantSettings';
import type { SchoolSettings, TenantSchoolProfile } from '../types/attendance';

interface SettingsPersistenceDeps {
  firebaseUser: FirebaseUser | null;
  tenantId: string;
  isSuperAdmin: boolean;
  canManageSettings: boolean;
  settingsMap: Record<string, SchoolSettings>;
  schoolProfilesMap: Record<string, TenantSchoolProfile>;
  setSettingsMap: React.Dispatch<React.SetStateAction<Record<string, SchoolSettings>>>;
  setSchoolProfilesMap: React.Dispatch<React.SetStateAction<Record<string, TenantSchoolProfile>>>;
}

/**
 * Settings persistence: Firestore is the source of truth, localCache is only a cache.
 * Also loads the server-owned messaging gateway credentials for the platform owner.
 */
export function useSettingsPersistence({
  firebaseUser,
  tenantId,
  isSuperAdmin,
  canManageSettings,
  settingsMap,
  schoolProfilesMap,
  setSettingsMap,
  setSchoolProfilesMap,
}: SettingsPersistenceDeps) {
  const settingsHydratedRef = useRef(false);
  const lastSettingsHashRef = useRef('');

  useEffect(() => {
    if (!firebaseUser) {
      settingsHydratedRef.current = false;
      return;
    }

    const settingsRef = doc(db, 'settings', tenantId);
    const unsubscribe = onSnapshot(
      settingsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as any;
          if (data?.settings) {
            setSettingsMap((prev) => {
              const current = prev[tenantId] || getDefaultSchoolSettings(tenantId);
              return {
                ...prev,
                [tenantId]: {
                  ...current,
                  ...data.settings,
                  messagingGateway: current.messagingGateway,
                },
              };
            });
          }
          if (data?.schoolProfile) {
            setSchoolProfilesMap((prev) => {
              const current = prev[tenantId] || getDefaultSchoolProfile(tenantId);
              return {
                ...prev,
                [tenantId]: {
                  ...current,
                  ...data.schoolProfile,
                  messagingGateway: current.messagingGateway,
                },
              };
            });
          }
        }
        settingsHydratedRef.current = true;
      },
      (error) => {
        console.error('[SETTINGS] Could not load shared settings:', error);
        settingsHydratedRef.current = true;
      }
    );

    return () => unsubscribe();
  }, [firebaseUser, tenantId]);

  // Gateway credentials are server-owned and encrypted at rest. Only the
  // platform owner may fetch them; school admins never see the document.
  useEffect(() => {
    if (!firebaseUser || !isSuperAdmin) return;

    let cancelled = false;
    void (async () => {
      try {
        const response = await authenticatedFetch('/api/settings/messaging-gateway');
        if (!response.ok) return;
        const payload = await response.json().catch(() => null);
        const gateway = payload?.gateway;
        if (cancelled || !gateway) return;

        setSettingsMap((prev) => ({
          ...prev,
          [tenantId]: {
            ...(prev[tenantId] || getDefaultSchoolSettings(tenantId)),
            messagingGateway: gateway,
          },
        }));
        setSchoolProfilesMap((prev) => ({
          ...prev,
          [tenantId]: {
            ...(prev[tenantId] || getDefaultSchoolProfile(tenantId)),
            messagingGateway: gateway,
          },
        }));
      } catch (error) {
        console.warn('[SETTINGS] Could not load messaging gateway:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [firebaseUser, tenantId, isSuperAdmin]);

  useEffect(() => {
    if (!firebaseUser || !canManageSettings || !settingsHydratedRef.current) return;

    const timer = setTimeout(() => {
      const currentSettings =
        settingsMap[tenantId] || getDefaultSchoolSettings(tenantId);
      const currentProfile = schoolProfilesMap[tenantId] || getDefaultSchoolProfile(tenantId);
      const { messagingGateway: gatewayFromSettings, ...settingsForStore } = currentSettings;
      const { messagingGateway: gatewayFromProfile, ...profileForStore } = currentProfile;
      const timestamp = new Date().toISOString();
      const payload = {
        settings: settingsForStore,
        schoolProfile: profileForStore,
        updatedAt: timestamp,
        updatedBy: firebaseUser.uid,
      };
      const hash = JSON.stringify(payload);
      if (hash === lastSettingsHashRef.current) return;
      lastSettingsHashRef.current = hash;

      void setDoc(doc(db, 'settings', tenantId), payload, { merge: true }).catch((error) =>
        console.error('[SETTINGS] Could not persist shared settings:', error)
      );
    }, 1200);

    return () => clearTimeout(timer);
  }, [settingsMap, schoolProfilesMap, tenantId, firebaseUser, canManageSettings]);
}
