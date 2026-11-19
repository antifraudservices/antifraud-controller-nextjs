// Flow contract: the controller reads the server policy, explicitly saves a country selection and evidence checks, and can return the same sector to review.
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { HostAdmissionPolicyEditor } from '../src/components/HostAdmissionPolicyEditor'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

it('saves one country and a condition with the current revision, then restores review', async () => {
  const available = { allowedCountries: ['CA', 'ES'] }
  const automatic = {
    mode: 'automatic-after-verification', countries: { kind: 'selected', codes: ['ES'] },
    conditions: ['signed-application-template'],
  }
  const fetch = vi.fn()
    .mockResolvedValueOnce(Response.json({ ...available, mode: 'review', revision: 2 }))
    .mockResolvedValueOnce(Response.json({ ...available, ...automatic, revision: 3 }))
    .mockResolvedValueOnce(Response.json({ ...available, mode: 'review', revision: 4 }))
  vi.stubGlobal('fetch', fetch)
  render(<HostAdmissionPolicyEditor sectors={['animal-tech']} getToken={async () => 'signed-session'}/>)

  await screen.findByText('Policy revision 2')
  fireEvent.change(screen.getByLabelText('Approval'), { target: { value: 'automatic-after-verification' } })
  fireEvent.click(screen.getByLabelText('Spain'))
  fireEvent.click(screen.getByLabelText('Valid application template and digital certificate signature'))
  fireEvent.click(screen.getByRole('button', { name: 'Save policy' }))
  await screen.findByText('Policy revision 3')
  expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({ ...automatic, revision: 2 })
  expect(fetch.mock.calls[1][1].headers.authorization).toBe('Bearer signed-session')

  fireEvent.change(screen.getByLabelText('Approval'), { target: { value: 'review' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save policy' }))
  await waitFor(() => expect(JSON.parse(fetch.mock.calls[2][1].body)).toEqual({ mode: 'review', revision: 3 }))
  expect(await screen.findByText('Policy revision 4')).toBeVisible()
})


it('offers only manual review for care even when there is an old conditional rule', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({
    mode: 'automatic-after-verification', revision: 5,
    allowedCountries: ['ES'], countries: { kind: 'all' }, conditions: ['signed-application-template'],
  })))
  render(<HostAdmissionPolicyEditor sectors={['animal-care']} getToken={async () => 'signed-session'}/>)
  await screen.findByText('Policy revision 5')
  expect(screen.queryByRole('option', { name: 'Approve after verification' })).not.toBeInTheDocument()
  expect(screen.getByLabelText('Approval')).toHaveValue('review')
})
