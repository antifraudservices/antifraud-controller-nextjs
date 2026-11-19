// Flow contract: only a phone-authenticated reviewer with an exact host and jurisdiction grant can inspect the queue or record a revision-bound decision.
import { describe, expect, it, vi } from 'vitest'
import { handleHostAdmissionReview } from '../src/server/host-admission-review'

const scope = { hostDid: 'did:web:host.example', network: 'test-network', sector: 'animal-care', jurisdiction: 'ES-MD' }
const binding = 'a'.repeat(64)
const pending = { ...scope, binding, decision: 'review', reference: 'urn:example:review', decisionRevision: 2, policyRevision: 1 }
const url = 'https://controller.example/api/host/admission-review?sector=animal-care&jurisdiction=ES-MD'

function ports() {
  return {
    resolveScope: vi.fn().mockReturnValue(scope),
    authorize: vi.fn().mockResolvedValue({ uid: 'verified-reviewer' }),
    listAdmissionDecisions: vi.fn().mockResolvedValue([pending]),
    reviewDecision: vi.fn().mockResolvedValue({ status: 'saved', record: { ...pending, decision: 'approved', decisionRevision: 3 } }),
  }
}

function request(body?: unknown) {
  return new Request(url, { headers: { authorization: 'Bearer token' }, ...(body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }) })
}

describe('host admission review handler', () => {
  it('authorizes the exact review scope and returns the pending cases', async () => {
    const services = ports()
    const response = await handleHostAdmissionReview(request(), services)
    expect(await response.json()).toEqual({ items: [pending] })
    expect(services.authorize).toHaveBeenCalledWith('Bearer token', scope, 'ES-MD')
    expect(services.listAdmissionDecisions).toHaveBeenCalledWith(scope, 'review')
  })

  it('uses the same authorization for the approved decision history and validates the filter', async () => {
    const services = ports()
    const approved = { ...pending, decision: 'approved', source: 'policy' }
    services.listAdmissionDecisions.mockResolvedValue([approved])
    const query = (decision: string) => new Request(`${url}&decision=${decision}`, { headers: { authorization: 'Bearer token' } })
    const response = await handleHostAdmissionReview(query('approved'), services)
    expect(await response.json()).toEqual({ items: [approved] })
    expect(services.listAdmissionDecisions).toHaveBeenCalledExactlyOnceWith(scope, 'approved')
    expect((await handleHostAdmissionReview(query('unknown'), services)).status).toBe(400)
  })

  it('uses the verified actor and refuses caller-supplied authority or stale revisions', async () => {
    const services = ports()
    const body = { binding, revision: 2, decision: 'approved' }
    expect((await handleHostAdmissionReview(request({ ...body, uid: 'other-person' }), services)).status).toBe(400)
    const accepted = await handleHostAdmissionReview(request(body), services)
    expect(accepted.status).toBe(200)
    expect(services.reviewDecision).toHaveBeenCalledExactlyOnceWith({ ...scope, binding }, 2, 'approved', 'verified-reviewer')
    services.reviewDecision.mockResolvedValue({ status: 'conflict' })
    expect((await handleHostAdmissionReview(request(body), services)).status).toBe(409)
    services.reviewDecision.mockResolvedValue({ status: 'verification-required' })
    expect((await handleHostAdmissionReview(request(body), services)).status).toBe(422)
  })

  it('denies unauthorized access before reading or mutating records', async () => {
    const services = ports()
    services.authorize.mockResolvedValue(undefined)
    expect((await handleHostAdmissionReview(request(), services)).status).toBe(403)
    expect((await handleHostAdmissionReview(request({ binding, revision: 2, decision: 'rejected' }), services)).status).toBe(403)
    expect(services.listAdmissionDecisions).not.toHaveBeenCalled()
    expect(services.reviewDecision).not.toHaveBeenCalled()
  })
})
