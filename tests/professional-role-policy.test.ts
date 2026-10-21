// Flow contract: an antifraud-tech hostname may expose canonical synthetic professional roles for portal testing, while the trusted BFF rejects browser-invented roles and ordinary organization administration retains only its reviewed administrative roles.
import { describe, expect, it } from 'vitest'
import { allowedEmployeeRoleOptions, requireAllowedEmployeeRole } from '../src/server/professional-role-policy'

describe('trusted professional role policy', () => {
  it('adds canonical cross-sector test personas only for antifraud-tech', () => {
    const roles = allowedEmployeeRoleOptions(['antifraud-tech'])
    expect(roles).toEqual(expect.arrayContaining([
      expect.objectContaining({ value: 'doctor', syntheticOnly: true }),
      expect.objectContaining({ value: 'nurse', syntheticOnly: true }),
      expect.objectContaining({ value: 'veterinarian', syntheticOnly: true }),
      expect.objectContaining({ value: 'police_officer', syntheticOnly: true }),
      expect.objectContaining({ value: 'lifeguard', syntheticOnly: true }),
      expect.objectContaining({ value: 'administrative-assistant', syntheticOnly: true }),
    ]))
    expect(allowedEmployeeRoleOptions(['education'])).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ value: 'doctor' }),
    ]))
  })

  it('rejects a role outside the server-resolved catalog before the gateway call', () => {
    expect(() => requireAllowedEmployeeRole('invented-role', ['antifraud-tech'])).toThrow('employee_role_not_allowed')
    expect(requireAllowedEmployeeRole('doctor', ['antifraud-tech'])).toBe('doctor')
  })
})
