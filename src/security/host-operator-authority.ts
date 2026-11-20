export type HostOperatorAccess = Readonly<{ authenticated: false } | { authenticated: true; subject: string }>

export function resolveHostOperatorAccess(environment: NodeJS.ProcessEnv = process.env): HostOperatorAccess {
  const locallyAllowed = environment.NODE_ENV !== 'production'
  const stagingAllowed = environment.NODE_ENV === 'production'
    && environment.CONTROLLER_DEPLOYMENT_STAGE === 'staging'
  const subject = environment.HOST_CONTROLLER_DEMO_SUBJECT?.trim()
  if (environment.HOST_CONTROLLER_DEMO_MODE !== 'true' || (!locallyAllowed && !stagingAllowed) || !subject) {
    return Object.freeze({ authenticated: false })
  }
  return Object.freeze({ authenticated: true, subject })
}

/** Verifies the operator's own token before forwarding it to the selected host. */
export async function authorizeHostDirectoryOperator(
  authorization: string,
  expectedUid: string | undefined,
  verify: (token: string) => Promise<Readonly<{ uid: string }>>,
): Promise<string | undefined> {
  const credential = /^Bearer ([^\s]+)$/i.exec(authorization)?.[1]
  if (!expectedUid || !credential) return undefined
  try {
    return (await verify(credential)).uid === expectedUid ? credential : undefined
  } catch {
    return undefined
  }
}
