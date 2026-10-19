// Flow contract: portal branding changes presentation only and cannot configure tenant identity, authority, subject scope or credentials.
import { describe, expect, it } from 'vitest'
import { readPortalConfig, readPortalEnvironment } from '../src/config/portal-config'

describe('portal presentation configuration', () => {
  it('normalizes a neutral deployment brand', () => {
    expect(readPortalConfig({
      CONTROLLER_PORTAL_NAME: 'Civic Controller',
      CONTROLLER_PORTAL_LOGO_URL: '/brand/civic.svg',
      CONTROLLER_PORTAL_ACCENT_COLOR: '#075f68',
      CONTROLLER_PORTAL_SUPPORT_URL: 'https://support.example.org/controller',
    })).toEqual({
      name: 'Civic Controller',
      logoUrl: '/brand/civic.svg',
      accentColor: '#075f68',
      supportUrl: 'https://support.example.org/controller',
    })
  })

  it('rejects unsafe visual configuration and ignores authority-shaped values', () => {
    expect(() => readPortalConfig({ CONTROLLER_PORTAL_LOGO_URL: 'javascript:alert(1)' })).toThrow(/logo/i)
    expect(() => readPortalConfig({ CONTROLLER_PORTAL_ACCENT_COLOR: 'red; background:url(x)' })).toThrow(/accent/i)
    expect(readPortalConfig({ CONTROLLER_PORTAL_ROLE: 'reviewer', CONTROLLER_PORTAL_SCOPE: 'subject/*.write' }))
      .not.toHaveProperty('role')
  })
})

describe('server-owned portal environment', () => {
  it('defaults to Demo and keeps Test Network and Production disabled', () => {
    expect(readPortalEnvironment({})).toEqual({
      active: 'demo', testNetworkEnabled: false, productionEnabled: false,
    })
  })

  it('cannot be changed through public browser-shaped configuration', () => {
    expect(readPortalEnvironment({
      NEXT_PUBLIC_ANTIFRAUD_NETWORK_KIND: 'production',
      NEXT_PUBLIC_COLLECTION_PREFIX: 'antifraud_production_',
    })).toEqual({active: 'demo', testNetworkEnabled: false, productionEnabled: false})
  })

  it('enables Test Network only through the private server gate', () => {
    expect(readPortalEnvironment({
      ANTIFRAUD_NETWORK_KIND: 'test-network',
      ANTIFRAUD_TEST_NETWORK_ENABLED: 'true',
    })).toEqual({active: 'test-network', testNetworkEnabled: true, productionEnabled: false})
    expect(() => readPortalEnvironment({
      ANTIFRAUD_NETWORK_KIND: 'network',
      ANTIFRAUD_PRODUCTION_ENABLED: 'false',
    })).toThrow(/Production is disabled/u)
  })
})
