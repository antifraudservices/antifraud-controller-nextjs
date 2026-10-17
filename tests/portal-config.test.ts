// Flow contract: portal branding changes presentation only and cannot configure a sector, tenant identity, authority, subject scope or credential.
import { describe, expect, it } from 'vitest'
import { readPortalConfig } from '../src/config/portal-config'

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
    expect(readPortalConfig({ CONTROLLER_PORTAL_ROLE: 'physician', CONTROLLER_PORTAL_SCOPE: 'patient/*.write' }))
      .not.toHaveProperty('role')
  })
})
