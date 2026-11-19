// Flow contract:
// 1. Anonymous access to the Test Network host policy is denied.
// 2. A registered Firebase virtual phone signs in and the host checks its controller assignment.
// 3. The controller enables verified automatic approval for one country in a dedicated -tech sector.
// 4. The controller reopens the policy and confirms the saved rule and revision through a fresh server read.
// 5. The controller returns the sector to review and confirms the new revision through another server read.
// Authorization is scoped to the exact host, Test Network and sector. Changes use the server's revision check.

import { expect, test, type Page } from '@playwright/test'

const phone = process.env.ANTIFRAUD_ADMISSION_E2E_PHONE
const code = process.env.ANTIFRAUD_ADMISSION_E2E_CODE
const sector = process.env.ANTIFRAUD_ADMISSION_E2E_SECTOR || ''
const country = process.env.ANTIFRAUD_ADMISSION_E2E_COUNTRY || ''
const hostDid = process.env.ANTIFRAUD_ADMISSION_E2E_HOST_DID || ''
const countryName = new Intl.DisplayNames(['en'], { type: 'region' })

async function enterSecret(page: Page, name: string, value: string) {
  await page.getByRole('textbox', { name }).evaluate((input, text) => {
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    setValue.call(input, text)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }, value)
}

async function policyResponse(page: Page, method: 'GET' | 'PUT') {
  const response = await page.waitForResponse(candidate => {
    const url = new URL(candidate.url())
    return url.origin === new URL(page.url()).origin && url.pathname === '/api/host/admission-policy'
      && url.searchParams.get('sector') === sector && candidate.request().method() === method
  })
  expect(response.status()).toBe(200)
  const policy = await response.json()
  expect(policy).toMatchObject({ network: 'test-network', sector, hostDid })
  return policy
}

test('signs in with Firebase phone auth and persists and restores a Test Network admission rule', async ({ page, baseURL }) => {
  if (!phone || !/^\+[1-9]\d{6,14}$/.test(phone) || !code || !/^\d{6}$/.test(code)
    || !/^[a-z0-9]+(?:-[a-z0-9]+)*-tech$/.test(sector) || !/^[A-Z]{2}$/.test(country) || !/^did:web:[a-z0-9.-]+$/.test(hostDid)) {
    throw new Error('Configure the registered virtual phone, code, dedicated host DID, -tech sector and enabled country.')
  }

  await page.goto('/test-network')
  expect(new URL(page.url()).origin).toBe(baseURL)
  await expect(page.getByRole('heading', { name: 'Host controller sign-in' })).toBeVisible()
  const denied = await page.request.get(`/api/host/admission-policy?sector=${encodeURIComponent(sector)}`)
  expect(denied.status()).toBe(403)

  await enterSecret(page, 'Test phone number', phone)
  await page.getByRole('button', { name: 'Send code' }).click()
  await enterSecret(page, 'Verification code', code)
  const firstRead = policyResponse(page, 'GET')
  await page.getByRole('button', { name: 'Verify code' }).click()
  const selector = page.getByRole('combobox', { name: 'Sector' })
  await expect(selector).toBeVisible()
  await selector.selectOption(sector)
  const initial = await firstRead
  expect(initial.mode, 'The dedicated sector must start in review').toBe('review')
  expect(initial.allowedCountries).toContain(country)

  const approval = page.getByRole('combobox', { name: 'Approval' })
  const save = page.getByRole('button', { name: 'Save policy' })
  async function reopen() {
    await page.getByRole('button', { name: 'Review queue' }).click()
    const read = policyResponse(page, 'GET')
    await page.getByRole('button', { name: 'Admission policy' }).click()
    await selector.selectOption(sector)
    return read
  }

  let submitted = false
  try {
    await approval.selectOption('automatic-after-verification')
    await page.getByRole('checkbox', { name: countryName.of(country), exact: true }).check()
    const write = policyResponse(page, 'PUT')
    submitted = true
    await save.click()
    const expected = {
      mode: 'automatic-after-verification', revision: initial.revision + 1,
      countries: { kind: 'selected', codes: [country] },
    }
    expect(await write).toMatchObject(expected)
    expect(await reopen()).toMatchObject(expected)
    await expect(approval).toHaveValue('automatic-after-verification')
  } finally {
    if (submitted) {
      const persisted = await reopen()
      if (persisted.mode === 'automatic-after-verification' && persisted.revision === initial.revision + 1
        && persisted.countries.kind === 'selected' && persisted.countries.codes.join(',') === country
        && !persisted.conditions?.length) {
        await approval.selectOption('review')
        const restored = policyResponse(page, 'PUT')
        await save.click()
        expect(await restored).toMatchObject({ mode: 'review', revision: initial.revision + 2 })
        expect(await reopen()).toMatchObject({ mode: 'review', revision: initial.revision + 2 })
      } else {
        expect(persisted).toMatchObject({ mode: 'review' })
      }
    }
  }
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page.getByRole('heading', { name: 'Host controller sign-in' })).toBeVisible()
})
