// Flow contract: an authenticated workspace exposes each installed ability independently and keeps hidden memberships authoritative through updates.
import { describe, expect, it, vi } from 'vitest'
import type { ControllerWorkspace } from 'antifraud-sdk-node-ts'
import { controllerGatewayFailureStatus } from '../src/config/controller-features'
import { controllerFeatures } from '../src/server/controller-gateway-capabilities'
import { executeControllerAction } from '../src/server/controller-administration'

const workspace = {
  organization: { reference: 'Organization/example' },
  licences: { total: 1, assigned: 1, free: 0 },
  employees: [{ reference: 'employee:one', groupReferences: ['group:existing'], departmentReferences: [] }],
  invitations: [],
  groups: [],
  departments: [],
} as unknown as ControllerWorkspace

describe('gateway capabilities', () => {
  it('keeps departments and workforce operable with groups disabled', () => {
    expect(controllerFeatures(workspace, ['groups', 'qualification-evidence'])).toMatchObject({
      organization: 'available', workforce: 'available', departments: 'available',
      groups: 'unsupported', 'identity-evidence': 'available', 'qualification-evidence': 'unsupported',
    })
  })

  it('treats an omitted resource as unsupported and an empty collection as available', () => {
    expect(controllerFeatures({ ...workspace, groups: undefined }, [])).toMatchObject({
      groups: 'unsupported', departments: 'available',
    })
  })

  it('distinguishes exact HTTP failures', () => {
    expect([401, 403, 404, 405, 429, 503].map(controllerGatewayFailureStatus)).toEqual([
      'forbidden', 'forbidden', 'unsupported', 'unsupported', 'unavailable', 'unavailable',
    ])
  })

  it('keeps the independent Clearing House reachable when a gateway has no workspace contract', () => {
    expect(controllerFeatures(undefined, [], 'unsupported')).toMatchObject({
      organization: 'unsupported', groups: 'unsupported', 'clearing-house': 'available',
    })
    expect(controllerFeatures(undefined, ['clearing-house'], 'forbidden')).toMatchObject({
      organization: 'forbidden', groups: 'forbidden', 'clearing-house': 'unsupported',
    })
  })

  it('blocks disabled operations and preserves existing group assignments during a department update', async () => {
    const client = {
      readControllerWorkspace: vi.fn().mockResolvedValue(workspace),
      createControllerGroup: vi.fn(),
      setControllerEmployeeMemberships: vi.fn(),
    } as unknown as Parameters<typeof executeControllerAction>[0]
    const policy = { disabledFeatures: ['groups'] as const }
    await expect(executeControllerAction(client, { type: 'create-group', name: 'Admin', template: 'custom' }, policy)).rejects.toThrow('controller_feature_unsupported')
    expect(client.createControllerGroup).not.toHaveBeenCalled()
    await executeControllerAction(client, {
      type: 'set-memberships', employeeReference: 'employee:one', groupReferences: [],
      departmentReferences: ['department:one'],
    }, policy)
    expect(client.setControllerEmployeeMemberships).toHaveBeenCalledWith('employee:one', {
      groupReferences: ['group:existing'], departmentReferences: ['department:one'],
    })
  })
})
