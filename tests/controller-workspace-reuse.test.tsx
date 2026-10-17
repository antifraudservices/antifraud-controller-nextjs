// Flow contract: the public sector-neutral controller portal exposes only controller-owned organization, group and department administration and never opens qualification-sector subject or evidence records.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ControllerWorkspace } from '../src/components/ControllerWorkspace'

describe('shared controller workspace', () => {
  it('keeps only controller-owned destinations and shared component provenance', () => {
    const html = renderToStaticMarkup(<ControllerWorkspace
      portalName="Antifraud Controller"
      organizationName="Example Organization"
    />)

    expect(html).toContain('Organization information')
    expect(html).toContain('Members and devices')
    expect(html).toContain('Groups and departments')
    expect(html).toContain('data-reuse-source="antifraud-portal-components-react@0.1.0-local"')
    expect(html).not.toContain('Availability and appointments')
    expect(html).not.toMatch(/Schedule availability|Manage appointments/u)
    expect(html).not.toMatch(/Student records|Patient records|Animal records|Clinical records/u)
  })
})
