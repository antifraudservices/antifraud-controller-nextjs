'use client'

import { useEffect, useState } from 'react'
import { HostOrganizationDirectory as HostOrganizationDirectoryScreen, type HostOrganizationDirectoryCopy, type HostOrganizationDirectoryItem, type HostOrganizationDirectorySearch, type HostOrganizationLifecycleAction } from 'antifraud-hosting-components-react'
import type { HostOrganizationPage, HostOrganizationStatus } from '../server/host-organization-administration'

const EMPTY_PAGE: HostOrganizationPage = Object.freeze({ total: 0, pageSize: 25, returned: 0, hasNext: false, organizations: [] })
const COPY: HostOrganizationDirectoryCopy = Object.freeze({
  title: 'Authorized organizations', description: 'Search registrations, suspend active organizations, reactivate suspended organizations or permanently delete an eligible inactive registration.', organizationSingular: 'organization', organizationPlural: 'organizations',
  name: 'Organization name', sector: 'Sector', status: 'Status', allStatuses: 'All', active: 'Active', suspended: 'Suspended', revoked: 'Revoked', search: 'Search', loading: 'Loading…', empty: 'No organizations match the current filters.', statusAction: 'View status', suspend: 'Suspend', reactivate: 'Reactivate', purge: 'Permanently delete', next: 'Next page',
  purgeConfirmation: 'Permanently delete {organization}? This cannot be undone.',
})

export function HostOrganizationAdministration({ portalName, allowedSectors = [] }: Readonly<{ portalName: string; allowedSectors?: readonly string[] }>) {
  const [page, setPage] = useState<HostOrganizationPage>(EMPTY_PAGE)
  const [filters, setFilters] = useState<HostOrganizationDirectorySearch>({ legalName: '', sector: allowedSectors[0] || '', status: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function lifecycle(action: HostOrganizationLifecycleAction, organization: HostOrganizationDirectoryItem) {
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/host/organizations', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, sector: organization.sector, identifierType: organization.identifierType, identifierValue: organization.identifierValue, sameAs: organization.sameAs }) })
      const body = await response.json() as HostOrganizationPage & { error?: string }
      if (!response.ok) throw new Error(body.error || 'The lifecycle operation failed.')
      await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'The lifecycle operation failed.') }
    finally { setBusy(false) }
  }

  async function load(input: HostOrganizationDirectorySearch = filters) {
    setFilters(input)
    setBusy(true); setError('')
    try {
      const params = new URLSearchParams({ ...(input.sector ? { sector: input.sector } : {}), ...(input.status ? { status: input.status } : {}), ...(input.legalName ? { legalName: input.legalName } : {}), ...(input.cursor ? { cursor: input.cursor } : {}) })
      const response = await fetch(`/api/host/organizations?${params}`, { cache: 'no-store' })
      const body = await response.json() as HostOrganizationPage & { error?: string }
      if (!response.ok) throw new Error(body.error || 'The organization directory is unavailable.')
      setPage(body)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'The organization directory is unavailable.') }
    finally { setBusy(false) }
  }

  useEffect(() => { void load() }, [])

  return <div className="controller-workspace host-workspace">
    <header className="controller-header"><div className="controller-brand"><span className="controller-mark">◇</span><span><strong>{portalName}</strong><small>Host controller</small></span></div><div className="controller-context"><small>Protected registry</small><strong>Federated organizations</strong></div><button className="controller-account" type="button">Host operator</button></header>
    <main className="controller-main">
      <div className="controller-demo-note"><strong>Host-only administration</strong><span>Hostname, jurisdiction, network and operator authority are resolved by the trusted backend.</span></div>
      <HostOrganizationDirectoryScreen copy={COPY} allowedSectors={allowedSectors} total={page.total} busy={busy} error={error || undefined} organizations={page.organizations} nextCursor={page.hasNext ? page.nextCursor : undefined} onSearch={load} onLifecycle={lifecycle}/>
    </main>
  </div>
}
