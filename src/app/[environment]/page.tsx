import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import type { CSSProperties } from 'react'
import { ControllerSignInRequired } from '../../components/ControllerSignInRequired'
import { ControllerWorkspace } from '../../components/ControllerWorkspace'
import { HostOrganizationAdministration } from '../../components/HostOrganizationAdministration'
import { readPortalEnvironment, resolvePortalDeployment } from '../../config/portal-config'
import { localDemoAccess } from '../../security/demo-access'
import { resolveHostOperatorAccess } from '../../security/host-operator-authority'

export const dynamic = 'force-dynamic'
type EnvironmentName = 'demo' | 'test-network' | 'production'
function isEnvironment(value: string): value is EnvironmentName { return value === 'demo' || value === 'test-network' || value === 'production' }

export default async function ControllerEnvironmentPage({ params }: Readonly<{ params: Promise<{ environment: string }> }>) {
  const selected = (await params).environment
  if (!isEnvironment(selected)) notFound()
  const requestHeaders = await headers()
  const config = resolvePortalDeployment(requestHeaders.get('host') || 'localhost')
  const environment = readPortalEnvironment()
  const enabled = selected === 'demo' || (selected === 'test-network' && environment.testNetworkEnabled) || (selected === 'production' && environment.productionEnabled)
  if (!enabled || selected !== environment.active) return <ControllerSignInRequired mode={selected === 'demo' ? 'demo' : 'trusted'} supportUrl={config.supportUrl}/>
  const style = { '--portal-accent': config.accentColor } as CSSProperties
  if (config.kind === 'host-controller') {
    const access = resolveHostOperatorAccess()
    return <div style={style}>{access.authenticated ? <HostOrganizationAdministration portalName={config.name} allowedSectors={config.allowedSectors}/> : <ControllerSignInRequired mode={selected === 'demo' ? 'demo' : 'trusted'} supportUrl={config.supportUrl}/>}</div>
  }
  const access = localDemoAccess()
  return <div style={style}>{access.authenticated ? <ControllerWorkspace portalName={config.name} organizationName="Organization" modules={config.modules}/> : <ControllerSignInRequired mode={selected === 'demo' ? 'demo' : 'trusted'} supportUrl={config.supportUrl}/>}</div>
}
