// Flow contract: only an assigned host controller may read or change Test Network admission policy; a change binds one sector, covers explicitly selected or all enabled countries, and carries its current revision for audited persistence.
import { describe, expect, it, vi } from 'vitest'
import { handleHostAdmissionPolicy } from '../src/server/host-admission-policy'

const scope = { hostDid: 'did:web:host.example', network: 'test-network', sector: 'animal-tech' }
const allowedCountries = ['CA', 'ES']
const selected = { mode: 'automatic-after-verification', countries: { kind: 'selected', codes: ['CA', 'ES'] } }
const all = { mode: 'automatic-after-verification', countries: { kind: 'all' } }
const url = 'https://controller.example/api/host/admission-policy?sector=animal-tech'

function ports() {
  return {
    resolveScope: vi.fn().mockReturnValue({ scope, allowedCountries }),
    authorize: vi.fn().mockResolvedValue({ uid: 'trusted-reviewer' }),
    read: vi.fn().mockResolvedValue({ mode: 'review', revision: 0 }),
    change: vi.fn().mockResolvedValue({ ...selected, revision: 1 }),
  }
}

function put(body: unknown) {
  return new Request(url, { method: 'PUT', headers: { authorization: 'Bearer token' }, body: JSON.stringify(body) })
}

describe('host admission policy handler', () => {
  it('returns the authoritative policy and scope to an assigned reader', async () => {
    const services = ports()
    const response = await handleHostAdmissionPolicy(new Request(url, { headers: { authorization: 'Bearer token' } }), services)
    expect(await response.json()).toEqual({ ...scope, allowedCountries, mode: 'review', revision: 0 })
    expect(services.authorize).toHaveBeenCalledWith('Bearer token', scope)
    expect(services.read).toHaveBeenCalledWith(scope)
  })

  it('passes the verified actor and current revision to the store when enabling or returning to review', async () => {
    const services = ports()
    expect((await handleHostAdmissionPolicy(put({ ...selected, revision: 0 }), services)).status).toBe(200)
    expect(services.change).toHaveBeenCalledWith(scope, selected, 0, 'trusted-reviewer')
    await handleHostAdmissionPolicy(put({ ...all, revision: 1 }), services)
    expect(services.change).toHaveBeenLastCalledWith(scope, all, 1, 'trusted-reviewer')
    await handleHostAdmissionPolicy(put({ mode: 'review', revision: 1 }), services)
    expect(services.change).toHaveBeenLastCalledWith(scope, { mode: 'review' }, 1, 'trusted-reviewer')
  })

  it('rejects browser-supplied authority and refuses writes without a matching assignment', async () => {
    const services = ports()
    expect((await handleHostAdmissionPolicy(put({ mode: 'review', revision: 0, uid: 'claimed-admin' }), services)).status).toBe(400)
    services.authorize.mockResolvedValue(undefined)
    expect((await handleHostAdmissionPolicy(put({ mode: 'review', revision: 0 }), services)).status).toBe(403)
    expect(services.change).not.toHaveBeenCalled()
  })

  it('rejects enabling automation for a research sector or another environment and returns a conflict for stale writes', async () => {
    const services = ports()
    services.resolveScope.mockReturnValue({ scope: { ...scope, sector: 'animal-research' }, allowedCountries })
    expect((await handleHostAdmissionPolicy(put({ ...all, revision: 0 }), services)).status).toBe(400)
    services.resolveScope.mockReturnValue({ scope: { ...scope, network: 'network' }, allowedCountries })
    expect((await handleHostAdmissionPolicy(put({ ...all, revision: 0 }), services)).status).toBe(400)
    expect(services.change).not.toHaveBeenCalled()
    services.resolveScope.mockReturnValue({ scope, allowedCountries })
    services.change.mockResolvedValue(undefined)
    expect((await handleHostAdmissionPolicy(put({ mode: 'review', revision: 0 }), services)).status).toBe(409)
  })

  it('rejects unsupported countries, empty selections and wildcard strings', async () => {
    const services = ports()
    for (const codes of [['US'], [], ['*']]) {
      expect((await handleHostAdmissionPolicy(put({
        ...selected, revision: 0, countries: { kind: 'selected', codes },
      }), services)).status).toBe(400)
    }
    expect(services.change).not.toHaveBeenCalled()
  })

  it('allows conditions on technical policies and rejects the same policy for a care sector', async () => {
    const services = ports()
    const care = { ...scope, sector: 'animal-care' }
    const conditions = ['signed-application-template', 'legal-identifier-match', 'regional-marketplace-entry']
    const policy = { ...selected, conditions }
    expect((await handleHostAdmissionPolicy(put({ ...policy, revision: 0 }), services)).status).toBe(200)
    expect(services.change).toHaveBeenLastCalledWith(scope, policy, 0, 'trusted-reviewer')
    services.resolveScope.mockReturnValueOnce({ scope: care, allowedCountries })
    expect((await handleHostAdmissionPolicy(put({ ...policy, revision: 0 }), services)).status).toBe(400)
    expect(services.change).toHaveBeenCalledTimes(1)
    expect((await handleHostAdmissionPolicy(put({ ...policy, revision: 0, conditions: ['unsupported'] }), services)).status).toBe(400)
    expect((await handleHostAdmissionPolicy(put({ ...policy, revision: 0, conditions: [] }), services)).status).toBe(400)
  })
})
