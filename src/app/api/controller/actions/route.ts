import { NextResponse } from 'next/server'
import { localGatewayClient } from '../../../../server/antifraud-gateway'
import { executeControllerAction, type ControllerAction } from '../../../../server/controller-administration'

export async function POST(request: Request) {
  try {
    const action = await request.json() as ControllerAction
    return NextResponse.json(await executeControllerAction(localGatewayClient(), action))
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Controller action failed.' }, { status: 400 })
  }
}
