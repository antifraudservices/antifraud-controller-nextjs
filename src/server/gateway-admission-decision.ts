import { createHash, timingSafeEqual } from 'node:crypto'
import { ADMISSION_CONDITIONS, type AdmissionCondition } from '../config/host-admission-policy'

export type AdmissionDecisionScope = Readonly<{
  hostDid: string
  network: string
  jurisdiction: string
  sector: string
  binding: string
  applicationId?: string
}>

export type AdmissionDecisionRecord = AdmissionDecisionScope & Readonly<{
  decision: 'approved' | 'review' | 'rejected'
  reference: string
}>

export type VerifiedAdmissionEvidence = Readonly<{
  applicationId: string
  reference: string
  checks: readonly AdmissionCondition[]
}>

const decisionScopeKeys = ['hostDid', 'network', 'jurisdiction', 'sector', 'binding'] as const
const applicationIdFormat = /^[a-zA-Z0-9._:-]{1,200}$/
const hash = (value: string) => createHash('sha256').update(value).digest()

function readVerifiedEvidence(value: unknown): VerifiedAdmissionEvidence | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const item = value as Record<string, unknown>
  if (Object.keys(item).length !== 3
    || typeof item.applicationId !== 'string' || !item.applicationId.trim() || item.applicationId.length > 200
    || typeof item.reference !== 'string' || !item.reference.trim() || item.reference.length > 512
    || !Array.isArray(item.checks) || item.checks.length > Object.keys(ADMISSION_CONDITIONS).length
    || item.checks.some(check => typeof check !== 'string' || !Object.hasOwn(ADMISSION_CONDITIONS, check))) return undefined
  return { applicationId: item.applicationId, reference: item.reference, checks: [...new Set<AdmissionCondition>(item.checks)].sort() }
}

export async function handleGatewayAdmissionDecision(
  request: Request,
  expected: Readonly<{ bearer: string; hostDid: string; network: string }>,
  resolve: (scope: AdmissionDecisionScope, evidence: VerifiedAdmissionEvidence | undefined) => Promise<AdmissionDecisionRecord | undefined>,
): Promise<Response> {
  const bearer = /^Bearer ([^\s]+)$/i.exec(request.headers.get('authorization') || '')?.[1]
  if (!bearer || !expected.bearer || !timingSafeEqual(hash(bearer), hash(expected.bearer))) {
    return Response.json({ error: 'Gateway authorization required.' }, { status: 403 })
  }

  const value: unknown = await request.json().catch(() => undefined)
  if (!value || typeof value !== 'object' || Array.isArray(value)) return Response.json({ error: 'Invalid decision scope.' }, { status: 400 })
  const candidate = value as Record<string, unknown>
  if (Object.keys(candidate).some(key => key !== 'evidence' && key !== 'applicationId' && !decisionScopeKeys.some(scopeKey => scopeKey === key))
    || candidate.hostDid !== expected.hostDid || candidate.network !== expected.network
    || typeof candidate.jurisdiction !== 'string' || !/^[A-Z]{2}(?:-[A-Z0-9]{1,3})?$/.test(candidate.jurisdiction)
    || typeof candidate.sector !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(candidate.sector)
    || typeof candidate.binding !== 'string' || !/^[a-f0-9]{64}$/.test(candidate.binding)) {
    return Response.json({ error: 'Invalid decision scope.' }, { status: 400 })
  }

  const applicationId = candidate.applicationId
  if ('applicationId' in candidate && (typeof applicationId !== 'string' || !applicationIdFormat.test(applicationId))) {
    return Response.json({ error: 'Invalid application reference.' }, { status: 400 })
  }
  const evidence = readVerifiedEvidence(candidate.evidence)
  if ('evidence' in candidate && !evidence) return Response.json({ error: 'Invalid ICA evidence.' }, { status: 400 })
  if (applicationId && evidence && evidence.applicationId !== applicationId) {
    return Response.json({ error: 'ICA evidence belongs to a different application.' }, { status: 400 })
  }
  const scope = {
    hostDid: expected.hostDid, network: expected.network, jurisdiction: candidate.jurisdiction,
    sector: candidate.sector, binding: candidate.binding,
    ...(typeof applicationId === 'string' ? { applicationId } : {}),
  }
  const record = await resolve(scope, evidence)
  const matches = record && decisionScopeKeys.every(key => record[key] === candidate[key])
    && ['approved', 'review', 'rejected'].includes(record.decision) && record.reference?.trim()
  return Response.json(
    matches ? { binding: candidate.binding, decision: record.decision, reference: record.reference } : { binding: candidate.binding, decision: 'review' },
    { headers: { 'cache-control': 'no-store' } },
  )
}
