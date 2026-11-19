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

type FirebasePhoneSession = Readonly<{
  uid: string
  phone_number?: string
  firebase?: Readonly<{ sign_in_provider?: string }>
}>

/** The verifier must validate the ID token for the configured Firebase project. */
export async function authorizeHostAdmissionController(
  authorization: string,
  scope: HostAdmissionScope,
  assignments: readonly HostAdmissionAssignment[],
  verify: (token: string) => Promise<FirebasePhoneSession>,
  reviewJurisdiction?: string,
): Promise<Readonly<{ uid: string }> | undefined> {
  const token = /^Bearer ([^\s]+)$/i.exec(authorization)?.[1]
  if (!token || scope.network !== 'test-network') return undefined

  let session: FirebasePhoneSession
  try {
    session = await verify(token)
  } catch {
    return undefined
  }
  if (session.firebase?.sign_in_provider !== 'phone'
    || !session.uid || !session.phone_number || !/^\+[1-9]\d{1,14}$/.test(session.phone_number)) {
    return undefined
  }

  const assigned = assignments.some(assignment =>
    assignment.uid === session.uid
    && assignment.phoneNumber === session.phone_number
    && assignment.hostDid === scope.hostDid
    && assignment.network === scope.network
    && assignment.sector === scope.sector
    && (reviewJurisdiction === undefined
      ? assignment.managePolicy === undefined || assignment.managePolicy === true
      : Array.isArray(assignment.reviewJurisdictions) && assignment.reviewJurisdictions.includes(reviewJurisdiction)),
  )
  return assigned ? { uid: session.uid } : undefined
}
