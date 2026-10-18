// Flow contract: the local controller BFF, not the browser, hashes an allowed evidence attachment as CIDv1 raw with SHA3-384, returns only an opaque content reference and rejects unsupported or empty input. This local fixture does not claim durable storage or gateway persistence.
import { describe, expect, it } from 'vitest'
import { createLocalEvidenceAttachment } from '../src/server/evidence-attachment'

describe('local evidence attachment boundary', () => {
  it('creates a stable SHA3-384 content identifier without retaining bytes', () => {
    const input = { bytes: new TextEncoder().encode('%PDF-1.4\nfixture'), fileName: 'example.pdf', mediaType: 'application/pdf' }
    const first = createLocalEvidenceAttachment(input)
    const second = createLocalEvidenceAttachment(input)
    expect(first.contentId).toMatch(/^z[1-9A-HJ-NP-Za-km-z]+$/u)
    expect(first.contentId).toBe(second.contentId)
    expect(first.storageReference).toBe(`urn:cid:${first.contentId}`)
    expect(JSON.stringify(first)).not.toContain('%PDF')
  })

  it('rejects unsupported and empty evidence', () => {
    expect(() => createLocalEvidenceAttachment({ bytes: new Uint8Array([1]), fileName: 'x.txt', mediaType: 'text/plain' }))
      .toThrow(/unsupported evidence media type/i)
    expect(() => createLocalEvidenceAttachment({ bytes: new Uint8Array(), fileName: 'x.pdf', mediaType: 'application/pdf' }))
      .toThrow(/between 1 byte and 5 MiB/i)
  })
})
