import type { Dispatch, SetStateAction } from 'react';
import type {
  AuditLog,
  StudentBehaviourIncident,
  UserProfile,
  UserRole,
} from '../types/attendance';
import { localCache } from '../utils/localCache';

interface UseBehaviourIncidentsParams {
  tenantId: string;
  currentUser: UserProfile;
  currentUserRole: UserRole;
  setAllBehaviourIncidents: Dispatch<SetStateAction<StudentBehaviourIncident[]>>;
  addAuditLog: (entry: Omit<AuditLog, 'id' | 'tenantId' | 'timestamp'>) => void;
}

export function useBehaviourIncidents({
  tenantId,
  currentUser,
  currentUserRole,
  setAllBehaviourIncidents,
  addAuditLog,
}: UseBehaviourIncidentsParams) {
  const addBehaviourIncident = (incident: Omit<StudentBehaviourIncident, 'id' | 'tenantId'>): StudentBehaviourIncident => {
    const id = `beh-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newIncident: StudentBehaviourIncident = {
      ...incident,
      id,
      tenantId,
    };

    setAllBehaviourIncidents((prev) => {
      const updated = [newIncident, ...prev];
      if (typeof localCache !== 'undefined') {
        localCache.setItem('school_behaviour_incidents', JSON.stringify(updated));
      }
      return updated;
    });

    addAuditLog({
      action: 'create',
      entityType: 'student',
      entityId: id,
      performerId: currentUser.id,
      performerRole: currentUserRole,
      performerName: currentUser.name,
      details: `تم تدوين واقعة سلوكية (${incident.type === 'positive' ? 'إيجابية' : 'مخالفة'}): ${incident.title} للطالب ${incident.studentName}`,
      detailsEn: `A behaviour incident was recorded (${incident.type === 'positive' ? 'Positive' : 'Violation'}): ${incident.title} for student ${incident.studentName}`,
    });

    return newIncident;
  };
  return { addBehaviourIncident };
}
