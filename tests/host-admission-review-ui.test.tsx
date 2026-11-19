// Flow contract: a reviewer sees the scoped case and its verification checks, confirms a decision, and sends only the binding and the displayed revision.
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { HostAdmissionReview } from '../src/components/HostAdmissionReview'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

it('confirms an approval for the displayed case and removes it from the pending queue', async () => {
  const row = {
    binding: 'a'.repeat(64), decisionRevision: 3, decision: 'review', reference: 'urn:example:pending',
    evidence: { applicationId: 'case-1', reference: 'urn:example:ica', checks: ['legal-identifier-match', 'official-registry-active'] },
  }
  const fetch = vi.fn()
    .mockResolvedValueOnce(Response.json({ items: [row] }))
    .mockResolvedValueOnce(Response.json({ item: { ...row, reference: 'urn:example:approved', decision: 'approved' } }))
  vi.stubGlobal('fetch', fetch)
  render(<HostAdmissionReview sectors={['animal-care']} jurisdictions={['ES-MD']} getToken={async () => 'firebase-token'}/>)

  expect(await screen.findByText('case-1')).toBeVisible()
  expect(screen.getByText('Matching organization identifier')).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Approve' }))
  expect(fetch).toHaveBeenCalledTimes(1)
  fireEvent.click(screen.getByRole('button', { name: 'Confirm approval' }))
  expect(await screen.findByText('Decision recorded: urn:example:approved')).toBeVisible()
  expect(screen.queryByText('case-1')).not.toBeInTheDocument()
  expect(fetch.mock.calls[1][0]).toContain('sector=animal-care&jurisdiction=ES-MD')
  expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({ binding: row.binding, revision: 3, decision: 'approved' })
})

it('keeps a case with incomplete ICA evidence available for review without enabling approval', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ items: [{
    binding: 'b'.repeat(64), decisionRevision: 1, decision: 'review', reference: 'urn:example:pending', applicationId: 'case-awaiting-verification',
  }] })))
  render(<HostAdmissionReview sectors={['animal-care']} jurisdictions={['ES-MD']} getToken={async () => 'firebase-token'}/>)
  expect(await screen.findByRole('heading', { name: 'case-awaiting-verification' })).toBeVisible()
  expect(await screen.findByText('Verified ICA evidence is still required for approval.')).toBeVisible()
  expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Reject' })).toBeEnabled()
})


it('shows finalized decisions and the applied policy without approval controls', async () => {
  const fetch = vi.fn().mockResolvedValueOnce(Response.json({ items: [] })).mockResolvedValueOnce(Response.json({ items: [{
    binding: 'c'.repeat(64), applicationId: 'case-approved', reference: 'urn:example:approval',
    decision: 'approved', decisionRevision: 2, policyRevision: 3, source: 'policy',
    policySnapshot: {
      policy: { mode: 'automatic-after-verification', revision: 3, countries: { kind: 'all' }, conditions: ['signed-application-template'] },
      eligibleCountries: ['ES', 'CA'],
    },
  }] }))
  vi.stubGlobal('fetch', fetch)
  render(<HostAdmissionReview sectors={['health-tech']} jurisdictions={['ES-MD']} getToken={async () => 'firebase-token'}/>)
  await screen.findByText('No pending admissions on this page.')
  fireEvent.change(screen.getByRole('combobox', { name: 'Decision' }), { target: { value: 'approved' } })
  fireEvent.click(screen.getByRole('button', { name: 'Load cases' }))
  expect(await screen.findByRole('heading', { name: 'case-approved' })).toBeVisible()
  expect(screen.getByText('Policy revision 3')).toBeVisible()
  expect(screen.getByText('Approved automatically')).toBeVisible()
  fireEvent.click(screen.getByText('Policy applied'))
  expect(screen.getByText('Canada, Spain')).toBeVisible()
  expect(screen.getByText('Valid application template and digital certificate signature')).toBeVisible()
  expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeInTheDocument()
  expect(fetch.mock.calls[1][0]).toContain('decision=approved')
})
