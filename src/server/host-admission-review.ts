import type { VersionedAdmissionPolicy } from '../config/host-admission-policy'
import type { HostAdmissionScope } from '../security/host-admission-authority'
import type { AdmissionDecisionRecord, AdmissionDecisionScope, VerifiedAdmissionEvidence } from './gateway-admission-decision'

export type AdmissionDecisionFilter = AdmissionDecisionRecord['decision']

export type AdmissionReviewScope = HostAdmissionScope & Readonly<{ jurisdiction: string }>
export type AdmissionReviewItem = AdmissionDecisionRecord & Readonly<{
  decisionRevision: number
  policyRevision: number
  policySnapshot?: Readonly<{ policy: VersionedAdmissionPolicy; eligibleCountries: readonly string[] }>
  source?: 'policy' | 'reviewer'
  evidence?: VerifiedAdmissionEvidence
}>

export type ManualAdmissionResult =
  | Readonly<{ status: 'saved'; record: AdmissionReviewItem }>
  | Readonly<{ status: 'conflict' | 'not-found' | 'verification-required' }>

type ReviewPorts = Readonly<{
  resolveScope(request: Request): AdmissionReviewScope | undefined
  authorize(authorization: string, scope: HostAdmissionScope, jurisdiction: string): Promise<Readonly<{ uid: string }> | undefined>
  listAdmissionDecisions(scope: AdmissionReviewScope, decision: AdmissionDecisionFilter, cursor?: string): Promise<readonly AdmissionReviewItem[]>
  reviewDecision(scope: AdmissionDecisionScope, revision: number, decision: 'approved' | 'rejected', actorUid: string): Promise<ManualAdmissionResult>
}>

const bindingFormat = /^[a-f0-9]{64}$/
const responseHeaders = { 'cache-control': 'no-store' }

export async function handleHostAdmissionReview(request: Request, ports: ReviewPorts): Promise<Response> {
  const scope = ports.resolveScope(request)
  if (!scope) return Response.json({ error: 'Invalid admission review scope.' }, { status: 400 })
  const actor = await ports.authorize(request.headers.get('authorization') || '', scope, scope.jurisdiction)
  if (!actor) return Response.json({ error: 'Admission reviewer assignment required.' }, { status: 403 })

  if (request.method === 'GET') {
    const filters = new URL(request.url).searchParams
    const decision = filters.get('decision') ?? 'review'
    if (decision !== 'review' && decision !== 'approved' && decision !== 'rejected') {
      return Response.json({ error: 'Invalid decision filter.' }, { status: 400 })
    }
    const cursor = filters.get('cursor')
    if (cursor !== null && !bindingFormat.test(cursor)) return Response.json({ error: 'Invalid cursor.' }, { status: 400 })
    const items = cursor === null
      ? await ports.listAdmissionDecisions(scope, decision)
      : await ports.listAdmissionDecisions(scope, decision, cursor)
    return Response.json({ items, ...(items.length === 50 ? { cursor: items[49].binding } : {}) }, { headers: responseHeaders })
  }
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed.' }, { status: 405 })

  const submitted: unknown = await request.json().catch(() => undefined)
  if (!submitted || typeof submitted !== 'object' || Array.isArray(submitted)) {
    return Response.json({ error: 'Invalid admission decision.' }, { status: 400 })
  }
  const { binding, revision, decision } = submitted as Record<string, unknown>
  if (Object.keys(submitted).length !== 3 || typeof binding !== 'string' || !bindingFormat.test(binding)
    || typeof revision !== 'number' || !Number.isSafeInteger(revision) || revision < 1
    || (decision !== 'approved' && decision !== 'rejected')) {
    return Response.json({ error: 'Invalid admission decision.' }, { status: 400 })
  }
  const result = await ports.reviewDecision({ ...scope, binding }, revision, decision, actor.uid)
  if (result.status === 'saved') return Response.json({ item: result.record }, { headers: responseHeaders })
  if (result.status === 'not-found') return Response.json({ error: 'Admission case was not found in this scope.' }, { status: 404 })
  if (result.status === 'verification-required') return Response.json({ error: 'Verified ICA organization evidence is required before approval.' }, { status: 422 })
  return Response.json({ error: 'Admission case has changed. Reload the queue before deciding.' }, { status: 409 })
}
