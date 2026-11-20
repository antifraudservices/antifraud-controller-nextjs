import type { ControllerFeature } from '../config/controller-features'
import type { AntifraudGatewayClient, ControllerWorkspace } from 'antifraud-sdk-node-ts'
import { controllerFeatures } from './controller-gateway-capabilities'
import { resolveGroupTemplateCapabilities, type OrganizationGroupTemplate } from './organization-group-policy'

export type ControllerAction =
  | Readonly<{ type: 'create-department'; name: string }>
  | Readonly<{ type: 'create-group'; name: string; template: OrganizationGroupTemplate }>
  | Readonly<{ type: 'create-invitation'; email: string; role: string; groupReferences: readonly string[]; departmentReferences: readonly string[] }>
  | Readonly<{ type: 'accept-invitation'; invitationReference: string; deviceReference: string }>
  | Readonly<{ type: 'set-status'; employeeReference: string; status: 'active' | 'inactive' }>
  | Readonly<{ type: 'set-memberships'; membershipKind?: 'group' | 'department'; employeeReference: string; groupReferences: readonly string[]; departmentReferences: readonly string[] }>
  | Readonly<{ type: 'purge-employee'; employeeReference: string }>

type ControllerClient = Pick<AntifraudGatewayClient,
  | 'readControllerWorkspace'
  | 'createControllerDepartment'
  | 'createControllerGroup'
  | 'createControllerInvitation'
  | 'acceptControllerInvitation'
  | 'setControllerEmployeeStatus'
  | 'setControllerEmployeeMemberships'
  | 'purgeControllerEmployee'>

export async function executeControllerAction(client: ControllerClient, action: ControllerAction, policy: Readonly<{
  disabledFeatures?: readonly ControllerFeature[]
  allowedEmployeeRoles?: readonly string[]
  allowedGroupTemplates?: readonly OrganizationGroupTemplate[]
}> = {}): Promise<ControllerWorkspace> {
  function requireFeature(feature: ControllerFeature) {
    if (policy.disabledFeatures?.includes(feature)) throw new Error('controller_feature_unsupported')
  }
  if (Object.hasOwn(action, 'organizationReference')) throw new Error('Browser-owned organization authority is not accepted.')
  switch (action.type) {
    case 'create-department': requireFeature('departments'); await client.createControllerDepartment({ name: action.name }); break
    case 'create-group': {
      requireFeature('groups')
      if (Object.hasOwn(action, 'capabilities')) throw new Error('group_template_not_allowed')
      const allowed = policy.allowedGroupTemplates ?? ['identity-evidence-administration', 'qualification-evidence-administration', 'clearing-house-review', 'places-management', 'public-services-management', 'custom']
      if (!allowed.includes(action.template)) throw new Error('group_template_not_allowed')
      const workspace = await client.readControllerWorkspace()
      await client.createControllerGroup({
        name: action.name,
        capabilities: resolveGroupTemplateCapabilities(action.template, workspace.organization.reference),
      })
      break
    }
    case 'create-invitation': {
      requireFeature('workforce')
      if (action.groupReferences.length) requireFeature('groups')
      if (action.departmentReferences.length) requireFeature('departments')
      const allowed = policy.allowedEmployeeRoles ?? ['organization-manager', 'evidence-reviewer', 'audit-viewer']
      if (!allowed.includes(action.role)) throw new Error('employee_role_not_allowed')
      await client.createControllerInvitation({
      email: action.email, role: action.role, groupReferences: action.groupReferences, departmentReferences: action.departmentReferences,
      }); break
    }
    case 'accept-invitation': requireFeature('workforce'); await client.acceptControllerInvitation(action.invitationReference, { deviceReference: action.deviceReference }); break
    case 'set-status': requireFeature('workforce'); await client.setControllerEmployeeStatus(action.employeeReference, action.status); break
    case 'set-memberships': {
      const current = await client.readControllerWorkspace()
      const features = controllerFeatures(current, policy.disabledFeatures ?? [])
      const groupsAvailable = features.groups === 'available'
      const departmentsAvailable = features.departments === 'available'
      if ((!groupsAvailable && !departmentsAvailable)
        || (action.membershipKind === 'group' && !groupsAvailable)
        || (action.membershipKind === 'department' && !departmentsAvailable)) {
        throw new Error('controller_feature_unsupported')
      }
      const employee = current.employees?.find(item => item.reference === action.employeeReference)
      const groupReferences = !groupsAvailable || action.membershipKind === 'department' ? employee?.groupReferences : action.groupReferences
      const departmentReferences = !departmentsAvailable || action.membershipKind === 'group' ? employee?.departmentReferences : action.departmentReferences
      if (!Array.isArray(groupReferences) || !Array.isArray(departmentReferences)) throw new Error('controller_memberships_unavailable')
      await client.setControllerEmployeeMemberships(action.employeeReference, { groupReferences, departmentReferences })
      break
    }
    case 'purge-employee': requireFeature('workforce'); await client.purgeControllerEmployee(action.employeeReference); break
    default: throw new Error('controller_action_not_allowed')
  }
  return client.readControllerWorkspace()
}
