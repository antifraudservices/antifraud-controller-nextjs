import Image from 'next/image'
import type { CSSProperties } from 'react'
import { ControllerWorkspace } from '../components/ControllerWorkspace'
import { readPortalConfig, readPortalEnvironment } from '../config/portal-config'
import { localDemoAccess } from '../security/demo-access'

export const dynamic = 'force-dynamic'

function accentStyle(accentColor: string): CSSProperties {
  return { '--portal-accent': accentColor } as CSSProperties
}

function Brand({ name, logoUrl }: Readonly<{ name: string; logoUrl: string }>) {
  return <a className="brand" href="/" aria-label={`${name} home`}><Image src={logoUrl} width={38} height={38} alt="" priority/><strong>{name}</strong></a>
}

function SignInRequired({ name, logoUrl, accentColor, supportUrl }: Readonly<{
  name: string
  logoUrl: string
  accentColor: string
  supportUrl: string
}>) {
  return <main className="gate-shell" style={accentStyle(accentColor)}><section className="gate-panel"><Brand name={name} logoUrl={logoUrl}/><h1>Controller sign-in required</h1><p>This portal fails closed until the trusted BFF verifies controller authority for one exact organization.</p><button type="button" disabled>Continue with configured identity provider</button><a href={supportUrl}>Deployment support</a></section></main>
}

export default function HomePage() {
  const config = readPortalConfig()
  const environment = readPortalEnvironment()
  const access = localDemoAccess()
  if (!access.authenticated) return <SignInRequired {...config}/>

  return <div style={accentStyle(config.accentColor)}>
    <ControllerWorkspace portalName={config.name} organizationName="Organization" environment={environment} />
  </div>
}
