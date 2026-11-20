import type { ControllerWorkspace } from 'antifraud-sdk-node-ts'
import type { ControllerFeature, ControllerFeatureStatus, ControllerFeatureStatuses } from '../config/controller-features'

export class ControllerGatewayFailure extends Error {
  constructor(readonly status: number) {
    super('The connected gateway did not complete the request.')
  }
}

export function controllerFeatures(
  workspace: Partial<ControllerWorkspace> | undefined,
  disabled: readonly ControllerFeature[],
  workspaceFailure: ControllerFeatureStatus = 'unavailable',
): ControllerFeatureStatuses {
  function availability(feature: ControllerFeature, supported: boolean): ControllerFeatureStatus {
    if (disabled.includes(feature)) return 'unsupported'
    if (!workspace) return workspaceFailure
    return supported ? 'available' : 'unsupported'
  }

  return {
    organization: availability('organization', Boolean(workspace?.organization?.reference)),
    workforce: availability('workforce', Boolean(workspace?.licences) && Array.isArray(workspace?.employees) && Array.isArray(workspace?.invitations)),
    departments: availability('departments', Array.isArray(workspace?.departments)),
    groups: availability('groups', Array.isArray(workspace?.groups)),
    'identity-evidence': availability('identity-evidence', Array.isArray(workspace?.employees)),
    'qualification-evidence': availability('qualification-evidence', Array.isArray(workspace?.employees)),
    'clearing-house': disabled.includes('clearing-house') ? 'unsupported' : 'available',
  }
}

export function controllerWorkspaceResult(
  workspace: ControllerWorkspace | undefined,
  disabled: readonly ControllerFeature[],
  failure?: ControllerFeatureStatus,
) {
  const features = controllerFeatures(workspace, disabled, failure)
  return { features, workspace }
}
