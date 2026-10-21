import { SOSCHAIN_PROFESSIONAL_DEMO_PROFILES } from 'sos-data-utils-ts/portal-access-profiles'

export type EmployeeRoleOption = Readonly<{ value: string; label: string; syntheticOnly?: boolean }>

const ADMINISTRATIVE_ROLES: readonly EmployeeRoleOption[] = Object.freeze([
  Object.freeze({ value: 'organization-manager', label: 'Organization manager' }),
  Object.freeze({ value: 'evidence-reviewer', label: 'Evidence reviewer' }),
  Object.freeze({ value: 'audit-viewer', label: 'Audit viewer' }),
])

const TECH_TEST_ROLES: readonly EmployeeRoleOption[] = Object.freeze([
  ...[...new Map(SOSCHAIN_PROFESSIONAL_DEMO_PROFILES.map(profile => [profile.id, profile])).values()]
    .map(profile => Object.freeze({ value: profile.id, label: `${profile.titleEn} — synthetic test role`, syntheticOnly: true as const })),
  Object.freeze({ value: 'administrative-assistant', label: 'Administrative assistant — synthetic test role', syntheticOnly: true as const }),
])

/** Trusted hostname policy projection. These labels grant no employment or professional authority. */
export function allowedEmployeeRoleOptions(allowedSectors: readonly string[]): readonly EmployeeRoleOption[] {
  return Object.freeze(allowedSectors.includes('antifraud-tech')
    ? [...ADMINISTRATIVE_ROLES, ...TECH_TEST_ROLES]
    : [...ADMINISTRATIVE_ROLES])
}

export function requireAllowedEmployeeRole(role: string, allowedSectors: readonly string[]): string {
  const normalized = String(role || '').trim()
  if (!allowedEmployeeRoleOptions(allowedSectors).some(option => option.value === normalized)) {
    throw new Error('employee_role_not_allowed')
  }
  return normalized
}
