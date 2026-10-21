export type HostOrganizationStatus = 'active' | 'suspended' | 'revoked'
export type HostOrganizationSearchInput = Readonly<{
  sector?: string
  status?: HostOrganizationStatus
  legalName?: string
  identifierValue?: string
  pageSize?: number
  cursor?: string
}>
export type HostOrganizationPage = Readonly<{
  total: number
  pageSize: number
  returned: number
  hasNext: boolean
  nextCursor?: string
  organizations: readonly Readonly<{
    id: string
    legalName: string
    identifierType: string
    identifierValue: string
    jurisdiction: string
    sector: string
    status: HostOrganizationStatus
    sameAs?: string
  }>[]
}>
export type HostOrganizationDirectory = Readonly<{
  search(input: HostOrganizationSearchInput): Promise<HostOrganizationPage>
  lifecycle(action: '_status' | '_disable' | '_enable' | '_purge', target: Readonly<{ identifierType: string; identifierValue: string; sameAs?: string }>): Promise<Readonly<{ status: HostOrganizationStatus }>>
}>

const allowedKeys = new Set(['sector', 'status', 'legalName', 'identifierValue', 'pageSize', 'cursor'])

export async function searchHostOrganizations(
  client: HostOrganizationDirectory,
  input: HostOrganizationSearchInput,
): Promise<HostOrganizationPage> {
  if (Object.keys(input).some(key => !allowedKeys.has(key))) {
    throw new Error('Browser-owned host authority is not accepted.')
  }
  return client.search(input)
}

export async function executeHostOrganizationLifecycle(
  client: HostOrganizationDirectory,
  input: Readonly<{ action: '_status' | '_disable' | '_enable' | '_purge'; sector: string; identifierType: string; identifierValue: string; sameAs?: string }>,
): Promise<HostOrganizationPage> {
  const before = await client.search({ sector: input.sector, identifierValue: input.identifierValue, pageSize: 100 })
  const target = before.organizations.find(organization => organization.identifierType === input.identifierType
    && organization.identifierValue === input.identifierValue
    && (input.sameAs ? organization.sameAs === input.sameAs : true))
  if (!target) throw new Error('The selected organization is not present in the authoritative host directory.')
  await client.lifecycle(input.action, { identifierType: target.identifierType, identifierValue: target.identifierValue, sameAs: target.sameAs })
  return client.search({ sector: input.sector, identifierValue: target.identifierValue, pageSize: 100 })
}

type TrustedHostDirectoryContext = Readonly<{
  gatewayBaseUrl: string
  bearerToken: string
  jurisdiction: string
  network: 'test' | 'local-network' | 'test-network' | 'network'
  appId: string
  appVersion: string
}>

export function createHostOrganizationDirectory(context: TrustedHostDirectoryContext): HostOrganizationDirectory {
  const client = new SosGatewayHostOrganizationDirectoryClient({
    baseUrl: context.gatewayBaseUrl,
    bearerToken: context.bearerToken,
    appId: context.appId,
    appVersion: context.appVersion,
  })
  return Object.freeze({
    async search(input: HostOrganizationSearchInput): Promise<HostOrganizationPage> {
      return client.search({ jurisdiction: context.jurisdiction, network: context.network }, {
        pageSize: input.pageSize,
        cursor: input.cursor,
        filters: {
          sector: input.sector,
          status: input.status,
          legalName: input.legalName,
          identifierValue: input.identifierValue,
        },
      })
    },
    async lifecycle(action, target) {
      return client.lifecycle({ jurisdiction: context.jurisdiction, network: context.network }, action, target)
    },
  })
}
import { SosGatewayHostOrganizationDirectoryClient } from 'sos-sdk-node-ts/host-organization-directory-client'
