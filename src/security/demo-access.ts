import { resolveControllerAccess, type ControllerAccess } from './controller-authority'

export function localDemoAccess(environment: NodeJS.ProcessEnv = process.env): ControllerAccess {
  if (environment.NODE_ENV === 'production' || environment.CONTROLLER_DEMO_MODE !== 'true') {
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
