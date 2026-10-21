import { PortalAccessChooser, PortalEntryHero, type PortalBrand } from 'antifraud-common-components-react'
import type { PortalEnvironmentConfig } from '../config/portal-config'

type EntryConfig = Readonly<{ name: string; logoUrl: string; accentColor: string }>

export function ControllerEnvironmentEntry({ config, environment }: Readonly<{ config: EntryConfig; environment: PortalEnvironmentConfig }>) {
  const artwork = { lightSurface: { src: config.logoUrl, alt: config.name, width: 160, height: 160 }, darkSurface: { src: config.logoUrl, alt: config.name, width: 160, height: 160 } }
  const brand: PortalBrand = { family: 'controller', productName: config.name, organizationName: config.name, homeHref: '/', mark: artwork }
  const availability = (enabled: boolean, requirement: string) => enabled ? requirement : `${requirement} · not enabled on this deployment`
  return <main className="controller-entry"><PortalEntryHero brand={brand} eyebrow="Controller access" title="Choose an environment" description="Demo, Test Network and Production keep separate identities, organizations and authoritative state."/><PortalAccessChooser label="Controller environments" options={[
    { id: 'demo', href: '/demo', title: 'Demo — simulated blockchain', description: 'Resettable examples for guided demonstrations.', requirement: 'Demo identity' },
    { id: 'test-network', href: '/test-network', title: 'Test Network', description: 'Persistent synthetic data against the provisioned test network.', requirement: availability(environment.testNetworkEnabled, 'Test Network account') },
    { id: 'production', href: '/production', title: 'Production', description: 'Governed organization and host administration.', requirement: availability(environment.productionEnabled, 'Production authority') },
  ]}/></main>
}
