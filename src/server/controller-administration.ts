import type { AntifraudGatewayClient, ControllerWorkspace } from 'antifraud-sdk-node-ts'

export type ControllerAction =
  | Readonly<{ type: 'create-department'; name: string }>
  | Readonly<{ type: 'create-group'; name: string; capabilities: readonly string[] }>
  | Readonly<{ type: 'create-invitation'; email: string; role: string; groupReferences: readonly string[]; departmentReferences: readonly string[] }>
  | Readonly<{ type: 'accept-invitation'; invitationReference: string; deviceReference: string }>
  | Readonly<{ type: 'set-status'; employeeReference: string; status: 'active' | 'inactive' }>
  | Readonly<{ type: 'set-memberships'; employeeReference: string; groupReferences: readonly string[]; departmentReferences: readonly string[] }>
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

export async function executeControllerAction(client: ControllerClient, action: ControllerAction): Promise<ControllerWorkspace> {
  if (Object.hasOwn(action, 'organizationReference')) throw new Error('Browser-owned organization authority is not accepted.')
  switch (action.type) {
    case 'create-department': await client.createControllerDepartment({ name: action.name }); break
    case 'create-group': await client.createControllerGroup({ name: action.name, capabilities: action.capabilities }); break
    case 'create-invitation': await client.createControllerInvitation({
      email: action.email, role: action.role, groupReferences: action.groupReferences, departmentReferences: action.departmentReferences,
    }); break
    case 'accept-invitation': await client.acceptControllerInvitation(action.invitationReference, { deviceReference: action.deviceReference }); break
    case 'set-status': await client.setControllerEmployeeStatus(action.employeeReference, action.status); break
    case 'set-memberships': await client.setControllerEmployeeMemberships(action.employeeReference, {
      groupReferences: action.groupReferences, departmentReferences: action.departmentReferences,
    }); break
    case 'purge-employee': await client.purgeControllerEmployee(action.employeeReference); break
  }
  return client.readControllerWorkspace()
}
