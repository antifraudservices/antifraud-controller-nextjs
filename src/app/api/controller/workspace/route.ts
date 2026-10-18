import { NextResponse } from 'next/server'
import { localGatewayClient } from '../../../../server/antifraud-gateway'

export async function GET() {
  try {
    return NextResponse.json(await localGatewayClient().readControllerWorkspace())
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Controller workspace failed.' }, { status: 400 })
  }
}
