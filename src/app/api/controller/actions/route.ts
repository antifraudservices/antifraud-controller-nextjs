import { NextResponse } from 'next/server'
import { localGatewayClient } from '../../../../server/antifraud-gateway'
import { executeControllerAction, type ControllerAction } from '../../../../server/controller-administration'
import { resolvePortalDeployment } from '../../../../config/portal-config'
import { allowedEmployeeRoleOptions } from '../../../../server/professional-role-policy'

export async function POST(request: Request) {
  try {
    const action = await request.json() as ControllerAction
    const deployment = resolvePortalDeployment(request.headers.get('host') || 'localhost')
    const allowedEmployeeRoles = allowedEmployeeRoleOptions(deployment.allowedSectors).map(role => role.value)
    return NextResponse.json(await executeControllerAction(localGatewayClient(), action, { allowedEmployeeRoles }))
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Controller action failed.' }, { status: 400 })
  }
}
