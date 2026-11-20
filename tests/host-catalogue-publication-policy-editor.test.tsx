// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { HostCataloguePublicationPolicyEditor } from '../src/components/HostCataloguePublicationPolicyEditor'

const sector = 'research'
const token = 'host-controller-session'
const hostOnly = { allowTenantPublication: false, revision: 0 }

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

it('loads the host-only policy and persists a controller-approved setting for the selected sector', async () => {
  const fetchPolicy = vi.fn()
    .mockResolvedValueOnce(Response.json(hostOnly))
    .mockResolvedValueOnce(Response.json({ allowTenantPublication: true, revision: 1 }))
  vi.stubGlobal('fetch', fetchPolicy)
  render(<HostCataloguePublicationPolicyEditor sector={sector} getToken={async () => token}/>)
  const allowed = await screen.findByRole('checkbox', { name: 'Allow tenants to publish with their own wallets' })
  expect(allowed).not.toBeChecked()
  const user = userEvent.setup()
  await user.click(allowed)
  await user.click(screen.getByRole('button', { name: 'Save publication policy' }))
  expect(await screen.findByText('Publication policy revision 1')).toBeInTheDocument()
  const [url, request] = fetchPolicy.mock.calls[1]
  expect(new URL(url, location.origin).searchParams.get('sector')).toBe(sector)
  expect(request.headers.authorization).toBe(`Bearer ${token}`)
  expect(JSON.parse(request.body)).toEqual({ ...hostOnly, allowTenantPublication: true })
})
