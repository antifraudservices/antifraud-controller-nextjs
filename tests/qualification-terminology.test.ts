// Flow contract: the authenticated Controller BFF derives the Antifraud sector, jurisdiction and canonical Schema.org qualification claim, while the browser supplies only bounded query text or an exact previously selected code.
import { describe, expect, it, vi } from 'vitest'

import {
  resolveQualificationClassificationLabel,
  searchQualificationClassifications,
} from '../src/server/qualification-terminology'

describe('qualification terminology BFF boundary', () => {
  it('derives governed search context and preserves canonical terminology identity', async () => {
    const searchCodeCandidatesFromText = vi.fn().mockResolvedValue([{
      system: 'https://data.europa.eu/snb/education-level',
      code: 'synthetic-bachelor-001',
      text: 'Cualificación sintética de nivel de grado',
      display: 'Bachelor-level synthetic qualification',
      language: 'es',
      terminologyVersion: 'demo-2026-10',
    }])

    const candidates = await searchQualificationClassifications(
      { text: 'grado', language: 'es' },
      { searchCodeCandidatesFromText } as never,
    )

    expect(searchCodeCandidatesFromText).toHaveBeenCalledWith({
      text: 'grado',
      language: 'es',
      sector: 'antifraud-tech',
      jurisdiction: 'ES',
      claim: 'org.schema.EducationalOccupationalCredential.credentialCategory',
      limit: 20,
    })
    expect(candidates[0]).toMatchObject({
      system: 'https://data.europa.eu/snb/education-level',
      version: 'demo-2026-10',
      code: 'synthetic-bachelor-001',
      label: 'Cualificación sintética de nivel de grado',
      display: 'Bachelor-level synthetic qualification',
    })
  })

  it('resolves another language for the exact selected system and code', async () => {
    const resolveCodeLabels = vi.fn().mockResolvedValue({
      system: 'https://data.europa.eu/snb/education-level',
      code: 'synthetic-bachelor-001',
      text: 'Cualificación sintética de nivel de grado',
      display: 'Bachelor-level synthetic qualification',
      language: 'es',
      terminologyVersion: 'demo-2026-10',
    })

    await resolveQualificationClassificationLabel({
      system: 'https://data.europa.eu/snb/education-level',
      code: 'synthetic-bachelor-001',
      version: 'demo-2026-10',
      language: 'es',
    }, { resolveCodeLabels } as never)

    expect(resolveCodeLabels).toHaveBeenCalledWith(expect.objectContaining({
      claim: 'org.schema.EducationalOccupationalCredential.credentialCategory',
      system: 'https://data.europa.eu/snb/education-level',
      code: 'synthetic-bachelor-001',
      version: 'demo-2026-10',
      language: 'es',
    }))
  })
})
