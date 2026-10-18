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
})
