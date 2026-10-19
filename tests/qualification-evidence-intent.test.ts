// Flow contract: the Controller BFF accepts an employer evidence intent only when it carries a governed qualification classification; the localized label never substitutes for system and code.
import { describe, expect, it } from 'vitest'

import { normalizeQualificationEvidenceIntent } from '../src/server/qualification-evidence-intent'

const intent = {
  employeeId: 'employee:one',
  qualification: {
    title: 'Example degree', type: 'degree',
    identifier: { system: 'https://issuer.example/credentials', value: 'DEGREE-001' },
    classification: {
      system: 'https://data.europa.eu/snb/education-level', version: 'demo-2026-10',
      code: 'synthetic-bachelor-001', display: 'Bachelor-level synthetic qualification',
    },
  },
  issuer: { organizationReference: 'organization:issuer', legalIdentifier: 'ISSUER-1', jurisdiction: 'ES' },
  evidence: { reference: 'artifact:one', contentId: 'zOpaque', mediaType: 'application/pdf', fileName: 'degree.pdf' },
  assertionKind: 'employer-attestation',
}

describe('qualification evidence intent', () => {
  it('normalizes and retains the canonical classification identity', () => {
    expect(normalizeQualificationEvidenceIntent(intent).qualification.classification).toEqual(intent.qualification.classification)
  })

  it('rejects a translated label without system and code', () => {
    expect(() => normalizeQualificationEvidenceIntent({
      ...intent,
      qualification: {...intent.qualification, classification: {display: 'Grado'}},
    })).toThrow(/classification system must not be empty/i)
  })
})
