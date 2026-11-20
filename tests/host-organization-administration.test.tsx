// Flow contract: a separately authenticated host operator lists the protected paginated organization registry and requests lifecycle changes using only an opaque organization target returned by the BFF; hostname, jurisdiction, network and host authority remain server-owned.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { HostOrganizationAdministration } from '../src/components/HostOrganizationAdministration'
import { executeHostOrganizationLifecycle, searchHostOrganizations } from '../src/server/host-organization-administration'
import { authorizeHostDirectoryOperator, resolveHostOperatorAccess } from '../src/security/host-operator-authority'

describe('host organization administration', () => {
  it('renders a separate host workspace with bounded search and lifecycle language', () => {
    const html = renderToStaticMarkup(<HostOrganizationAdministration portalName="Federated host" allowedSectors={['health-care', 'education']} />)
    expect(html).toContain('Authorized organizations')
    expect(html).toContain('suspend')
    expect(html).toContain('reactivate')
    expect(html).toContain('permanently delete')
    expect(html).not.toContain('Members and devices')
  })

  it('passes only filters and pagination to the SDK client', async () => {
    const client = { search: vi.fn().mockResolvedValue({ total: 0, pageSize: 25, returned: 0, hasNext: false, organizations: [] }), lifecycle: vi.fn() }
    await searchHostOrganizations(client, { sector: 'education', status: 'active', pageSize: 25 })
    expect(client.search).toHaveBeenCalledWith({ sector: 'education', status: 'active', pageSize: 25 })
    await expect(searchHostOrganizations(client, { sector: 'education', host: 'attacker.example' } as never)).rejects.toThrow(/authority/i)
  })

  it('keeps host authority separate and fails closed outside an explicit local or staging demo', () => {
    expect(resolveHostOperatorAccess({ NODE_ENV: 'production', HOST_CONTROLLER_DEMO_MODE: 'true' })).toEqual({ authenticated: false })
    expect(resolveHostOperatorAccess({ NODE_ENV: 'development', HOST_CONTROLLER_DEMO_MODE: 'true', HOST_CONTROLLER_DEMO_SUBJECT: 'host-admin-1' }))
      .toEqual({ authenticated: true, subject: 'host-admin-1' })
  })

  it('forwards only a verified token belonging to the configured host operator', async () => {
    const operator = resolveHostOperatorAccess({
      NODE_ENV: 'development', HOST_CONTROLLER_DEMO_MODE: 'true', HOST_CONTROLLER_DEMO_SUBJECT: 'host-admin-1',
    })
    if (!operator.authenticated) throw new Error('Synthetic host operator fixture not initialized')
    const verify = vi.fn().mockResolvedValue({ uid: operator.subject })
    const authorization = 'Bearer synthetic-host-directory-id-token'
    await expect(authorizeHostDirectoryOperator(authorization, operator.subject, verify))
      .resolves.toBe('synthetic-host-directory-id-token')
    expect(verify).toHaveBeenCalledWith('synthetic-host-directory-id-token')
    await expect(authorizeHostDirectoryOperator(authorization, 'other-operator', verify)).resolves.toBeUndefined()
    verify.mockRejectedValueOnce(new Error('revoked session'))
    await expect(authorizeHostDirectoryOperator(authorization, operator.subject, verify)).resolves.toBeUndefined()
    verify.mockClear()
    await expect(authorizeHostDirectoryOperator('', operator.subject, verify)).resolves.toBeUndefined()
    expect(verify).not.toHaveBeenCalled()
  })

  it('re-resolves the selected tenant before a lifecycle command and reloads afterwards', async () => {
    const organization = { id: 'tenant-1', legalName: 'Clinic One', identifierType: 'TAX', identifierValue: 'B123', sameAs: 'did:web:clinic.example', jurisdiction: 'ES', sector: 'health-care', status: 'active' as const }
    const client = {
      search: vi.fn().mockResolvedValue({ total: 1, pageSize: 100, returned: 1, hasNext: false, organizations: [organization] }),
      lifecycle: vi.fn().mockResolvedValue({ status: 'suspended' }),
    }
    const refreshed = await executeHostOrganizationLifecycle(client, { action: '_disable', sector: 'health-care', identifierType: 'TAX', identifierValue: 'B123', sameAs: 'did:web:clinic.example' })
    expect(client.search).toHaveBeenCalledTimes(2)
    expect(client.lifecycle).toHaveBeenCalledWith('_disable', { identifierType: 'TAX', identifierValue: 'B123', sameAs: 'did:web:clinic.example' })
    expect(refreshed.total).toBe(1)
  })
})
