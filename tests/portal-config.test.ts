// Flow contract: portal branding changes presentation only and cannot configure tenant identity, authority, subject scope or credentials.
import { describe, expect, it } from 'vitest'
import { readPortalConfig, readPortalEnvironment, resolvePortalDeployment } from '../src/config/portal-config'

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

describe('server-owned hostname deployment manifest', () => {
  const profiles = JSON.stringify({
    'controller-st.connecthealth.info': {
      id: 'neutral-controller',
      kind: 'organization-controller',
      name: 'Organization Controller',
      logoUrl: '/brand/controller-mark.svg',
      accentColor: '#075f68',
      supportUrl: 'https://support.connecthealth.info/controller',
      modules: ['organization', 'workforce', 'evidence'],
      allowedSectors: ['health-care', 'animal-care', 'education'],
      allowedJurisdictions: ['ES', 'CA', 'US'],
      enrollmentPolicy: 'jurisdiction-provider',
    },
    'host-st.connecthealth.info': {
      id: 'neutral-host',
      kind: 'host-controller',
      name: 'Federation Host',
      logoUrl: '/brand/controller-mark.svg',
      accentColor: '#123456',
      supportUrl: 'https://support.connecthealth.info/host',
      modules: ['host-organizations', 'host-observability'],
      allowedSectors: ['health-care', 'animal-care', 'education'],
      allowedJurisdictions: ['ES', 'CA', 'US'],
      enrollmentPolicy: 'jurisdiction-provider',
    },
  })

  it('resolves an exact request hostname through a private allowlisted manifest', () => {
    expect(resolvePortalDeployment('controller-st.connecthealth.info:443', {
      CONTROLLER_PORTAL_HOST_PROFILES_JSON: profiles,
    })).toMatchObject({
      hostname: 'controller-st.connecthealth.info',
      id: 'neutral-controller',
      kind: 'organization-controller',
      modules: ['organization', 'workforce', 'evidence'],
      allowedSectors: ['health-care', 'animal-care', 'education'],
    })
  })

  it('keeps host authority separate even when the same service binary renders both portals', () => {
    expect(resolvePortalDeployment('host-st.connecthealth.info', {
      CONTROLLER_PORTAL_HOST_PROFILES_JSON: profiles,
    })).toMatchObject({
      kind: 'host-controller',
      modules: ['host-organizations', 'host-observability'],
    })
  })

  it('fails closed for an unknown or suffix-spoofed hostname when a manifest is configured', () => {
    expect(() => resolvePortalDeployment('controller-st.connecthealth.info.attacker.invalid', {
      CONTROLLER_PORTAL_HOST_PROFILES_JSON: profiles,
    })).toThrow(/hostname is not configured/i)
    expect(() => resolvePortalDeployment('unknown.connecthealth.info', {
      CONTROLLER_PORTAL_HOST_PROFILES_JSON: profiles,
    })).toThrow(/hostname is not configured/i)
  })

  it('rejects public browser configuration and authority-shaped module values', () => {
    expect(resolvePortalDeployment('localhost:3600', {
      NEXT_PUBLIC_CONTROLLER_PORTAL_HOST_PROFILES_JSON: profiles,
    })).toMatchObject({ id: 'default', kind: 'organization-controller' })
    expect(() => resolvePortalDeployment('host-st.connecthealth.info', {
      CONTROLLER_PORTAL_HOST_PROFILES_JSON: JSON.stringify({
        'host-st.connecthealth.info': {
          id: 'bad', kind: 'host-controller', name: 'Bad', logoUrl: '/bad.svg', accentColor: '#123456',
          supportUrl: 'https://support.example.org', modules: ['fabric-channel-admin'],
          allowedSectors: ['education'], allowedJurisdictions: ['ES'], enrollmentPolicy: 'jurisdiction-provider',
        },
      }),
    })).toThrow(/module/i)
  })

  it('retains the existing single-deployment presentation variables when no hostname manifest is configured', () => {
    expect(resolvePortalDeployment('localhost:3600', {
      CONTROLLER_PORTAL_NAME: 'Legacy configured brand',
      CONTROLLER_PORTAL_LOGO_URL: '/brand/legacy.svg',
      CONTROLLER_PORTAL_ACCENT_COLOR: '#112233',
      CONTROLLER_PORTAL_SUPPORT_URL: 'https://support.example.org/legacy',
    })).toMatchObject({
      hostname: 'localhost',
      id: 'default',
      name: 'Legacy configured brand',
      logoUrl: '/brand/legacy.svg',
    })
  })
})
