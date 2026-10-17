export type PortalConfig = Readonly<{
  name: string
  logoUrl: string
  accentColor: string
  supportUrl: string
}>

type Environment = Readonly<Record<string, string | undefined>>

const DEFAULT_CONFIG: PortalConfig = Object.freeze({
  name: 'Antifraud Controller',
  logoUrl: '/brand/controller-mark.svg',
  accentColor: '#075f68',
  supportUrl: 'https://github.com/antifraudservices/antifraud-controller-nextjs',
})

const HEX_COLOR = /^#[0-9a-f]{6}$/iu

function safeLogoUrl(value: string): boolean {
  return value.startsWith('/') || /^https:\/\/[a-z0-9.-]+(?:\/[^\s]*)?$/iu.test(value)
}

function safeSupportUrl(value: string): boolean {
  return /^https:\/\/[a-z0-9.-]+(?:\/[^\s]*)?$/iu.test(value)
}

export function readPortalConfig(environment: Environment = process.env): PortalConfig {
  const name = environment.CONTROLLER_PORTAL_NAME?.trim() || DEFAULT_CONFIG.name
  const logoUrl = environment.CONTROLLER_PORTAL_LOGO_URL?.trim() || DEFAULT_CONFIG.logoUrl
  const accentColor = environment.CONTROLLER_PORTAL_ACCENT_COLOR?.trim() || DEFAULT_CONFIG.accentColor
  const supportUrl = environment.CONTROLLER_PORTAL_SUPPORT_URL?.trim() || DEFAULT_CONFIG.supportUrl

  if (name.length > 64) throw new Error('Portal name must be 64 characters or fewer.')
  if (!safeLogoUrl(logoUrl)) throw new Error('Portal logo must use a local path or HTTPS URL.')
  if (!HEX_COLOR.test(accentColor)) throw new Error('Portal accent must be a six-digit hexadecimal color.')
  if (!safeSupportUrl(supportUrl)) throw new Error('Portal support URL must use HTTPS.')

  return Object.freeze({ name, logoUrl, accentColor, supportUrl })
}
