'use client'

import { useRef, useState } from 'react'
import type { QualificationClassificationReference } from 'antifraud-data-utils-ts'
import {
  TerminologyCodePickerV2,
  type TerminologyCodeCandidateV2,
  type TerminologyCodeSearchInputV2,
} from 'terminology-components-react/code-picker-v2'

type Candidate = Readonly<{
  system: string
  version?: string
  uri?: string
  code: string
  label: string
  display: string
  language: string
}>

const copy = Object.freeze({
  search: 'Search classifications',
  loading: 'Searching classifications…',
  unavailable: 'Qualification classifications are unavailable.',
  empty: 'No governed classification matched that text.',
  sources: 'Classification sources',
  select: 'Select classification',
  clear: 'Clear classification',
  canonicalCode: 'Canonical qualification code',
  canonicalDisplay: 'Canonical English display',
})

export function QualificationClassificationSelector({
  value,
  onChange,
}: Readonly<{
  value: QualificationClassificationReference | undefined
  onChange(value: QualificationClassificationReference | undefined): void
}>) {
  const [language, setLanguage] = useState<'en' | 'es'>('en')
  const [selected, setSelected] = useState<QualificationClassificationReference | undefined>(value)
  const [localizedLabel, setLocalizedLabel] = useState(value?.display ?? '')
  const candidates = useRef(new Map<string, Candidate>())

  async function search(input: TerminologyCodeSearchInputV2): Promise<readonly TerminologyCodeCandidateV2[]> {
    const query = new URLSearchParams({ text: input.text, language: input.language })
    const response = await fetch(`/api/terminology/qualification?${query}`, { credentials: 'same-origin' })
    const body = await response.json() as { candidates?: readonly Candidate[]; error?: string }
    if (!response.ok) throw new Error(body.error ?? 'Terminology search failed.')
    candidates.current = new Map((body.candidates ?? []).map(item => [`${item.system}|${item.code}`, item]))
    return (body.candidates ?? []).map(item => ({
      system: item.system,
      code: item.code,
      text: item.label,
      display: item.display,
      language: item.language,
      ...(item.version ? { terminologyVersion: item.version } : {}),
    }))
  }

  async function changeLanguage(nextLanguage: 'en' | 'es') {
    setLanguage(nextLanguage)
    if (!selected) return
    const query = new URLSearchParams({
      operation: 'resolve',
      language: nextLanguage,
      system: selected.system,
      code: selected.code,
      ...(selected.version ? { version: selected.version } : {}),
    })
    const response = await fetch(`/api/terminology/qualification?${query}`, { credentials: 'same-origin' })
    const body = await response.json() as { candidate?: Candidate; error?: string }
    if (!response.ok || !body.candidate) throw new Error(body.error ?? 'Terminology label resolution failed.')
    setLocalizedLabel(body.candidate.label)
  }

  const token = selected ? `${selected.system}|${selected.code}` : ''
  return <section className="qualification-classification" aria-labelledby="qualification-classification-title">
    <header>
      <h3 id="qualification-classification-title">Governed qualification classification</h3>
      <label>Interface language
        <select aria-label="Interface language" value={language} onChange={event => {
          void changeLanguage(event.currentTarget.value === 'es' ? 'es' : 'en')
        }}>
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </label>
    </header>
    <TerminologyCodePickerV2
      resourceType="EducationalOccupationalCredential"
      param="org.schema.EducationalOccupationalCredential.credentialCategory"
      language={language}
      label="Qualification classification"
      text={localizedLabel}
      code={token}
      display={selected?.display ?? ''}
      required
      copy={copy}
      search={search}
      onChange={next => {
        if (!next.code) {
          setSelected(undefined)
          setLocalizedLabel(next.text)
          onChange(undefined)
          return
        }
        const match = candidates.current.get(next.code)
        if (!match) return
        const classification = Object.freeze({
          system: match.system,
          ...(match.version ? { version: match.version } : {}),
          ...(match.uri ? { uri: match.uri } : {}),
          code: match.code,
          display: match.display,
        })
        setSelected(classification)
        setLocalizedLabel(match.label)
        onChange(classification)
      }}
    />
    {selected ? <p role="status"><strong>{localizedLabel}</strong><span>{selected.version ?? 'Unversioned'} · {selected.code}</span><small>Classification selected; issuer verification is still pending.</small></p> : null}
  </section>
}
