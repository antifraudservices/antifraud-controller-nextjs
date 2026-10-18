import { NextResponse } from 'next/server'
import { localDemoAccess } from '../../../../security/demo-access'
import { localGatewayClient, localOperationReference, sealLocalClaims } from '../../../../server/antifraud-gateway'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (!localDemoAccess().authenticated) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })
  try {
    const intent = await request.json() as {
      subjectReference: string
      target: Readonly<Record<string, unknown>>
      checkReference: string
    }
    const operationId = localOperationReference('identity-evidence')
    const result = await localGatewayClient().recordIdentityEvidence({
      operationId,
      subjectReference: intent.subjectReference,
      targets: [intent.target],
      evidence: [{
        id: intent.checkReference,
        type: 'document',
        observedAt: new Date().toISOString(),
        checks: [{ checkMethod: 'controller-reviewed-evidence', checkId: intent.checkReference }],
      }],
      encryptedClaims: sealLocalClaims(intent),
    })
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Identity evidence failed.' }, { status: 400 })
  }
}
