import { controllerGatewayFailureStatus } from '../../../../config/controller-features'
import { controllerRouteAccess } from '../../../../server/controller-route-access'
import { NextResponse } from 'next/server'
import { localGatewayClient } from '../../../../server/antifraud-gateway'
import { ControllerGatewayFailure, controllerWorkspaceResult } from '../../../../server/controller-gateway-capabilities'

export async function GET(request: Request) {
  const access = controllerRouteAccess(request)
  if (access.response) return access.response
  const disabled = access.deployment.disabledControllerFeatures
  try {
    const workspace = await localGatewayClient(true).readControllerWorkspace()
    return NextResponse.json(controllerWorkspaceResult(workspace, disabled))
  } catch (error) {
    const status = error instanceof ControllerGatewayFailure ? controllerGatewayFailureStatus(error.status) : 'unavailable'
    return NextResponse.json(controllerWorkspaceResult(undefined, disabled, status))
  }
}
