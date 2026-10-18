import { NextResponse } from 'next/server'
import { localDemoAccess } from '../../../../security/demo-access'
import { localGatewayClient, localOperationReference, sealLocalClaims } from '../../../../server/antifraud-gateway'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (!localDemoAccess().authenticated) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })
  try {
    const intent = await request.json() as {
      employeeId: string
      qualification: { identifier: { system: string; value: string } }
      issuer: { legalIdentifier: string; jurisdiction: string }
      evidence: { contentId: string }
    }
    const result = await localGatewayClient().recordQualificationEvidence({
      evidenceId: localOperationReference('qualification-evidence'),
      subjectReference: `employee:${intent.employeeId}`,
      issuer: {
        legalIdentifier: intent.issuer.legalIdentifier,
        jurisdiction: intent.issuer.jurisdiction,
      },
      qualificationReference: `${intent.qualification.identifier.system}|${intent.qualification.identifier.value}`,
      documentCid: intent.evidence.contentId,
      encryptedClaims: sealLocalClaims(intent),
    })
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Qualification evidence failed.' }, { status: 400 })
  }
}
