export const CONTROLLER_FEATURES = [
  'organization', 'workforce', 'departments', 'groups',
  'identity-evidence', 'qualification-evidence', 'clearing-house',
] as const

export type ControllerFeature = typeof CONTROLLER_FEATURES[number]
export type ControllerFeatureStatus = 'available' | 'unsupported' | 'forbidden' | 'unavailable'
export type ControllerFeatureStatuses = Readonly<Record<ControllerFeature, ControllerFeatureStatus>>

export function controllerFeatureMessage(status: ControllerFeatureStatus | undefined): string {
  switch (status) {
    case 'unsupported': return 'This feature is not available on the connected gateway.'
    case 'forbidden': return 'Your controller session does not have access to this feature.'
    case 'unavailable': return 'This feature is temporarily unavailable. Try again.'
    default: return 'Checking availability…'
  }
}

export function controllerGatewayFailureStatus(status: number): ControllerFeatureStatus {
  if (status === 401 || status === 403) return 'forbidden'
  if (status === 404 || status === 405 || status === 501) return 'unsupported'
  return 'unavailable'
}
