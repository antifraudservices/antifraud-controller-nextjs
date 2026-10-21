export type PortalConfig = Readonly<{
  name: string
  logoUrl: string
  accentColor: string
  supportUrl: string
}>

export const PORTAL_MODULES = Object.freeze([
  'organization',
  'workforce',
  'structure',
  'evidence',
  'clearing-house',
  'host-organizations',
  'host-observability',
] as const)

export type PortalModule = typeof PORTAL_MODULES[number]
export type PortalKind = 'organization-controller' | 'host-controller'
export type PortalDeployment = PortalConfig & Readonly<{
  hostname: string
  id: string
  kind: PortalKind
  modules: readonly PortalModule[]
  allowedSectors: readonly string[]
  allowedJurisdictions: readonly string[]
  enrollmentPolicy: 'jurisdiction-provider'
}>

export type PortalEnvironmentConfig = Readonly<{
  active: 'demo' | 'test-network' | 'production'
  testNetworkEnabled: boolean
  productionEnabled: boolean
}>

type Environment = Readonly<Record<string, string | undefined>>

const DEFAULT_CONFIG: PortalConfig = Object.freeze({
  name: 'Antifraud Controller',
  logoUrl: '/brand/controller-mark.svg',
  accentColor: '#075f68',
  supportUrl: 'https://github.com/antifraudservices/antifraud-controller-nextjs',
})

const DEFAULT_DEPLOYMENT = Object.freeze({
  ...DEFAULT_CONFIG,
  hostname: 'localhost',
  id: 'default',
  kind: 'organization-controller' as const,
  modules: Object.freeze(['organization', 'workforce', 'structure', 'evidence', 'clearing-house'] as const),
  allowedSectors: Object.freeze([] as string[]),
  allowedJurisdictions: Object.freeze([] as string[]),
  enrollmentPolicy: 'jurisdiction-provider' as const,
})

const HEX_COLOR = /^#[0-9a-f]{6}$/iu

function safeLogoUrl(value: string): boolean {
  return value.startsWith('/') || /^https:\/\/[a-z0-9.-]+(?:\/[^\s]*)?$/iu.test(value)
}

function safeSupportUrl(value: string): boolean {
  return /^https:\/\/[a-z0-9.-]+(?:\/[^\s]*)?$/iu.test(value)
}

function normalizeHostname(value: string): string {
  const candidate = value.trim().toLowerCase().replace(/\.$/u, '')
  const hostname = candidate.startsWith('[')
    ? candidate.slice(1, candidate.indexOf(']'))
    : candidate.split(':')[0]
  if (!hostname || !/^(?:localhost|[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?)$/u.test(hostname)) {
    throw new Error('Portal hostname is invalid.')
  }
  return hostname
}

function stringList(value: unknown, label: string): readonly string[] {
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string' || !item.trim())) {
    throw new Error(`${label} must be a non-empty string list.`)
  }
  return Object.freeze([...new Set(value.map(item => item.trim()))])
}

function parseDeployment(hostname: string, value: unknown): PortalDeployment {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Portal profile must be an object.')
  const profile = value as Record<string, unknown>
  const kind = profile.kind
  if (kind !== 'organization-controller' && kind !== 'host-controller') throw new Error('Portal kind is invalid.')
  const modules = stringList(profile.modules, 'Portal modules')
  if (modules.some(module => !PORTAL_MODULES.includes(module as PortalModule))) throw new Error('Portal module is not supported.')
  const name = String(profile.name || '').trim()
  const logoUrl = String(profile.logoUrl || '').trim()
  const accentColor = String(profile.accentColor || '').trim()
  const supportUrl = String(profile.supportUrl || '').trim()
  const id = String(profile.id || '').trim()
  if (!id || !/^[a-z0-9][a-z0-9-]{0,63}$/u.test(id)) throw new Error('Portal profile id is invalid.')
  if (!name || name.length > 64) throw new Error('Portal name must be between 1 and 64 characters.')
  if (!safeLogoUrl(logoUrl)) throw new Error('Portal logo must use a local path or HTTPS URL.')
  if (!HEX_COLOR.test(accentColor)) throw new Error('Portal accent must be a six-digit hexadecimal color.')
  if (!safeSupportUrl(supportUrl)) throw new Error('Portal support URL must use HTTPS.')
  if (profile.enrollmentPolicy !== 'jurisdiction-provider') throw new Error('Portal enrollment policy is invalid.')
  return Object.freeze({
    hostname,
    id,
    kind,
    name,
    logoUrl,
    accentColor,
    supportUrl,
    modules: modules as readonly PortalModule[],
    allowedSectors: stringList(profile.allowedSectors, 'Allowed sectors'),
    allowedJurisdictions: stringList(profile.allowedJurisdictions, 'Allowed jurisdictions'),
    enrollmentPolicy: 'jurisdiction-provider',
  })
}

/**
 * Resolves presentation and enabled modules from an exact, server-owned
 * hostname allowlist. The result narrows what the portal may offer; it never
 * grants controller, host, tenant, sector or professional authority.
 */
export function resolvePortalDeployment(
  requestHost: string,
  environment: Environment = process.env,
): PortalDeployment {
  const hostname = normalizeHostname(requestHost || 'localhost')
  const encodedProfiles = environment.CONTROLLER_PORTAL_HOST_PROFILES_JSON?.trim()
  if (!encodedProfiles) return Object.freeze({ ...DEFAULT_DEPLOYMENT, ...readPortalConfig(environment), hostname })
  let profiles: unknown
  try {
    profiles = JSON.parse(encodedProfiles)
  } catch {
    throw new Error('Portal hostname manifest is not valid JSON.')
  }
  if (!profiles || typeof profiles !== 'object' || Array.isArray(profiles)) {
    throw new Error('Portal hostname manifest must be an object.')
  }
  const profile = (profiles as Record<string, unknown>)[hostname]
  if (!profile) throw new Error(`Portal hostname is not configured: ${hostname}`)
  return parseDeployment(hostname, profile)
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

export function readPortalEnvironment(environment: Environment = process.env): PortalEnvironmentConfig {
  const requested = environment.ANTIFRAUD_NETWORK_KIND ?? 'demo'
  const testNetworkEnabled = environment.ANTIFRAUD_TEST_NETWORK_ENABLED === 'true'
  const productionEnabled = environment.ANTIFRAUD_PRODUCTION_ENABLED === 'true'
  if (requested === 'demo' || requested === 'test') {
    return Object.freeze({active: 'demo', testNetworkEnabled, productionEnabled})
  }
  if (requested === 'test-network') {
    if (!testNetworkEnabled) throw new Error('Test Network is disabled until its Fabric runtime is provisioned.')
    return Object.freeze({active: 'test-network', testNetworkEnabled, productionEnabled})
  }
  if (requested === 'network' || requested === 'production') {
    if (!productionEnabled) throw new Error('Production is disabled.')
    return Object.freeze({active: 'production', testNetworkEnabled, productionEnabled})
  }
  throw new Error(`Unsupported private portal environment: ${requested}`)
}
