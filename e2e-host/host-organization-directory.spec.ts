// Flow contract: Journey 1 renders the server-selected host workspace on desktop and mobile, lists only organizations returned by its BFF, keeps organization-controller screens absent, and exposes lifecycle intent without treating browser state as authority or persistence proof.
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { expect, test } from '@playwright/test'

test('shows the bounded host organization directory', async ({ page }, testInfo) => {
  await page.route('**/api/host/organizations?**', route => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify({
      total: 1, pageSize: 25, returned: 1, hasNext: false,
      organizations: [{ id: 'tenant-1', legalName: 'Clinic One', identifierType: 'TAX', identifierValue: 'B12345678', sameAs: 'did:web:clinic.example', jurisdiction: 'ES', sector: 'health-care', status: 'active' }],
    }),
  }))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Authorized organizations' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Clinic One' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Suspend' })).toBeEnabled()
  await expect(page.getByText('Members and devices')).toHaveCount(0)

  const stamp = new Date().toISOString().replace(/[-:]/gu, '').replace('T', '-').slice(0, 15)
  const directory = path.resolve('screenshots')
  await mkdir(directory, { recursive: true })
  await page.screenshot({ path: path.join(directory, `antifraud-controller-${stamp}-host-organization-directory-en-${testInfo.project.name}.png`), fullPage: true })
})
