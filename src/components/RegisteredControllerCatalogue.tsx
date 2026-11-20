'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import type { WorkforceClient } from 'sos-sdk-node-ts/workforce-client'
import { FirebasePhoneSignIn, type FirebaseWebConfig } from './FirebasePhoneSignIn'

export function RegisteredControllerCatalogue({ firebase, virtualPhoneTest }: {
  firebase: FirebaseWebConfig
  virtualPhoneTest: boolean
}) {
  return <FirebasePhoneSignIn firebase={firebase} name="tenant-catalogue" title="Organization controller sign-in"
    virtualPhoneTest={virtualPhoneTest}>
    {getToken => <CatalogueEditor getToken={getToken}/>}
  </FirebasePhoneSignIn>
}

type Offerings = Awaited<ReturnType<WorkforceClient['getPublishedOfferings']>>

function CatalogueEditor({ getToken }: { getToken: () => Promise<string> }) {
  const [offerings, setOfferings] = useState<Offerings>()
  const [document, setDocument] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const load = useCallback(async (body?: string, signal?: AbortSignal) => {
    const token = await getToken()
    const response = await fetch('/api/controller/catalogue', {
      method: body === undefined ? 'GET' : 'PUT', body, signal,
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'The catalogue could not be loaded.')
    return data.offerings as Offerings
  }, [getToken])

  useEffect(() => {
    const abort = new AbortController()
    load(undefined, abort.signal).then(result => {
      if (!abort.signal.aborted) setOfferings(result)
    }).catch(cause => {
      if (!abort.signal.aborted) setError(cause.message)
    })
    return () => abort.abort()
  }, [load])

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setSaved(false)
    try {
      setOfferings(await load(document))
      setSaved(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Publication failed.')
    } finally {
      setBusy(false)
    }
  }

  return <section aria-labelledby="catalogue-title">
    <h1 id="catalogue-title">Organization catalogue</h1>
    {error && <p role="alert">{error}</p>}
    {saved && <p role="status">Catalogue published.</p>}
    {offerings && <>
      <form onSubmit={publish}>
        <label>Catalogue document <textarea value={document} required rows={10}
          onChange={event => setDocument(event.target.value)}/></label>
        <button type="submit" disabled={busy}>Publish catalogue entries</button>
      </form>
      <h2>Published offerings</h2>
      {offerings.length ? <ul>{offerings.map(offering => <li key={`${offering.type}:${offering.id}`}>
        <strong>{offering.name}</strong> · {offering.type}
      </li>)}</ul> : <p>No published offerings.</p>}
    </>}
  </section>
}
