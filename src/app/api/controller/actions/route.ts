import { NextResponse } from 'next/server'
import { localGatewayClient } from '../../../../server/antifraud-gateway'
import { executeControllerAction, type ControllerAction } from '../../../../server/controller-administration'
import { resolvePortalDeployment } from '../../../../config/portal-config'
import { allowedEmployeeRoleOptions } from '../../../../server/professional-role-policy'
import { allowedGroupTemplateOptions } from '../../../../server/organization-group-policy'

export async function POST(request: Request) {
  try {
    const action = await request.json() as ControllerAction
    const deployment = resolvePortalDeployment(request.headers.get('host') || 'localhost')
    const allowedEmployeeRoles = allowedEmployeeRoleOptions(deployment.allowedSectors).map(role => role.value)
    const allowedGroupTemplates = allowedGroupTemplateOptions(deployment.allowedSectors).map(template => template.value)
    return NextResponse.json(await executeControllerAction(localGatewayClient(), action, { allowedEmployeeRoles, allowedGroupTemplates }))
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Controller action failed.' }, { status: 400 })
  }
}
