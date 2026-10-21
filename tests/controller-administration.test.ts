// Flow contract: the controller backend-for-frontend delegates organization administration to the high-level SDK, never accepts browser-owned organization authority, and returns the refreshed authoritative workspace after every mutation.
import { describe, expect, it, vi } from 'vitest'
import { executeControllerAction } from '../src/server/controller-administration'

describe('controller administration BFF', () => {
  it('executes a mutation and reloads authoritative state', async () => {
    const client = {
      createControllerDepartment: vi.fn().mockResolvedValue({}),
      readControllerWorkspace: vi.fn().mockResolvedValue({ organization: { reference: 'organization:one' }, departments: [{ reference: 'department:one', name: 'Operations' }] }),
    }
    const result = await executeControllerAction(client as never, { type: 'create-department', name: 'Operations' })
    expect(client.createControllerDepartment).toHaveBeenCalledWith({ name: 'Operations' })
    expect(result.departments).toHaveLength(1)
  })

  it('rejects browser-owned organization authority', async () => {
    await expect(executeControllerAction({} as never, {
      type: 'create-department', name: 'Injected', organizationReference: 'organization:other',
    } as never)).rejects.toThrow(/organization authority/i)
  })

  it('rejects a browser-selected role outside trusted hostname policy', async () => {
    const client = { createControllerInvitation: vi.fn(), readControllerWorkspace: vi.fn() }
    await expect(executeControllerAction(client as never, {
      type: 'create-invitation', email: 'person@example.invalid', role: 'doctor', groupReferences: [], departmentReferences: [],
    }, { allowedEmployeeRoles: ['organization-manager'] })).rejects.toThrow('employee_role_not_allowed')
    expect(client.createControllerInvitation).not.toHaveBeenCalled()
  })

  it('resolves a reviewed group template in the BFF instead of accepting browser capabilities', async () => {
    const client = {
      createControllerGroup: vi.fn().mockResolvedValue({}),
      readControllerWorkspace: vi.fn().mockResolvedValue({ organization: { reference: 'Organization/example' } }),
    }
    await executeControllerAction(client as never, {
      type: 'create-group', name: 'Schedulers', template: 'scheduling-operations',
    } as never, { allowedEmployeeRoles: [], allowedGroupTemplates: ['scheduling-operations'] })
    expect(client.createControllerGroup).toHaveBeenCalledWith({
      name: 'Schedulers',
      capabilities: ['organization/Appointment.cruds', 'organization/Schedule.cruds', 'organization/Slot.cruds'],
    })
  })

  it('rejects caller-authored capabilities and templates outside hostname policy', async () => {
    const client = { createControllerGroup: vi.fn(), readControllerWorkspace: vi.fn() }
    await expect(executeControllerAction(client as never, {
      type: 'create-group', name: 'Injected', template: 'custom', capabilities: ['organization/Anything.*'],
    } as never, { allowedEmployeeRoles: [], allowedGroupTemplates: ['identity-evidence-administration'] })).rejects.toThrow('group_template_not_allowed')
    expect(client.createControllerGroup).not.toHaveBeenCalled()
  })
})
