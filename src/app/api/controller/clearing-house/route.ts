import { controllerRouteAccess } from '../../../../server/controller-route-access'
import { NextResponse } from 'next/server'
import { localGatewayClient } from '../../../../server/antifraud-gateway'
import { ControllerGatewayFailure } from '../../../../server/controller-gateway-capabilities'
import { decideClearingHouseItem, readClearingHouseInbox, type ClearingHouseDecision } from '../../../../server/clearing-house'

export async function GET(request: Request) {
  const access = controllerRouteAccess(request, 'clearing-house')
  if (access.response) return access.response
  try {
    return NextResponse.json(await readClearingHouseInbox(localGatewayClient(true)))
  } catch (error) {
    return NextResponse.json({ error: 'Clearing House inbox failed.' }, { status: error instanceof ControllerGatewayFailure ? error.status : 503 })
  }
}

export async function POST(request: Request) {
  const access = controllerRouteAccess(request, 'clearing-house')
  if (access.response) return access.response
  try {
    return NextResponse.json(await decideClearingHouseItem(localGatewayClient(), await request.json() as ClearingHouseDecision))
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Clearing House decision failed.' }, { status: 400 })
  }
}
