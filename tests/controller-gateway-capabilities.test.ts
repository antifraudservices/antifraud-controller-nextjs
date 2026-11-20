// Flow contract: a controller membership update preserves the unedited assignments.
import { describe, expect, it, vi } from 'vitest'
import { executeControllerAction } from '../src/server/controller-administration'

describe('gateway capabilities', () => {
  it('rejects a membership request that does not name exactly one supported kind', async () => {
    const client = { setControllerEmployeeMemberships: vi.fn(), readControllerResource: vi.fn() }
    await expect(executeControllerAction(client as never, { type: 'set-memberships', membershipKind: 'both' } as never))
      .rejects.toThrow('controller_membership_kind_required')
    expect(client.readControllerResource).not.toHaveBeenCalled()
  })

  it('blocks disabled operations and preserves existing group assignments during a department update', async () => {
    const client = {
      readControllerResource: vi.fn().mockResolvedValue([{ reference: 'employee:one', groupReferences: ['group:existing'], departmentReferences: [] }]),
      createControllerGroup: vi.fn(),
      setControllerEmployeeMemberships: vi.fn(),
    } as unknown as Parameters<typeof executeControllerAction>[0]
    const policy = { disabledFeatures: ['groups'] as const }
    await expect(executeControllerAction(client, { type: 'create-group', name: 'Admin', template: 'custom' }, policy)).rejects.toThrow('controller_feature_unsupported')
    expect(client.createControllerGroup).not.toHaveBeenCalled()
    await executeControllerAction(client, {
      type: 'set-memberships', membershipKind: 'department', employeeReference: 'employee:one', groupReferences: [],
      departmentReferences: ['department:one'],
    }, policy)
    expect(client.setControllerEmployeeMemberships).toHaveBeenCalledWith('employee:one', {
      groupReferences: ['group:existing'], departmentReferences: ['department:one'],
    })
  })
})
