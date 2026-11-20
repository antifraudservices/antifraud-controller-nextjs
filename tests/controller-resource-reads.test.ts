// Flow contract: a missing groups route leaves the separate organization and employee requests available.
import { describe, expect, it, vi } from 'vitest'
import { readControllerResources } from '../src/config/controller-resources'

describe('controller resource requests', () => {
  it('reads resources independently and skips configured unsupported routes', async () => {
    const request = vi.fn(async (url: string) => {
      if (url.endsWith('/departments')) return new Response(null, { status: 404 })
      return Response.json(url.endsWith('/organization') ? { reference: 'Organization/example' } : [])
    })
    const result = await readControllerResources(['organization', 'employees', 'departments', 'groups'], ['groups'], request)
    expect(result.status).toEqual({ organization: 'available', employees: 'available', departments: 'unsupported', groups: 'unsupported' })
    expect(result.data).toEqual({ organization: { reference: 'Organization/example' }, employees: [] })
    expect(request.mock.calls.map(([url]) => url)).toEqual(['/api/controller/organization', '/api/controller/employees', '/api/controller/departments'])
  })
})
