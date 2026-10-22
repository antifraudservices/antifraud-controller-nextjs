import type { AntifraudGatewayClient, ControllerWorkspace } from 'antifraud-sdk-node-ts'
import { resolveGroupTemplateCapabilities, type OrganizationGroupTemplate } from './organization-group-policy'

export type ControllerAction =
  | Readonly<{ type: 'create-department'; name: string }>
  | Readonly<{
    type: 'create-place'
    name: string
    departmentReference: string
    containedInPlaceReference?: string
    geo?: Readonly<{ latitude: number; longitude: number; elevation?: number }>
  }>
  | Readonly<{
    type: 'create-client-service'
    name: string
    description?: string
    serviceType: string
    departmentReference: string
    placeReferences: readonly string[]
  }>
  | Readonly<{ type: 'set-place-catalog-publication'; placeReference: string; publishInCatalog: boolean }>
  | Readonly<{ type: 'set-client-service-catalog-publication'; serviceReference: string; publishInCatalog: boolean }>
  | Readonly<{ type: 'create-group'; name: string; template: OrganizationGroupTemplate }>
  | Readonly<{ type: 'create-invitation'; email: string; role: string; groupReferences: readonly string[]; departmentReferences: readonly string[] }>
  | Readonly<{ type: 'accept-invitation'; invitationReference: string; deviceReference: string }>
  | Readonly<{ type: 'set-status'; employeeReference: string; status: 'active' | 'inactive' }>
  | Readonly<{ type: 'set-memberships'; employeeReference: string; groupReferences: readonly string[]; departmentReferences: readonly string[] }>
  | Readonly<{ type: 'purge-employee'; employeeReference: string }>

type ControllerClient = Pick<AntifraudGatewayClient,
  | 'readControllerWorkspace'
  | 'createControllerDepartment'
  | 'createControllerPlace'
  | 'createControllerClientService'
  | 'setControllerPlaceCatalogPublication'
  | 'setControllerClientServiceCatalogPublication'
  | 'createControllerGroup'
  | 'createControllerInvitation'
  | 'acceptControllerInvitation'
  | 'setControllerEmployeeStatus'
  | 'setControllerEmployeeMemberships'
  | 'purgeControllerEmployee'>

export async function executeControllerAction(client: ControllerClient, action: ControllerAction, policy: Readonly<{
  allowedEmployeeRoles?: readonly string[]
  allowedGroupTemplates?: readonly OrganizationGroupTemplate[]
}> = {}): Promise<ControllerWorkspace> {
  if (Object.hasOwn(action, 'organizationReference')) throw new Error('Browser-owned organization authority is not accepted.')
  switch (action.type) {
    case 'create-department': await client.createControllerDepartment({ name: action.name }); break
    case 'create-place': await client.createControllerPlace({
      name: action.name,
      departmentReference: action.departmentReference,
      ...(action.containedInPlaceReference ? { containedInPlaceReference: action.containedInPlaceReference } : {}),
      ...(action.geo ? { geo: action.geo } : {}),
    }); break
    case 'create-client-service': await client.createControllerClientService({
      name: action.name,
      ...(action.description ? { description: action.description } : {}),
      serviceType: action.serviceType,
      departmentReference: action.departmentReference,
      placeReferences: action.placeReferences,
    }); break
    case 'set-place-catalog-publication': await client.setControllerPlaceCatalogPublication(
      action.placeReference, action.publishInCatalog,
    ); break
    case 'set-client-service-catalog-publication': await client.setControllerClientServiceCatalogPublication(
      action.serviceReference, action.publishInCatalog,
    ); break
    case 'create-group': {
      if (Object.hasOwn(action, 'capabilities')) throw new Error('group_template_not_allowed')
      const allowed = policy.allowedGroupTemplates ?? ['identity-evidence-administration', 'qualification-evidence-administration', 'clearing-house-review', 'custom']
      if (!allowed.includes(action.template)) throw new Error('group_template_not_allowed')
      const workspace = await client.readControllerWorkspace()
      await client.createControllerGroup({
        name: action.name,
        capabilities: resolveGroupTemplateCapabilities(action.template, workspace.organization.reference),
      })
      break
    }
    case 'create-invitation': {
      const allowed = policy.allowedEmployeeRoles ?? ['organization-manager', 'evidence-reviewer', 'audit-viewer']
      if (!allowed.includes(action.role)) throw new Error('employee_role_not_allowed')
      await client.createControllerInvitation({
      email: action.email, role: action.role, groupReferences: action.groupReferences, departmentReferences: action.departmentReferences,
      }); break
    }
    case 'accept-invitation': await client.acceptControllerInvitation(action.invitationReference, { deviceReference: action.deviceReference }); break
    case 'set-status': await client.setControllerEmployeeStatus(action.employeeReference, action.status); break
    case 'set-memberships': await client.setControllerEmployeeMemberships(action.employeeReference, {
      groupReferences: action.groupReferences, departmentReferences: action.departmentReferences,
    }); break
    case 'purge-employee': await client.purgeControllerEmployee(action.employeeReference); break
  }
  return client.readControllerWorkspace()
}
