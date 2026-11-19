import { getApps, initializeApp, type App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { readPortalEnvironment, resolvePortalDeployment } from '../config/portal-config'
import { authorizeHostAdmissionController, type HostAdmissionAssignment, type HostAdmissionScope } from '../security/host-admission-authority'

/** Admission settings and decision lookups use the same online Firebase project. */
export function getHostAdmissionFirebaseApp() {
  const projectId = process.env.ANTIFRAUD_ADMISSION_FIREBASE_PROJECT_ID?.trim()
  if (!projectId || process.env.FIREBASE_AUTH_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error('Online admission policy service is unavailable.')
  }
  const name = 'host-admission-test-network'
  return getApps().find(app => app.name === name) || initializeApp({ projectId }, name)
}

export function getConfiguredAdmissionHostDid() {
  const url = URL.parse(process.env.SOS_GATEWAY_HOST_BASE_URL || '')
  return url?.protocol === 'https:' && !url.port && !url.username && !url.password ? `did:web:${url.hostname}` : undefined
}

export function getEnabledAdmissionCountries(jurisdictions: readonly string[]): string[] {
  return [...new Set(jurisdictions.flatMap(jurisdiction => {
    const country = /^([A-Z]{2})(?:-[A-Z0-9]{1,3})?$/.exec(jurisdiction)?.[1]
    return country ? [country] : []
  }))].sort()
}

export function resolveHostAdmissionRequest(request: Request) {
  const deployment = resolvePortalDeployment(request.headers.get('host') || 'localhost')
  const network = process.env.SOS_GATEWAY_HOST_NETWORK
  if (deployment.kind !== 'host-controller' || !deployment.modules.includes('host-organizations')
    || readPortalEnvironment().active !== 'test-network' || network !== 'test-network') return undefined
  const sector = new URL(request.url).searchParams.get('sector')
  const hostDid = getConfiguredAdmissionHostDid()
  if (!hostDid || !sector || !deployment.allowedSectors.includes(sector)) return undefined
  return { scope: { hostDid, network, sector }, allowedJurisdictions: deployment.allowedJurisdictions }
}

export function createHostAdmissionSessionAuthorizer(app: App) {
  const parsed: unknown = JSON.parse(process.env.ANTIFRAUD_ADMISSION_CONTROLLER_ASSIGNMENTS_JSON || '[]')
  const assignments: HostAdmissionAssignment[] = Array.isArray(parsed)
    ? parsed.filter(row => row && ['uid', 'phoneNumber', 'hostDid', 'network', 'sector'].every(key => typeof row[key] === 'string'))
    : []
  const auth = getAuth(app)
  return (authorization: string, scope: HostAdmissionScope, jurisdiction?: string) =>
    authorizeHostAdmissionController(authorization, scope, assignments, token => auth.verifyIdToken(token, true), jurisdiction)
}
