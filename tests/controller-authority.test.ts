// Flow contract: verified server evidence grants only explicit organization-controller capabilities and never unrelated data authority.
import { describe, expect, it } from 'vitest'
import { resolveControllerAccess } from '../src/security/controller-authority'
import { localDemoAccess } from '../src/security/demo-access'

describe('controller authority boundary', () => {
  it('fails closed without verified server evidence', () => {
    expect(resolveControllerAccess(undefined)).toEqual({ authenticated: false, capabilities: [] })
  })

  it('keeps only explicit administrative capabilities', () => {
    expect(resolveControllerAccess({
      verified: true,
      subject: 'did:web:controller.example',
      organizationId: 'Organization/example',
      capabilities: ['organization.read', 'members.read', 'members.invite', 'unrelated.read', 'unrelated.write'],
    })).toEqual({
      authenticated: true,
      subject: 'did:web:controller.example',
      organizationId: 'Organization/example',
      capabilities: ['organization.read', 'members.read', 'members.invite'],
    })
  })

  it('rejects verified evidence without an exact organization binding', () => {
    expect(resolveControllerAccess({ verified: true, subject: 'did:web:controller.example', organizationId: '', capabilities: [] }))
      .toEqual({ authenticated: false, capabilities: [] })
  })

  it('enables synthetic demo evidence only in development or an explicit Beta/staging Demo', () => {
    expect(localDemoAccess({ NODE_ENV: 'production', CONTROLLER_DEPLOYMENT_STAGE: 'network', CONTROLLER_DEMO_MODE: 'true' }))
      .toEqual({ authenticated: false, capabilities: [] })
    expect(localDemoAccess({ NODE_ENV: 'development', CONTROLLER_DEMO_MODE: 'true' }).authenticated)
      .toBe(true)
    expect(localDemoAccess({
      NODE_ENV: 'production', CONTROLLER_DEPLOYMENT_STAGE: 'staging', CONTROLLER_DEMO_MODE: 'true',
    }).authenticated).toBe(true)
    expect(localDemoAccess({
      NODE_ENV: 'production', CONTROLLER_DEPLOYMENT_STAGE: 'beta', CONTROLLER_DEMO_MODE: 'true',
    }).authenticated).toBe(true)
  })
})
