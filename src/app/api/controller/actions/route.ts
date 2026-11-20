import { controllerRouteAccess } from '../../../../server/controller-route-access'
import { NextResponse } from 'next/server'
import { controllerWorkspaceResult } from '../../../../server/controller-gateway-capabilities'
import { localGatewayClient } from '../../../../server/antifraud-gateway'
import { executeControllerAction, type ControllerAction } from '../../../../server/controller-administration'
import { allowedEmployeeRoleOptions } from '../../../../server/professional-role-policy'
import { allowedGroupTemplateOptions } from '../../../../server/organization-group-policy'

export async function POST(request: Request) {
  try {
    const access = controllerRouteAccess(request)
    if (access.response) return access.response
    const action = await request.json() as ControllerAction
    const deployment = access.deployment
    const disabledFeatures = deployment.disabledControllerFeatures
    const allowedEmployeeRoles = allowedEmployeeRoleOptions(deployment.allowedSectors).map(role => role.value)
    const allowedGroupTemplates = allowedGroupTemplateOptions(deployment.allowedSectors).map(template => template.value)
    const workspace = await executeControllerAction(localGatewayClient(), action, {
      allowedEmployeeRoles, allowedGroupTemplates, disabledFeatures,
    })
    return NextResponse.json(controllerWorkspaceResult(workspace, disabledFeatures))
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Controller action failed.' }, { status: 400 })
  }
}
