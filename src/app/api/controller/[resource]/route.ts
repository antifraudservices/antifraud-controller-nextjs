import { NextResponse } from 'next/server'
import { CONTROLLER_RESOURCES, type ControllerResource } from '../../../../config/controller-resources'
import { controllerRouteAccess } from '../../../../server/controller-route-access'
import { localGatewayClient } from '../../../../server/antifraud-gateway'
import { ControllerGatewayFailure } from '../../../../server/controller-gateway-capabilities'

export async function GET(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  const access = controllerRouteAccess(request)
  if (access.response) return access.response
  const { resource: name } = await params
  if (!Object.hasOwn(CONTROLLER_RESOURCES, name)) return NextResponse.json({ error: 'Unknown resource.' }, { status: 404 })
  const resource = name as ControllerResource
  if (CONTROLLER_RESOURCES[resource].every(feature => access.deployment.disabledControllerFeatures.includes(feature))) {
    return NextResponse.json({ error: 'controller_feature_unsupported' }, { status: 501 })
  }

  const filters = new URL(request.url).searchParams
  const allowed = resource === 'employees' ? ['email', 'role', 'reference'] : resource === 'devices' ? ['reference'] : []
  if ([...filters.keys()].some(key => !allowed.includes(key) || filters.getAll(key).length !== 1 || !filters.get(key)?.trim())) {
    return NextResponse.json({ error: 'Invalid controller resource filter.' }, { status: 400 })
  }

  try {
    const data = await localGatewayClient(true).readControllerResource(resource, Object.fromEntries(filters))
    return NextResponse.json(data, { headers: { 'cache-control': 'no-store' } })
  } catch (error) {
    const status = error instanceof ControllerGatewayFailure ? error.status : 502
    return NextResponse.json({ error: 'The connected gateway did not complete the request.' }, { status })
  }
}
