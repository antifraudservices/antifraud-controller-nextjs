// Flow contract: a controller searches a governed qualification classification through its BFF, explicitly selects one canonical code, and changes UI language without changing or clearing that identity.
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { QualificationClassificationSelector } from '../src/components/QualificationClassificationSelector'

describe('QualificationClassificationSelector', () => {
  it('keeps the canonical selection while resolving its Spanish label', async () => {
    const onChange = vi.fn()
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(Response.json({ candidates: [{
        system: 'https://data.europa.eu/snb/education-level', version: 'demo-2026-10',
        code: 'synthetic-bachelor-001', label: 'Bachelor-level synthetic qualification',
        display: 'Bachelor-level synthetic qualification', language: 'en',
      }] }))
      .mockResolvedValueOnce(Response.json({ candidate: {
        system: 'https://data.europa.eu/snb/education-level', version: 'demo-2026-10',
        code: 'synthetic-bachelor-001', label: 'Cualificación sintética de nivel de grado',
        display: 'Bachelor-level synthetic qualification', language: 'es',
      } })))

    render(<QualificationClassificationSelector value={undefined} onChange={onChange} />)
    await userEvent.type(screen.getByLabelText('Qualification classification'), 'bachelor')
    await userEvent.click(screen.getByRole('button', { name: 'Search classifications' }))
    await userEvent.selectOptions(screen.getByLabelText('Select classification'),
      'https://data.europa.eu/snb/education-level|synthetic-bachelor-001')

    expect(onChange).toHaveBeenLastCalledWith({
      system: 'https://data.europa.eu/snb/education-level', version: 'demo-2026-10',
      code: 'synthetic-bachelor-001', display: 'Bachelor-level synthetic qualification',
    })
    onChange.mockClear()
    await userEvent.selectOptions(screen.getByLabelText('Interface language'), 'es')
    expect(await screen.findByText('Cualificación sintética de nivel de grado')).toBeVisible()
    expect(screen.getByLabelText('Canonical qualification code')).toHaveValue(
      'https://data.europa.eu/snb/education-level|synthetic-bachelor-001',
    )
    expect(onChange).not.toHaveBeenCalled()
  })
})
