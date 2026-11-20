import { verifyFirebasePhoneSession } from './firebase-phone-session'

export type HostAdmissionScope = Readonly<{
  hostDid: string
  network: string
  sector: string
}>

export type HostAdmissionAssignment = HostAdmissionScope & Readonly<{
  uid: string
  phoneNumber: string
  managePolicy?: boolean
  reviewJurisdictions?: readonly string[]
}>

/** The verifier must validate the ID token for the configured Firebase project. */
export async function authorizeHostAdmissionController(
  authorization: string,
  scope: HostAdmissionScope,
  assignments: readonly HostAdmissionAssignment[],
  verify: Parameters<typeof verifyFirebasePhoneSession>[1],
  reviewJurisdiction?: string,
): Promise<Readonly<{ uid: string }> | undefined> {
  if (scope.network !== 'test-network') return undefined
  const session = await verifyFirebasePhoneSession(authorization, verify)
  if (!session) return undefined

  const assigned = assignments.some(assignment =>
    assignment.uid === session.uid
    && assignment.phoneNumber === session.phone
    && assignment.hostDid === scope.hostDid
    && assignment.network === scope.network
    && assignment.sector === scope.sector
    && (reviewJurisdiction === undefined
      ? assignment.managePolicy === undefined || assignment.managePolicy === true
      : Array.isArray(assignment.reviewJurisdictions) && assignment.reviewJurisdictions.includes(reviewJurisdiction)),
  )
  return assigned ? { uid: session.uid } : undefined
}
