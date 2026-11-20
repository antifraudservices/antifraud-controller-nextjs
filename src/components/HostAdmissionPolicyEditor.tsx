'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { HostCataloguePublicationPolicyEditor } from './HostCataloguePublicationPolicyEditor'
import { ADMISSION_CONDITIONS, supportsAutomaticAdmission, type AdmissionCondition, type AdmissionPolicy, type VersionedAdmissionPolicy } from '../config/host-admission-policy'

type GetToken = () => Promise<string>
type PolicyResponse = VersionedAdmissionPolicy & { allowedCountries: string[] }
const countriesInEnglish = new Intl.DisplayNames(['en'], { type: 'region' })

function SectorPolicy({ sector, getToken }: { sector: string; getToken: GetToken }) {
  const automaticAllowed = supportsAutomaticAdmission('test-network', sector)
  const endpoint = `/api/host/admission-policy?sector=${encodeURIComponent(sector)}`
  const [saved, setSaved] = useState<PolicyResponse>()
  const [mode, setMode] = useState<AdmissionPolicy['mode']>('review')
  const [coverage, setCoverage] = useState<'selected' | 'all'>('selected')
  const [countries, setCountries] = useState<string[]>([])
  const [conditions, setConditions] = useState<AdmissionCondition[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function display(policy: PolicyResponse) {
    setSaved(policy)
    setMode(automaticAllowed ? policy.mode : 'review')
    setCoverage(policy.mode === 'automatic-after-verification' ? policy.countries.kind : 'selected')
    setCountries(policy.mode === 'automatic-after-verification' && policy.countries.kind === 'selected' ? [...policy.countries.codes] : [])
    setConditions(policy.mode === 'automatic-after-verification' ? [...policy.conditions || []] : [])
  }

  useEffect(() => {
    const abort = new AbortController()
    void (async () => {
      try {
        const response = await fetch(endpoint, {
          headers: { authorization: `Bearer ${await getToken()}` },
          cache: 'no-store', signal: abort.signal,
        })
        if (!response.ok) throw new Error('The policy could not be loaded for this sector.')
        const policy: PolicyResponse = await response.json()
        if (!abort.signal.aborted) display(policy)
      } catch (cause) {
        if (!abort.signal.aborted) setError(cause instanceof Error ? cause.message : 'The policy could not be loaded.')
      }
    })()
    return () => abort.abort()
  }, [automaticAllowed, endpoint, getToken])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!saved || busy) return
    const policy: AdmissionPolicy = mode === 'review' ? { mode } : {
      mode,
      countries: coverage === 'all' ? { kind: 'all' } : { kind: 'selected', codes: countries },
      ...(conditions.length ? { conditions } : {}),
    }
    setBusy(true)
    setError('')
    try {
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { authorization: `Bearer ${await getToken()}`, 'content-type': 'application/json' },
        body: JSON.stringify({ ...policy, revision: saved.revision }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'The policy could not be saved.')
      display(result)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The policy could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  const missingRequirements = mode === 'automatic-after-verification'
    && (!automaticAllowed || (coverage === 'selected' && !countries.length))

  return <>
    {error && <p role="alert">{error}</p>}
    {saved && <form onSubmit={save}>
      <p role="status">Policy revision {saved.revision}</p>
      <label>Approval <select value={mode} disabled={busy} onChange={event => setMode(event.target.value as AdmissionPolicy['mode'])}>
        <option value="review">Require review</option>
        {automaticAllowed && <option value="automatic-after-verification">Approve after verification</option>}
      </select></label>
      {mode === 'automatic-after-verification' && <>
        <fieldset disabled={busy}>
          <legend>Country coverage</legend>
          <label><input type="radio" name="coverage" checked={coverage === 'selected'} onChange={() => setCoverage('selected')}/> Select countries</label>
          <label><input type="radio" name="coverage" checked={coverage === 'all'} onChange={() => setCoverage('all')}/> All countries enabled for this host</label>
          {coverage === 'selected' && saved.allowedCountries.map(code => <label key={code}>
            <input type="checkbox" checked={countries.includes(code)} onChange={event => setCountries(event.target.checked ? [...countries, code] : countries.filter(country => country !== code))}/>
            {countriesInEnglish.of(code)}
          </label>)}
        </fieldset>
        <fieldset disabled={busy}>
          <legend>Required evidence</legend>
          {(Object.keys(ADMISSION_CONDITIONS) as AdmissionCondition[]).map(condition => <label key={condition}>
            <input type="checkbox" checked={conditions.includes(condition)} onChange={event => setConditions(event.target.checked ? [...conditions, condition] : conditions.filter(check => check !== condition))}/>
            {ADMISSION_CONDITIONS[condition]}
          </label>)}
        </fieldset>
      </>}
      <button disabled={busy || missingRequirements} type="submit">Save policy</button>
    </form>}
  </>
}

export function HostAdmissionPolicyEditor({ sectors, getToken, showCataloguePublication }: {
  sectors: readonly string[]; getToken: GetToken; showCataloguePublication?: boolean
}) {
  const [sector, setSector] = useState(sectors[0] || '')
  return <section aria-labelledby="admission-policy-title">
    <h1 id="admission-policy-title">Organization admission policy</h1>
    {sector && <>
      <label>Sector <select value={sector} onChange={event => setSector(event.target.value)}>
        {sectors.map(value => <option key={value} value={value}>{value}</option>)}
      </select></label>
      <SectorPolicy key={sector} sector={sector} getToken={getToken}/>
      {showCataloguePublication && <HostCataloguePublicationPolicyEditor key={sector} sector={sector} getToken={getToken}/>}
    </>}
  </section>
}
