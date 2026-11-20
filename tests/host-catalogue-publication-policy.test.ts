// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import { describe, expect, it, vi } from 'vitest'
import { handleHostCataloguePublicationPolicy, INITIAL_CATALOGUE_PUBLICATION_POLICY } from '../src/server/host-catalogue-publication-policy'

const scope = { hostDid: 'did:web:host.example.test', network: 'test-network', sector: 'research' }
const actor = { uid: 'assigned-controller' }
const endpoint = 'https://controller.example.test/api/host/catalogue-publication-policy'

function request(method: 'GET' | 'PUT', body?: object) {
  return new Request(endpoint, { method, ...(body ? { body: JSON.stringify(body) } : {}) })
}

function ports() {
  return {
    resolveScope: () => scope,
    authorize: vi.fn(async () => actor),
    read: vi.fn(async () => INITIAL_CATALOGUE_PUBLICATION_POLICY),
    change: vi.fn(async (_scope: typeof scope, allowTenantPublication: boolean, revision: number) => ({ allowTenantPublication, revision: revision + 1 })),
  }
}

describe('host catalogue publication policy', () => {
  it('defaults to host-only and records an authorized, revision-bound opt-in', async () => {
    const dependencies = ports()
    const initial = await handleHostCataloguePublicationPolicy(request('GET'), dependencies)
    expect(await initial.json()).toEqual({ allowTenantPublication: false, revision: 0 })
    const save = await handleHostCataloguePublicationPolicy(request('PUT', { allowTenantPublication: true, revision: 0 }), dependencies)
    expect(await save.json()).toEqual({ allowTenantPublication: true, revision: 1 })
    expect(dependencies.change).toHaveBeenCalledWith(scope, true, 0, actor.uid)
  })

  it('rejects unauthorized callers, injected host scope and stale writes', async () => {
    const dependencies = ports()
    const denied = await handleHostCataloguePublicationPolicy(request('GET'), { ...dependencies, authorize: async () => undefined })
    expect(denied.status).toBe(403)
    expect(dependencies.read).not.toHaveBeenCalled()
    const forged = await handleHostCataloguePublicationPolicy(request('PUT', { ...scope, allowTenantPublication: true, revision: 0 }), dependencies)
    expect(forged.status).toBe(400)
    expect(dependencies.change).not.toHaveBeenCalled()
    const stale = await handleHostCataloguePublicationPolicy(request('PUT', { allowTenantPublication: false, revision: 0 }), { ...dependencies, change: async () => undefined })
    expect(stale.status).toBe(409)
  })
})
