import type { TenantDomainConfig } from '../src/config/tenantRegistry';

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  role: string;
  tenantId: string;
  displayName?: string;
  phoneNumber?: string;
  [key: string]: unknown;
}

export interface TenantResolution {
  status: 'resolved' | 'inactive_tenant' | 'unknown_domain';
  tenantId?: string;
  config?: TenantDomainConfig;
  normalizedHostname: string;
}

export interface ManagedAccountInput {
  tenantId: string;
  email: string;
  name?: string;
  role: string;
  phone?: string;
  jobTitle?: string;
  status?: string;
  assignedClasses?: string[];
  assignedSubjects?: string[];
  password?: string;
}

export interface ManagedAccountOptions {
  allowExisting?: boolean;
  resetPassword?: boolean;
  skipRoleVerification?: boolean;
}

export interface ManagedAccountResult {
  uid: string;
  password: string;
  created: boolean;
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      hostTenant?: TenantResolution;
    }
  }
}
