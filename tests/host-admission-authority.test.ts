// Flow contract: a verified Firebase phone session may administer admission policy only through an exact server-owned host controller assignment.
import { describe, expect, it, vi } from 'vitest'
import { authorizeHostAdmissionController } from '../src/security/host-admission-authority'

const assignment = {
  uid: 'assigned-user',
  phoneNumber: '+12025550100',
  hostDid: 'did:web:host.example',
  network: 'test-network',
  sector: 'animal-tech',
} as const
const decoded = {
  uid: assignment.uid,
  phone_number: assignment.phoneNumber,
  firebase: { sign_in_provider: 'phone' },
}
const scope = {
  hostDid: assignment.hostDid,
  network: assignment.network,
  sector: assignment.sector,
}

describe('host admission authority', () => {
  it('returns the subject for the exact verified phone and assignment', async () => {
    const verify = vi.fn().mockResolvedValue(decoded)
    await expect(authorizeHostAdmissionController('Bearer firebase-session', scope, [assignment], verify)).resolves.toEqual({ uid: assignment.uid })
    expect(verify).toHaveBeenCalledExactlyOnceWith('firebase-session')
  })

  it('denies missing, invalid and unverified phone sessions', async () => {
    const verify = vi.fn().mockResolvedValue(decoded)
    await expect(authorizeHostAdmissionController('', scope, [assignment], verify)).resolves.toBeUndefined()
    expect(verify).not.toHaveBeenCalled()
    await expect(authorizeHostAdmissionController('Bearer invalid', scope, [assignment], vi.fn().mockRejectedValue(new Error('invalid')))).resolves.toBeUndefined()
    await expect(authorizeHostAdmissionController('Bearer session', scope, [assignment], vi.fn().mockResolvedValue({
      ...decoded,
      firebase: { sign_in_provider: 'custom' },
    }))).resolves.toBeUndefined()
  })

  it('denies a different UID, phone or authority scope', async () => {
    for (const claims of [{ ...decoded, uid: 'other-user' }, { ...decoded, phone_number: '+12025550101' }]) {
      await expect(authorizeHostAdmissionController('Bearer session', scope, [assignment], vi.fn().mockResolvedValue(claims))).resolves.toBeUndefined()
    }
    for (const target of [
      { ...scope, hostDid: 'did:web:other.example' },
      { ...scope, network: 'network' },
      { ...scope, sector: 'health-tech' },
    ]) {
      await expect(authorizeHostAdmissionController('Bearer session', target, [assignment], vi.fn().mockResolvedValue(decoded))).resolves.toBeUndefined()
    }
  })

  it('requires a separate exact jurisdiction grant to review an admission', async () => {
    const verify = vi.fn().mockResolvedValue(decoded)
    const reviewer = { ...assignment, reviewJurisdictions: ['ES-MD'] }
    await expect(authorizeHostAdmissionController('Bearer session', scope, [assignment], verify, 'ES-MD')).resolves.toBeUndefined()
    await expect(authorizeHostAdmissionController('Bearer session', scope, [reviewer], verify, 'ES-CL')).resolves.toBeUndefined()
    await expect(authorizeHostAdmissionController('Bearer session', scope, [reviewer], verify, 'ES-MD')).resolves.toEqual({ uid: assignment.uid })
  })

  it('lets a reviewer decide within their grant without letting them edit the admission policy', async () => {
    const verify = vi.fn().mockResolvedValue(decoded)
    const reviewerOnly = { ...assignment, reviewJurisdictions: ['ES-MD'], managePolicy: false }
    await expect(authorizeHostAdmissionController('Bearer session', scope, [reviewerOnly], verify)).resolves.toBeUndefined()
    await expect(authorizeHostAdmissionController('Bearer session', scope, [reviewerOnly], verify, 'ES-MD')).resolves.toEqual({ uid: assignment.uid })
  })
})
