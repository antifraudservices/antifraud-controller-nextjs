'use client'

import { useEffect, useState } from 'react'
import type { HostOrganizationPage, HostOrganizationStatus } from '../server/host-organization-administration'

const EMPTY_PAGE: HostOrganizationPage = Object.freeze({ total: 0, pageSize: 25, returned: 0, hasNext: false, organizations: [] })

export function HostOrganizationAdministration({ portalName, allowedSectors = [] }: Readonly<{ portalName: string; allowedSectors?: readonly string[] }>) {
  const [page, setPage] = useState<HostOrganizationPage>(EMPTY_PAGE)
  const [status, setStatus] = useState<HostOrganizationStatus | ''>('')
  const [sector, setSector] = useState(allowedSectors[0] || '')
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function lifecycle(action: '_status' | '_disable' | '_enable' | '_purge', organization: HostOrganizationPage['organizations'][number]) {
    if (action === '_purge' && !window.confirm(`Permanently delete ${organization.legalName || organization.identifierValue}? This cannot be undone.`)) return
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/host/organizations', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, sector: organization.sector, identifierType: organization.identifierType, identifierValue: organization.identifierValue, sameAs: organization.sameAs }) })
      const body = await response.json() as HostOrganizationPage & { error?: string }
      if (!response.ok) throw new Error(body.error || 'The lifecycle operation failed.')
      await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'The lifecycle operation failed.') }
    finally { setBusy(false) }
  }

  async function load(cursor?: string) {
    setBusy(true); setError('')
    try {
      const params = new URLSearchParams({ ...(sector ? { sector } : {}), ...(status ? { status } : {}), ...(query ? { legalName: query } : {}), ...(cursor ? { cursor } : {}) })
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
      <section className="reused-panel host-directory"><header><div><h1>Authorized organizations</h1><p>Search registrations, suspend active organizations, reactivate suspended organizations or permanently delete an eligible inactive registration.</p></div><strong>{page.total} {page.total === 1 ? 'organization' : 'organizations'}</strong></header>
        <form onSubmit={event => { event.preventDefault(); void load() }} className="host-directory-filters"><label>Organization name<input value={query} onChange={event => setQuery(event.target.value)} /></label><label>Sector<select value={sector} onChange={event => setSector(event.target.value)}>{allowedSectors.map(value => <option value={value} key={value}>{value}</option>)}</select></label><label>Status<select value={status} onChange={event => setStatus(event.target.value as HostOrganizationStatus | '')}><option value="">All</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="revoked">Revoked</option></select></label><button disabled={busy || !sector}>{busy ? 'Loading…' : 'Search'}</button></form>
        {error ? <p role="alert" className="authority-boundary">{error}</p> : null}
        <div className="host-directory-list">{page.organizations.map(organization => <article key={organization.id}><div><h2>{organization.legalName || organization.identifierValue}</h2><p>{organization.identifierType}: {organization.identifierValue}</p><small>{organization.jurisdiction} · {organization.sector}</small></div><span data-status={organization.status}>{organization.status}</span><div className="host-lifecycle-actions"><button disabled={busy} onClick={() => void lifecycle('_status', organization)}>View status</button><button disabled={busy || organization.status === 'revoked'} onClick={() => void lifecycle(organization.status === 'suspended' ? '_enable' : '_disable', organization)}>{organization.status === 'suspended' ? 'Reactivate' : 'Suspend'}</button><button disabled={busy || organization.status !== 'suspended'} onClick={() => void lifecycle('_purge', organization)}>Permanently delete</button></div></article>)}</div>
        {!busy && page.organizations.length === 0 ? <p className="structure-empty">No organizations match the current filters.</p> : null}
        {page.hasNext && page.nextCursor ? <button className="workspace-back" type="button" onClick={() => void load(page.nextCursor)}>Next page</button> : null}
      </section>
    </main>
  </div>
}
