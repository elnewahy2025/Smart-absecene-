// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { TenantSchoolProfile } from '../../types/attendance';
import { DEFAULT_SCHOOL_1_PROFILE } from '../../config/tenantSettings';
import { AddStudentModal } from './AddStudentModal';

const schoolProfileMock = vi.hoisted(() => ({ profile: null as TenantSchoolProfile | null }));

vi.mock('../../context/AttendanceContext', () => ({
  useAttendance: () => ({ schoolProfile: schoolProfileMock.profile }),
}));

afterEach(cleanup);

const renderModal = () =>
  render(
    <AddStudentModal
      isOpen
      onClose={vi.fn()}
      onAddStudent={vi.fn().mockResolvedValue({} as never)}
      classesStats={[]}
      lang="ar"
    />
  );

describe('AddStudentModal phone country code', () => {
  it('follows the country configured in settings even when the stored calling code is stale', () => {
    schoolProfileMock.profile = {
      ...DEFAULT_SCHOOL_1_PROFILE,
      countryCallingCode: '+965', // stale Kuwait code
      address: {
        ...DEFAULT_SCHOOL_1_PROFILE.address,
        country: 'جمهورية مصر العربية',
        countryCallingCode: '+965',
      },
    } as TenantSchoolProfile;

    renderModal();

    // The label shows the resolved prefix for the configured country (Egypt).
    expect(screen.getByText('+20')).toBeTruthy();
    const phoneInput = document.getElementById('addstudentmodal-input-8') as HTMLInputElement;
    expect(phoneInput.placeholder.startsWith('+20')).toBe(true);
    expect(phoneInput.value).toBe('+20');
  });

  it('uses the stored code for a free-text country with no known calling code', () => {
    schoolProfileMock.profile = {
      ...DEFAULT_SCHOOL_1_PROFILE,
      countryCallingCode: '+1',
      address: {
        ...DEFAULT_SCHOOL_1_PROFILE.address,
        country: 'Atlantis',
        countryCallingCode: '+1',
      },
    } as TenantSchoolProfile;

    renderModal();

    expect(screen.getByText('+1')).toBeTruthy();
    const phoneInput = document.getElementById('addstudentmodal-input-8') as HTMLInputElement;
    expect(phoneInput.value).toBe('+1');
  });
});
