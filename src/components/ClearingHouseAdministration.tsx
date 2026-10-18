'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ClearingHouseItem } from 'antifraud-sdk-node-ts'

async function requestInbox(): Promise<readonly ClearingHouseItem[]> {
  const response = await fetch('/api/controller/clearing-house', { cache: 'no-store' })
  const payload = await response.json() as { items?: readonly ClearingHouseItem[]; error?: string }
  if (!response.ok) throw new Error(payload.error ?? 'Clearing House inbox failed.')
  return payload.items ?? []
}

export function ClearingHouseAdministration() {
  const [items, setItems] = useState<readonly ClearingHouseItem[]>([])
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState<string>()
  const load = useCallback(() => { void requestInbox().then(setItems).catch(reason => setError(reason instanceof Error ? reason.message : 'Clearing House inbox failed.')) }, [])
  useEffect(load, [load])

  function decide(item: ClearingHouseItem, decision: 'confirmed' | 'rejected'): void {
    setBusy(item.evidenceLocator); setError(undefined)
    void fetch('/api/controller/clearing-house', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ evidenceLocator: item.evidenceLocator, decision, issuerProofReference: `proof:controller:${item.evidenceLocator}:${decision}` }),
    }).then(async response => {
      const payload = await response.json() as { error?: string }
      if (!response.ok) throw new Error(payload.error ?? 'Clearing House decision failed.')
      setItems(await requestInbox())
    }).catch(reason => setError(reason instanceof Error ? reason.message : 'Clearing House decision failed.')).finally(() => setBusy(undefined))
  }

  return <section className="reused-panel" aria-labelledby="clearing-house-title">
    <h2 id="clearing-house-title">Clearing House inbox</h2>
    <p>Review evidence references addressed to the authenticated organization. Confidential evidence is not exposed in this operational list.</p>
    {error ? <p role="alert">{error}</p> : null}
    <div className="structure-card-grid">{items.map(item => <article key={item.evidenceLocator} aria-label={item.evidenceLocator}>
      <header><div><h3>{item.evidenceLocator}</h3><p>{item.lifecycleStatus}</p></div><span>{item.deliveryState}</span></header>
      <dl className="controller-facts"><div><dt>Source host</dt><dd>{item.sourceHostReference}</dd></div><div><dt>Attempts</dt><dd>{item.attemptCount}</dd></div>{item.receiptReference ? <div><dt>Receipt</dt><dd>{item.receiptReference}</dd></div> : null}</dl>
      {item.lifecycleStatus === 'pending-issuer-confirmation' ? <div className="clearing-actions"><button type="button" disabled={busy === item.evidenceLocator} onClick={() => decide(item, 'confirmed')}>Confirm evidence</button><button type="button" disabled={busy === item.evidenceLocator} onClick={() => decide(item, 'rejected')}>Reject evidence</button></div> : null}
    </article>)}</div>
    {items.length === 0 ? <p>No addressed evidence is pending.</p> : null}
  </section>
}
