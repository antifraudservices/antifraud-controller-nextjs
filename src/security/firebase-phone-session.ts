type FirebasePhoneSession = Readonly<{
  uid: string
  phone_number?: string
  firebase?: Readonly<{ sign_in_provider?: string }>
}>

/** The verifier must authenticate the token against the configured Firebase project. */
export async function verifyFirebasePhoneSession(
  authorization: string,
  verify: (token: string) => Promise<FirebasePhoneSession>,
) {
  const token = /^Bearer ([^\s]+)$/i.exec(authorization)?.[1]
  if (!token) return undefined
  try {
    const session = await verify(token)
    if (session.firebase?.sign_in_provider !== 'phone' || !session.uid
      || !session.phone_number || !/^\+[1-9]\d{1,14}$/.test(session.phone_number)) return undefined
    return { uid: session.uid, phone: session.phone_number, token }
  } catch {
    return undefined
  }
}
