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
