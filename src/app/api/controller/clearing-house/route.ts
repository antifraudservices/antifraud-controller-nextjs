import { NextResponse } from 'next/server'
import { localGatewayClient } from '../../../../server/antifraud-gateway'
import { decideClearingHouseItem, readClearingHouseInbox, type ClearingHouseDecision } from '../../../../server/clearing-house'

export async function GET() {
  try {
    return NextResponse.json(await readClearingHouseInbox(localGatewayClient()))
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Clearing House inbox failed.' }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    return NextResponse.json(await decideClearingHouseItem(localGatewayClient(), await request.json() as ClearingHouseDecision))
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Clearing House decision failed.' }, { status: 400 })
  }
}
