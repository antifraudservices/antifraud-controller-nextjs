// Flow contract: the controller backend-for-frontend lists only gateway-addressed Clearing House references and submits a decision without accepting actor, organization or routing authority from the browser.
import { describe, expect, it, vi } from 'vitest'
import { decideClearingHouseItem, readClearingHouseInbox } from '../src/server/clearing-house'

describe('controller Clearing House BFF', () => {
  it('lists addressed items and delegates a decision', async () => {
    const client = {
      listClearingHouseInbox: vi.fn().mockResolvedValue({items: [{evidenceLocator: 'evidence:one'}]}),
      decideClearingHouseEvidence: vi.fn().mockResolvedValue({status: 'confirmed'}),
    }
    await expect(readClearingHouseInbox(client as never)).resolves.toEqual({items: [{evidenceLocator: 'evidence:one'}]})
    await decideClearingHouseItem(client as never, {evidenceLocator: 'evidence:one', decision: 'confirmed', issuerProofReference: 'proof:issuer:one'})
    expect(client.decideClearingHouseEvidence).toHaveBeenCalledWith('evidence:one', {decision: 'confirmed', issuerProofReference: 'proof:issuer:one'})
  })

  it('rejects browser-owned organization authority', async () => {
    await expect(decideClearingHouseItem({} as never, {
      evidenceLocator: 'evidence:one', decision: 'confirmed', issuerProofReference: 'proof:one', organizationReference: 'organization:other',
    } as never)).rejects.toThrow(/organization authority/i)
  })
})
