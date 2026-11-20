import { NextResponse } from 'next/server'
import { resolvePortalDeployment } from '../config/portal-config'
import type { ControllerFeature } from '../config/controller-features'
import { localDemoAccess } from '../security/demo-access'

export function controllerRouteAccess(request: Request, feature?: ControllerFeature) {
  const deployment = resolvePortalDeployment(request.headers.get('host') || 'localhost')
  if (deployment.kind !== 'organization-controller' || !localDemoAccess().authenticated) {
    return { response: NextResponse.json({ error: 'Not authorized.' }, { status: 401 }) } as const
  }
  if (feature && deployment.disabledControllerFeatures.includes(feature)) {
    return { response: NextResponse.json({ error: 'controller_feature_unsupported' }, { status: 501 }) } as const
  }
  return { deployment } as const
}
