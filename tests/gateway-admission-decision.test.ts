// Flow contract: a configured Gateway may read only a recorded admission decision for its exact verified scope and transaction binding.
import { describe, expect, it, vi } from 'vitest'
import { handleGatewayAdmissionDecision } from '../src/server/gateway-admission-decision'

const service = { bearer: 'own-service-token', hostDid: 'did:web:host.example', network: 'test-network' }
const requestScope = { hostDid: service.hostDid, network: service.network, jurisdiction: 'ES-MD', sector: 'animal-care', binding: 'a'.repeat(64) }

function request(body: unknown, bearer = service.bearer) {
  return new Request('https://controller.example/api/internal/host-admission-decision', {
    method: 'POST', headers: { authorization: `Bearer ${bearer}` }, body: JSON.stringify(body),
  })
}

describe('Gateway admission decisions', () => {
  it('returns the stored approval and evidence binding without returning private audit data', async () => {
    const lookup = vi.fn().mockResolvedValue({
      ...requestScope, reference: 'urn:example:decision', decision: 'approved', actorUid: 'private-subject',
    })
    const response = await handleGatewayAdmissionDecision(request(requestScope), service, lookup)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ binding: requestScope.binding, reference: 'urn:example:decision', decision: 'approved' })
    expect(lookup).toHaveBeenCalledExactlyOnceWith(requestScope, undefined)
  })

  it('refuses missing records and records for another scope', async () => {
    const lookup = vi.fn().mockResolvedValue(undefined)
    const missing = await handleGatewayAdmissionDecision(request(requestScope), service, lookup)
    expect(await missing.json()).toEqual({ binding: requestScope.binding, decision: 'review' })
    lookup.mockResolvedValue({ ...requestScope, jurisdiction: 'ES-CL', reference: 'urn:example:decision', decision: 'approved' })
    const mismatched = await handleGatewayAdmissionDecision(request(requestScope), service, lookup)
    expect(await mismatched.json()).toEqual({ binding: requestScope.binding, decision: 'review' })
  })

  it('rejects an unrelated caller or host before reading the store', async () => {
    const lookup = vi.fn()
    expect((await handleGatewayAdmissionDecision(request(requestScope, 'wrong'), service, lookup)).status).toBe(403)
    expect((await handleGatewayAdmissionDecision(request({ ...requestScope, hostDid: 'did:web:other.example' }), service, lookup)).status).toBe(400)
    expect((await handleGatewayAdmissionDecision(request({ ...requestScope, binding: '../record' }), service, lookup)).status).toBe(400)
    expect(lookup).not.toHaveBeenCalled()
  })

  it('records a decision using the verified ICA result supplied by the assigned Gateway', async () => {
    const record = vi.fn().mockResolvedValue({ ...requestScope, decision: 'approved', reference: 'urn:example:decision' })
    const evidence = { applicationId: 'case-1', reference: 'urn:example:ica-evidence', checks: ['legal-identifier-match', 'official-registry-active'] }
    const response = await handleGatewayAdmissionDecision(request({ ...requestScope, evidence }), service, record)
    expect(await response.json()).toEqual({ binding: requestScope.binding, decision: 'approved', reference: 'urn:example:decision' })
    expect(record).toHaveBeenCalledWith(requestScope, evidence)
  })

  it('correlates a submission for review even before ICA returns evidence', async () => {
    const record = vi.fn().mockResolvedValue(undefined)
    const body = { ...requestScope, applicationId: 'app-1' }
    const response = await handleGatewayAdmissionDecision(request(body), service, record)
    expect(await response.json()).toEqual({ binding: requestScope.binding, decision: 'review' })
    expect(record).toHaveBeenCalledExactlyOnceWith(body, undefined)
  })

  it('rejects evidence with unrecognized checks or caller-supplied approval', async () => {
    const record = vi.fn()
    for (const payload of [
      { ...requestScope, decision: 'approved' },
      { ...requestScope, applicationId: 'private@example.test' },
      { ...requestScope, applicationId: 'case-1', evidence: {
        applicationId: 'case-2', reference: 'urn:example:ica', checks: ['legal-identifier-match'],
      } },
      { ...requestScope, evidence: { applicationId: 'case-1', reference: 'test', checks: ['unchecked-claim'] } },
    ]) expect((await handleGatewayAdmissionDecision(request(payload), service, record)).status).toBe(400)
    expect(record).not.toHaveBeenCalled()
  })
})
