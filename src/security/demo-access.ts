import { resolveControllerAccess, type ControllerAccess } from './controller-authority'

export function localDemoAccess(environment: NodeJS.ProcessEnv = process.env): ControllerAccess {
  const enabledLocally = environment.NODE_ENV !== 'production'
  const enabledForHostedDemo = environment.NODE_ENV === 'production'
    && ['beta', 'staging'].includes(environment.CONTROLLER_DEPLOYMENT_STAGE ?? '')
  if (environment.CONTROLLER_DEMO_MODE !== 'true' || (!enabledLocally && !enabledForHostedDemo)) {
    return resolveControllerAccess(undefined)
  }

  return resolveControllerAccess({
    verified: true,
    subject: 'did:web:controller.demo.invalid',
    organizationId: 'Organization/northstar-emergency-services',
    capabilities: [
      'organization.read',
      'members.read',
      'members.invite',
      'services.read',
      'devices.read',
      'audit.read',
    ],
  })
}
