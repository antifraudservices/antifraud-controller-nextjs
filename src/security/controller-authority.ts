export const CONTROLLER_CAPABILITIES = Object.freeze([
  'organization.read',
  'organization.update',
  'members.read',
  'members.invite',
  'members.suspend',
  'services.read',
  'services.configure',
  'devices.read',
  'devices.revoke',
  'audit.read',
] as const)

export type ControllerCapability = typeof CONTROLLER_CAPABILITIES[number]

export type ControllerEvidence = Readonly<{
  verified: boolean
  subject: string
  organizationId: string
  capabilities: readonly string[]
}>

export type ControllerAccess = Readonly<{
  authenticated: boolean
  subject?: string
  organizationId?: string
  capabilities: readonly ControllerCapability[]
}>

const capabilitySet = new Set<string>(CONTROLLER_CAPABILITIES)

export function resolveControllerAccess(evidence: ControllerEvidence | undefined): ControllerAccess {
  if (!evidence?.verified || !evidence.subject.trim() || !evidence.organizationId.trim()) {
    return Object.freeze({ authenticated: false, capabilities: [] })
  }

  const capabilities = [...new Set(evidence.capabilities)]
    .filter((capability): capability is ControllerCapability => capabilitySet.has(capability))

  return Object.freeze({
    authenticated: true,
    subject: evidence.subject,
    organizationId: evidence.organizationId,
    capabilities: Object.freeze(capabilities),
  })
}
