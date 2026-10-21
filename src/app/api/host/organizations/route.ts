import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { resolvePortalDeployment } from '../../../../config/portal-config'
import { resolveHostOperatorAccess } from '../../../../security/host-operator-authority'
import { createHostOrganizationDirectory, executeHostOrganizationLifecycle, searchHostOrganizations, type HostOrganizationStatus } from '../../../../server/host-organization-administration'

export const dynamic = 'force-dynamic'

function required(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required.`)
  return value
}

function configuredNetwork(): 'test' | 'local-network' | 'test-network' | 'network' {
  const value = required('SOS_GATEWAY_HOST_NETWORK')
  if (!['test', 'local-network', 'test-network', 'network'].includes(value)) throw new Error('SOS_GATEWAY_HOST_NETWORK is invalid.')
  return value as ReturnType<typeof configuredNetwork>
}

export async function GET(request: Request) {
  const requestHeaders = await headers()
  const deployment = resolvePortalDeployment(requestHeaders.get('host') || 'localhost')
  const access = resolveHostOperatorAccess()
  if (deployment.kind !== 'host-controller' || !deployment.modules.includes('host-organizations') || !access.authenticated) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })
  }
  try {
    const jurisdiction = required('SOS_GATEWAY_HOST_JURISDICTION')
    if (!deployment.allowedJurisdictions.includes(jurisdiction)) throw new Error('Configured jurisdiction is not enabled for this hostname.')
    const url = new URL(request.url)
    const sector = url.searchParams.get('sector')?.trim() || ''
    if (!sector || !deployment.allowedSectors.includes(sector)) return NextResponse.json({ error: 'Sector is not enabled for this hostname.' }, { status: 400 })
    const status = url.searchParams.get('status')?.trim() || undefined
    if (status && !['active', 'suspended', 'revoked'].includes(status)) return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
    const pageSizeValue = url.searchParams.get('pageSize')
    const pageSize = pageSizeValue ? Number(pageSizeValue) : 25
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) return NextResponse.json({ error: 'Invalid page size.' }, { status: 400 })
    const directory = createHostOrganizationDirectory({
      gatewayBaseUrl: required('SOS_GATEWAY_HOST_BASE_URL'),
      bearerToken: required('SOS_GATEWAY_HOST_BEARER'),
      jurisdiction,
      network: configuredNetwork(),
      appId: required('SOS_GATEWAY_HOST_APP_ID'),
      appVersion: process.env.npm_package_version || '0.1.0',
    })
    return NextResponse.json(await searchHostOrganizations(directory, {
      sector,
      status: status as HostOrganizationStatus | undefined,
      legalName: url.searchParams.get('legalName')?.trim() || undefined,
      identifierValue: url.searchParams.get('identifierValue')?.trim() || undefined,
      cursor: url.searchParams.get('cursor')?.trim() || undefined,
      pageSize,
    }))
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : 'Host organization directory failed.' }, { status: 502 })
  }
}

export async function POST(request: Request) {
  const requestHeaders = await headers()
  const deployment = resolvePortalDeployment(requestHeaders.get('host') || 'localhost')
  const access = resolveHostOperatorAccess()
  if (deployment.kind !== 'host-controller' || !deployment.modules.includes('host-organizations') || !access.authenticated) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })
  try {
    const jurisdiction = required('SOS_GATEWAY_HOST_JURISDICTION')
    if (!deployment.allowedJurisdictions.includes(jurisdiction)) throw new Error('Configured jurisdiction is not enabled for this hostname.')
    const body = await request.json() as Record<string, unknown>
    const allowed = new Set(['action', 'sector', 'identifierType', 'identifierValue', 'sameAs'])
    if (Object.keys(body).some(key => !allowed.has(key))) return NextResponse.json({ error: 'Browser-owned authority is not accepted.' }, { status: 400 })
    const action = String(body.action || '')
    if (!['_status', '_disable', '_enable', '_purge'].includes(action)) return NextResponse.json({ error: 'Invalid lifecycle action.' }, { status: 400 })
    const sector = String(body.sector || '').trim()
    if (!sector || !deployment.allowedSectors.includes(sector)) return NextResponse.json({ error: 'Sector is not enabled for this hostname.' }, { status: 400 })
    const directory = createHostOrganizationDirectory({ gatewayBaseUrl: required('SOS_GATEWAY_HOST_BASE_URL'), bearerToken: required('SOS_GATEWAY_HOST_BEARER'), jurisdiction, network: configuredNetwork(), appId: required('SOS_GATEWAY_HOST_APP_ID'), appVersion: process.env.npm_package_version || '0.1.0' })
    return NextResponse.json(await executeHostOrganizationLifecycle(directory, { action: action as '_status' | '_disable' | '_enable' | '_purge', sector, identifierType: String(body.identifierType || ''), identifierValue: String(body.identifierValue || ''), sameAs: String(body.sameAs || '') || undefined }))
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : 'Host organization lifecycle failed.' }, { status: 502 })
  }
}
