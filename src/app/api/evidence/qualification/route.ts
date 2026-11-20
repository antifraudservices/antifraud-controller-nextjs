import { controllerRouteAccess } from '../../../../server/controller-route-access'
import { NextResponse } from 'next/server'
import { localGatewayClient, localOperationReference } from '../../../../server/antifraud-gateway'
import { normalizeQualificationEvidenceIntent } from '../../../../server/qualification-evidence-intent'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const access = controllerRouteAccess(request, 'qualification-evidence')
  if (access.response) return access.response
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
