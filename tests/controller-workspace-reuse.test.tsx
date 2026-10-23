// Flow contract: the public controller portal exposes organization, workforce and evidence administration, including employee identity evidence, age-over predicates and employer-reviewed qualification evidence. It never grants authority from browser state.
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
    expect(html).toContain('Departments')
    expect(html).toContain('Employee groups')
    expect(html).not.toContain('Manage Schema.org Places')
    expect(html).not.toContain('Manage offered Schema.org Services')
    expect(html).not.toContain('Groups and departments')
    expect(html).toContain('Identity and qualification evidence')
    expect(html).not.toContain('Demo — simulated blockchain')
    expect(html).toContain('data-reuse-source="antifraud-hosting-components-react@1"')
  })

  it('renders only modules enabled by the server-resolved hostname manifest', () => {
    const html = renderToStaticMarkup(<ControllerWorkspace
      portalName="Education Controller"
      organizationName="Example Organization"
      modules={['organization', 'workforce']}
    />)

    expect(html).toContain('Organization information')
    expect(html).toContain('Members and devices')
    expect(html).not.toContain('Identity and qualification evidence')
    expect(html).not.toContain('Clearing House')
  })
})
