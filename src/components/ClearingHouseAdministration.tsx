'use client'

import { useCallback, useEffect, useState } from 'react'
import { controllerFeatureMessage, controllerGatewayFailureStatus, type ControllerFeatureStatus } from '../config/controller-features'
import type { ClearingHouseItem } from 'antifraud-sdk-node-ts'

async function requestInbox(): Promise<{ items: readonly ClearingHouseItem[]; status: ControllerFeatureStatus }> {
  const response = await fetch('/api/controller/clearing-house', { cache: 'no-store' })
  if (!response.ok) return { items: [], status: controllerGatewayFailureStatus(response.status) }
  const payload = await response.json() as { items?: readonly ClearingHouseItem[] }
  if (!Array.isArray(payload.items)) return { items: [], status: 'unavailable' }
  return { items: payload.items, status: 'available' }
}

export function ClearingHouseAdministration({ onAvailabilityChange }: Readonly<{
  onAvailabilityChange: (status: ControllerFeatureStatus) => void
}>) {
  const [inbox, setInbox] = useState<Awaited<ReturnType<typeof requestInbox>>>()
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState<string>()
  const load = useCallback(() => {
    setError(undefined)
    void requestInbox().then(setInbox).catch(() => setInbox({ items: [], status: 'unavailable' }))
  }, [])
  useEffect(load, [load])
  useEffect(() => {
    if (inbox) onAvailabilityChange(inbox.status)
  }, [inbox, onAvailabilityChange])

  function decide(item: ClearingHouseItem, decision: 'confirmed' | 'rejected'): void {
    setBusy(item.evidenceLocator); setError(undefined)
    void fetch('/api/controller/clearing-house', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ evidenceLocator: item.evidenceLocator, decision, issuerProofReference: `proof:controller:${item.evidenceLocator}:${decision}` }),
    }).then(async response => {
      const payload = await response.json() as { error?: string }
      if (!response.ok) throw new Error(payload.error ?? 'Clearing House decision failed.')
      setInbox(await requestInbox())
    }).catch(reason => setError(reason instanceof Error ? reason.message : 'Clearing House decision failed.')).finally(() => setBusy(undefined))
  }

  return <section className="reused-panel" aria-labelledby="clearing-house-title">
    <h2 id="clearing-house-title">Clearing House inbox</h2>
    <p>Review evidence references addressed to the authenticated organization. Confidential evidence is not exposed in this operational list.</p>
    {error ? <p role="alert">{error}</p> : null}
    {inbox?.status !== 'available' ? <>
      <p role="status">{controllerFeatureMessage(inbox?.status)}</p>
      {inbox?.status === 'unavailable' ? <button type="button" onClick={load}>Try again</button> : null}
    </> : <>
    <div className="structure-card-grid">{inbox.items.map(item => <article key={item.evidenceLocator} aria-label={item.evidenceLocator}>
      <header><div><h3>{item.evidenceLocator}</h3><p>{item.lifecycleStatus}</p></div><span>{item.deliveryState}</span></header>
      <dl className="controller-facts"><div><dt>Source host</dt><dd>{item.sourceHostReference}</dd></div><div><dt>Attempts</dt><dd>{item.attemptCount}</dd></div>{item.receiptReference ? <div><dt>Receipt</dt><dd>{item.receiptReference}</dd></div> : null}</dl>
      {item.lifecycleStatus === 'pending-issuer-confirmation' ? <div className="clearing-actions"><button type="button" disabled={busy === item.evidenceLocator} onClick={() => decide(item, 'confirmed')}>Confirm evidence</button><button type="button" disabled={busy === item.evidenceLocator} onClick={() => decide(item, 'rejected')}>Reject evidence</button></div> : null}
    </article>)}</div>
    {inbox.items.length === 0 ? <p>No addressed evidence is pending.</p> : null}
    </>}
  </section>
}
