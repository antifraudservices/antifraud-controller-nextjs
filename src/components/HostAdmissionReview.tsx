'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { ADMISSION_CONDITIONS, hasVerifiedOrganizationChecks, REQUIRED_ORGANIZATION_CHECKS } from '../config/host-admission-policy'
import type { AdmissionDecisionFilter, AdmissionReviewItem } from '../server/host-admission-review'

type GetToken = () => Promise<string>
type FinalDecision = 'approved' | 'rejected'

const countryNames = new Intl.DisplayNames(['en'], { type: 'region' })

function AppliedPolicy({ snapshot }: { snapshot: NonNullable<AdmissionReviewItem['policySnapshot']> }) {
  const { policy, eligibleCountries } = snapshot
  const configured = policy.mode === 'automatic-after-verification' ? policy.conditions ?? [] : []
  const required = new Set([...REQUIRED_ORGANIZATION_CHECKS, ...configured])
  return <details>
    <summary>Policy applied</summary>
    {policy.mode === 'review' ? <p>Manual review required</p> : <>
      <p>Eligible countries for automatic approval</p>
      <p>{eligibleCountries.map(code => countryNames.of(code) || code).sort().join(', ') || 'None'}</p>
      <ul>{[...required].map(check => <li key={check}>{ADMISSION_CONDITIONS[check]}</li>)}</ul>
    </>}
  </details>
}

function ReviewQueue({ endpoint, decisionFilter, getToken }: {
  endpoint: string; decisionFilter: AdmissionDecisionFilter; getToken: GetToken
}) {
  const pending = decisionFilter === 'review'
  const [items, setItems] = useState<AdmissionReviewItem[]>()
  const [cursor, setCursor] = useState<string>()
  const [nextCursor, setNextCursor] = useState<string>()
  const [refresh, setRefresh] = useState(0)
  const [selected, setSelected] = useState<{ item: AdmissionReviewItem; decision: FinalDecision }>()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState('')

  useEffect(() => {
    const abort = new AbortController()
    setItems(undefined)
    setSelected(undefined)
    setError('')
    void (async () => {
      try {
        const response = await fetch(cursor ? `${endpoint}&cursor=${encodeURIComponent(cursor)}` : endpoint, {
          headers: { authorization: `Bearer ${await getToken()}` }, cache: 'no-store', signal: abort.signal,
        })
        if (!response.ok) throw new Error(response.status === 403 ? 'You do not have review access for this scope.' : 'The review queue could not be loaded.')
        const result: { items: AdmissionReviewItem[]; cursor?: string } = await response.json()
        if (!abort.signal.aborted) {
          setItems(result.items)
          setNextCursor(result.cursor)
        }
      } catch (cause) {
        if (!abort.signal.aborted) setError(cause instanceof Error ? cause.message : 'The review queue could not be loaded.')
      }
    })()
    return () => abort.abort()
  }, [endpoint, getToken, cursor, refresh])

  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected || saving) return
    const { item, decision } = selected
    setSaving(true)
    setError('')
    setReceipt('')
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { authorization: `Bearer ${await getToken()}`, 'content-type': 'application/json' },
        body: JSON.stringify({ binding: item.binding, revision: item.decisionRevision, decision }),
      })
      const result: { item?: AdmissionReviewItem; error?: string } = await response.json()
      if (!response.ok || !result.item) throw new Error(result.error || 'The decision could not be recorded.')
      setReceipt(result.item.reference)
      setItems(items?.filter(current => current.binding !== item.binding))
      setSelected(undefined)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The decision could not be recorded.')
    } finally {
      setSaving(false)
    }
  }

  return <>
    <button type="button" disabled={saving} onClick={() => { setCursor(undefined); setRefresh(value => value + 1) }}>Refresh queue</button>
    {error && <p role="alert">{error}</p>}
    {receipt && <p role="status">Decision recorded: {receipt}</p>}
    {!items && !error && <p role="status">Loading admissions…</p>}
    {items?.length === 0 && <p>{pending ? 'No pending admissions on this page.' : 'No decisions on this page.'}</p>}
    {items?.map(item => {
      const mayApprove = hasVerifiedOrganizationChecks(item.evidence?.checks)
      return <article key={item.binding} aria-labelledby={`case-${item.binding}`}>
        <h2 id={`case-${item.binding}`}>{item.applicationId || item.evidence?.applicationId || item.reference}</h2>
        {item.evidence && <>
          <p>ICA reference: {item.evidence.reference}</p>
          <ul>{item.evidence.checks.map(check => <li key={check}>{ADMISSION_CONDITIONS[check]}</li>)}</ul>
        </>}
        <p>Policy revision {item.policyRevision}</p>
        {item.policySnapshot && <AppliedPolicy snapshot={item.policySnapshot}/>}
        {item.decision === 'approved' && <p>{item.source === 'policy' ? 'Approved automatically' : item.source === 'reviewer' ? 'Approved by a reviewer' : 'Approved'}</p>}
        {item.decision === 'rejected' && <p>Rejected</p>}
        {!pending && <p>Decision reference: {item.reference}</p>}
        {pending && item.decision === 'review' && <>
          {!mayApprove && <p>Verified ICA evidence is still required for approval.</p>}
          <button type="button" disabled={!mayApprove || saving} onClick={() => setSelected({ item, decision: 'approved' })}>Approve</button>
          <button type="button" disabled={saving} onClick={() => setSelected({ item, decision: 'rejected' })}>Reject</button>
          {selected?.item.binding === item.binding && <form onSubmit={confirm}>
            <button type="submit" disabled={saving}>{selected.decision === 'approved' ? 'Confirm approval' : 'Confirm rejection'}</button>
            <button type="button" disabled={saving} onClick={() => setSelected(undefined)}>Cancel</button>
          </form>}
        </>}
      </article>
    })}
    {items && nextCursor && <button type="button" disabled={saving} onClick={() => setCursor(nextCursor)}>Next page</button>}
  </>
}

export function HostAdmissionReview({ sectors, jurisdictions, getToken }: {
  sectors: readonly string[]; jurisdictions: readonly string[]; getToken: GetToken
}) {
  const [sector, setSector] = useState(sectors[0] || '')
  const [jurisdiction, setJurisdiction] = useState(jurisdictions[0] || '')
  const [decision, setDecision] = useState<AdmissionDecisionFilter>('review')
  const [query, setQuery] = useState({ sector, jurisdiction, decision })
  const queryParams = new URLSearchParams(query).toString()

  return <section aria-labelledby="admission-review-title">
    <h1 id="admission-review-title">Review organization admissions</h1>
    <form onSubmit={event => {
      event.preventDefault()
      setQuery({ sector, jurisdiction: jurisdiction.trim().toUpperCase(), decision })
    }}>
      <label>Sector <select value={sector} onChange={event => setSector(event.target.value)}>
        {sectors.map(value => <option key={value} value={value}>{value}</option>)}
      </select></label>
      <label>Jurisdiction <input value={jurisdiction} onChange={event => setJurisdiction(event.target.value)}
        list="admission-review-jurisdictions" required /></label>
      <datalist id="admission-review-jurisdictions">
        {jurisdictions.map(value => <option key={value} value={value}/>)}
      </datalist>
      <label>Decision <select value={decision} onChange={event => setDecision(event.target.value as AdmissionDecisionFilter)}>
        <option value="review">Pending review</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select></label>
      <button type="submit">Load cases</button>
    </form>
    {query.sector && query.jurisdiction && <ReviewQueue key={queryParams} endpoint={`/api/host/admission-review?${queryParams}`}
      decisionFilter={query.decision} getToken={getToken}/>}
  </section>
}
