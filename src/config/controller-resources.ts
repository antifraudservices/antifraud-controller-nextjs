import type { ControllerResources } from 'antifraud-sdk-node-ts'
import { controllerGatewayFailureStatus, type ControllerFeature, type ControllerFeatureStatus } from './controller-features'

export const CONTROLLER_RESOURCES = {
  organization: ['organization'],
  employees: ['workforce', 'identity-evidence', 'qualification-evidence'],
  licences: ['workforce'],
  devices: ['workforce'],
  invitations: ['workforce'],
  departments: ['departments'],
  groups: ['groups'],
  notifications: ['organization'],
} as const satisfies Record<keyof ControllerResources, readonly ControllerFeature[]>

export type ControllerResource = keyof typeof CONTROLLER_RESOURCES
export type ControllerResourceResults = {
  data: Partial<ControllerResources>
  status: Partial<Record<ControllerResource, ControllerFeatureStatus>>
}

export async function readControllerResources(
  resources: readonly ControllerResource[],
  disabled: readonly ControllerFeature[],
  request: (url: string, init: RequestInit) => Promise<Response> = fetch,
  employeeFilters: Readonly<{ email?: string; role?: string }> = {},
): Promise<ControllerResourceResults> {
  const result: ControllerResourceResults = { data: {}, status: {} }
  async function load<T extends ControllerResource>(resource: T) {
    if (CONTROLLER_RESOURCES[resource].every(feature => disabled.includes(feature))) {
      result.status[resource] = 'unsupported'
      return
    }
    const query = new URLSearchParams()
    if (resource === 'employees') {
      if (employeeFilters.email) query.set('email', employeeFilters.email)
      if (employeeFilters.role) query.set('role', employeeFilters.role)
    }
    try {
      const response = await request(`/api/controller/${resource}${query.size ? `?${query}` : ''}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(20_000),
      })
      if (!response.ok) {
        result.status[resource] = controllerGatewayFailureStatus(response.status)
        return
      }
      result.data[resource] = await response.json() as ControllerResources[T]
      result.status[resource] = 'available'
    } catch {
      result.status[resource] = 'unavailable'
    }
  }
  await Promise.all(resources.map(load))
  return result
}
