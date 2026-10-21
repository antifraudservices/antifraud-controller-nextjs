// Flow contract: every controller hostname presents Demo, Test Network and Production before authentication or workspace loading; continuing enters only the environment selected by trusted server configuration, so browser interaction grants no environment authority.
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ControllerEnvironmentEntry } from '../src/components/ControllerEnvironmentEntry'

describe('controller environment entry gate', () => {
  it('uses the same shared portal entry components and real environment routes as the other portals', () => {
    render(<ControllerEnvironmentEntry
      config={{ kind: 'organization-controller', hostname: 'localhost', name: 'Antifraud Controller', logoUrl: '/antifraud-mark.svg', accentColor: '#075f68', supportUrl: 'https://example.invalid', modules: ['organization'] }}
      environment={{ active: 'demo', testNetworkEnabled: false, productionEnabled: false }}
    />)

    expect(screen.getByRole('heading', { name: 'Choose an environment' })).toBeVisible()
    expect(screen.getByText('Demo — simulated blockchain')).toBeVisible()
    expect(screen.getByText('Test Network')).toBeVisible()
    expect(screen.getByText('Production')).toBeVisible()
    expect(screen.getByRole('link', { name: /Demo/u })).toHaveAttribute('href', '/demo')
    expect(screen.getByRole('link', { name: /Test Network/u })).toHaveAttribute('href', '/test-network')
    expect(screen.getByRole('link', { name: /Production/u })).toHaveAttribute('href', '/production')
  })
})
