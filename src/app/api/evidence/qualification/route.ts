import { NextResponse } from 'next/server'
import { localDemoAccess } from '../../../../security/demo-access'
import { localGatewayClient, localOperationReference } from '../../../../server/antifraud-gateway'
import { normalizeQualificationEvidenceIntent } from '../../../../server/qualification-evidence-intent'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (!localDemoAccess().authenticated) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })
  try {
    const intent = normalizeQualificationEvidenceIntent(await request.json())
    const result = await localGatewayClient().recordQualificationEvidence({
      evidenceId: localOperationReference('qualification-evidence'),
      subjectReference: `employee:${intent.employeeId}`,
      issuer: {
        legalIdentifier: intent.issuer.legalIdentifier,
        jurisdiction: intent.issuer.jurisdiction,
      },
      qualificationReference: `${intent.qualification.identifier.system}|${intent.qualification.identifier.value}`,
      documentCid: intent.evidence.contentId,
      confidentialClaims: intent,
    })
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Qualification evidence failed.' }, { status: 400 })
  }
}
