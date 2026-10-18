import type { AntifraudGatewayClient } from 'antifraud-sdk-node-ts'

type ClearingHouseClient = Pick<AntifraudGatewayClient, 'listClearingHouseInbox' | 'decideClearingHouseEvidence'>
export type ClearingHouseDecision = Readonly<{
  evidenceLocator: string
  decision: 'confirmed' | 'rejected' | 'revoked'
  issuerProofReference: string
}>

export function readClearingHouseInbox(client: ClearingHouseClient) {
  return client.listClearingHouseInbox()
}

export async function decideClearingHouseItem(client: ClearingHouseClient, input: ClearingHouseDecision): Promise<unknown> {
  if (Object.hasOwn(input, 'organizationReference')) throw new Error('Browser-owned organization authority is not accepted.')
  return client.decideClearingHouseEvidence(input.evidenceLocator, {
    decision: input.decision,
    issuerProofReference: input.issuerProofReference,
  })
}
