// Flow contract: the Controller BFF, not the browser, prepares an allowed file through the high-level SDK, stores JWE-sealed bytes through the Gateway, verifies exact authorized retrieval, and returns only an opaque CID reference.
import { describe, expect, it } from 'vitest'
import { createLocalEvidenceAttachment } from '../src/server/evidence-attachment'

describe('local evidence attachment boundary', () => {
  it('stores and verifies exact PDF bytes through the high-level gateway SDK', async () => {
    const bytes = new TextEncoder().encode('%PDF-1.4\nfixture\n%%EOF\n')
    const calls: string[] = []
    let storedBytes = new Uint8Array()
    const client = {
      async storeConfidentialArtifact(input: Parameters<import('antifraud-sdk-node-ts').AntifraudGatewayClient['storeConfidentialArtifact']>[0]) {
        calls.push('store')
        storedBytes = Buffer.from(input.attachment.data.base64, 'base64url')
        return {document: {}, artifact: {artifactId: input.document.documents[0].attachment.contentId, objectName: 'opaque', byteCount: storedBytes.byteLength}}
      },
      async readConfidentialArtifact() {
        calls.push('read')
        return {mediaType: 'application/pdf', fileName: 'example.pdf', bytes: storedBytes}
      },
    }
    const input = { bytes, fileName: 'example.pdf', mediaType: 'application/pdf' }
    const first = await createLocalEvidenceAttachment(input, client)
    const second = await createLocalEvidenceAttachment(input, client)
    expect(first.contentId).toMatch(/^z[1-9A-HJ-NP-Za-km-z]+$/u)
    expect(first.contentId).toBe(second.contentId)
    expect(first.storageReference).toBe(`/v1/confidential-artifacts/${encodeURIComponent(first.contentId)}`)
    expect(JSON.stringify(first)).not.toContain('%PDF')
    expect(calls).toEqual(['store', 'read', 'store', 'read'])
  })

  it('rejects unsupported and empty evidence before calling the gateway', async () => {
    const unusedClient = {} as Parameters<typeof createLocalEvidenceAttachment>[1]
    await expect(createLocalEvidenceAttachment({ bytes: new Uint8Array([1]), fileName: 'x.txt', mediaType: 'text/plain' }, unusedClient))
      .rejects.toThrow(/unsupported evidence media type/i)
    await expect(createLocalEvidenceAttachment({ bytes: new Uint8Array(), fileName: 'x.pdf', mediaType: 'application/pdf' }, unusedClient))
      .rejects.toThrow(/between 1 byte and 5 MiB/i)
  })
})
