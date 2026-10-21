import { headers } from 'next/headers'
import type { CSSProperties } from 'react'
import { ControllerEnvironmentEntry } from '../components/ControllerEnvironmentEntry'
import { readPortalEnvironment, resolvePortalDeployment } from '../config/portal-config'

export const dynamic = 'force-dynamic'

function accentStyle(accentColor: string): CSSProperties {
  return { '--portal-accent': accentColor } as CSSProperties
}

export default async function HomePage() {
  const requestHeaders = await headers()
  const config = resolvePortalDeployment(requestHeaders.get('host') || 'localhost')
  const environment = readPortalEnvironment()
  return <div style={accentStyle(config.accentColor)}>
    <ControllerEnvironmentEntry config={config} environment={environment}/>
  </div>
}
