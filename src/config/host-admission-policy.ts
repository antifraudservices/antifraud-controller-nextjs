export const ADMISSION_CONDITIONS = Object.freeze({
  'signed-application-template': 'Valid application template and digital certificate signature',
  'legal-identifier-match': 'Matching organization identifier',
  'official-registry-active': 'Active record in an official registry',
  'regional-marketplace-entry': 'Matching entry in the regional sector directory',
})

export type AdmissionCondition = keyof typeof ADMISSION_CONDITIONS

export function supportsAutomaticAdmission(network: string, sector: string): boolean {
  return network === 'test-network' && /^[a-z0-9]+(?:-[a-z0-9]+)*-tech$/.test(sector)
}

export const REQUIRED_ORGANIZATION_CHECKS = ['legal-identifier-match', 'official-registry-active'] as const

export function hasVerifiedOrganizationChecks(checks: readonly AdmissionCondition[] | undefined): boolean {
  return REQUIRED_ORGANIZATION_CHECKS.every(condition => checks?.includes(condition))
}

export type AdmissionPolicy =
  | Readonly<{ mode: 'review' }>
  | Readonly<{
    mode: 'automatic-after-verification'
    countries: { kind: 'all' } | { kind: 'selected'; codes: readonly string[] }
    conditions?: readonly AdmissionCondition[]
  }>

export type VersionedAdmissionPolicy = AdmissionPolicy & Readonly<{ revision: number }>
