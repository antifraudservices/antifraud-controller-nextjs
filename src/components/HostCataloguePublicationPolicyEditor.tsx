'use client'

import { useEffect, useState, type FormEvent } from 'react'
import type { CataloguePublicationPolicy } from '../server/host-catalogue-publication-policy'

export function HostCataloguePublicationPolicyEditor({ sector, getToken }: {
  sector: string
  getToken: () => Promise<string>
}) {
  const endpoint = `/api/host/catalogue-publication-policy?sector=${encodeURIComponent(sector)}`
  const [policy, setPolicy] = useState<CataloguePublicationPolicy>()
  const [allowed, setAllowed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const abort = new AbortController()
    void (async () => {
      try {
        const result = await fetch(endpoint, {
          headers: { authorization: `Bearer ${await getToken()}` },
          cache: 'no-store', signal: abort.signal,
        })
        if (!result.ok) throw new Error('The publication policy could not be loaded.')
        const saved: CataloguePublicationPolicy = await result.json()
        if (!abort.signal.aborted) {
          setPolicy(saved)
          setAllowed(saved.allowTenantPublication)
        }
      } catch {
        if (!abort.signal.aborted) setError('The publication policy could not be loaded.')
      }
    })()
    return () => abort.abort()
  }, [endpoint, getToken])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!policy || saving) return
    setSaving(true)
    setError('')
    try {
      const result = await fetch(endpoint, {
        method: 'PUT',
        headers: { authorization: `Bearer ${await getToken()}`, 'content-type': 'application/json' },
        body: JSON.stringify({ allowTenantPublication: allowed, revision: policy.revision }),
      })
      if (result.status === 409) {
        setError('The policy changed. Reload before updating.')
        return
      }
      if (!result.ok) throw new Error('The publication policy could not be saved.')
      const saved: CataloguePublicationPolicy = await result.json()
      setPolicy(saved)
      setAllowed(saved.allowTenantPublication)
    } catch {
      setError('The publication policy could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  return <section aria-labelledby="catalogue-publication-policy-title">
    <h2 id="catalogue-publication-policy-title">External catalogue publication</h2>
    {error && <p role="alert">{error}</p>}
    {!policy && !error && <p role="status">Loading publication policy</p>}
    {policy && <form onSubmit={save}>
      <p role="status">Publication policy revision {policy.revision}</p>
      <label>
        <input type="checkbox" checked={allowed} disabled={saving} onChange={event => setAllowed(event.target.checked)}/>
        Allow tenants to publish with their own wallets
      </label>
      <button disabled={saving || allowed === policy.allowTenantPublication} type="submit">Save publication policy</button>
    </form>}
  </section>
}
