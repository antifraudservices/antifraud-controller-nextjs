// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
// 1. Verify that an anonymous request cannot access the organization catalogue.
// 2. Authenticate the registered tenant controller through Firebase virtual phone.
// 3. Publish a product, revise it and publish a service through the normal portal.
// 4. Confirm the revision and service in the tenant feed and follow the host DCAT link.
// 5. Open a fresh browser session and confirm the persisted revision again.
// 6. Authenticate a different phone account and verify it cannot open the tenant catalogue.
// The gateway and portal must use real signing, request handling and protected storage.
// Test subjects and catalogue entries come from the provisioned test tenant fixture only.
import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'

type OfferingEntry = {
  id: string
  type: string
  attributes: Record<string, unknown> & { name: string }
}

test('phone-authenticated controller publishes, revises and discovers tenant offerings', async ({ browser, baseURL, request }) => {
  const fixturePath = process.env.CONTROLLER_CATALOGUE_E2E_PUBLIC_FIXTURE
  const phone = process.env.E2E_CONTROLLER_FIREBASE_PHONE_NUMBER
  const code = process.env.E2E_CONTROLLER_FIREBASE_PHONE_CODE
  const otherPhone = process.env.E2E_OTHER_FIREBASE_PHONE_NUMBER
  const otherCode = process.env.E2E_OTHER_FIREBASE_PHONE_CODE
  if (!fixturePath || !phone || !code || !otherPhone || !otherCode || phone === otherPhone || !baseURL) {
    throw new Error('The catalogue browser fixture and two distinct virtual phone accounts are required.')
  }
  const fixture = JSON.parse(readFileSync(fixturePath, 'utf8')) as {
    gateway: string; hostCataloguePath: string; tenantCataloguePath: string; offering: OfferingEntry
  }
  const account = (await request.get('/api/controller/catalogue')).status()
  expect(account).toBe(401)

  async function enterPhone(page: Page, number: string, verificationCode: string) {
    await page.goto(new URL('/test-network', baseURL).href)
    await expect(page.getByRole('heading', { name: 'Organization controller sign-in' })).toBeVisible()
    await page.getByRole('textbox', { name: /^(Test )?phone number$/i }).fill(number)
    await page.getByRole('button', { name: 'Send code' }).click()
    await page.getByRole('textbox', { name: 'Verification code' }).fill(verificationCode)
    await page.getByRole('button', { name: 'Verify code' }).click()
  }
  async function signIn(page: Page) {
    await enterPhone(page, phone!, code!)
    await expect(page.getByRole('textbox', { name: 'Catalogue document' })).toBeVisible({ timeout: 20_000 })
  }
  async function publish(page: Page, entry: OfferingEntry) {
    await page.getByRole('textbox', { name: 'Catalogue document' })
      .fill(JSON.stringify({ jsonapi: { version: '1.1' }, data: [entry] }))
    const updated = page.waitForResponse(response => new URL(response.url()).pathname === '/api/controller/catalogue'
      && response.request().method() === 'PUT')
    await page.getByRole('button', { name: 'Publish catalogue entries' }).click()
    expect((await updated).ok()).toBe(true)
    await expect(page.getByRole('status')).toHaveText('Catalogue published.')
  }

  const initial = fixture.offering
  const revised = { ...initial, attributes: { ...initial.attributes, name: initial.attributes.name + ' revised' } }
  const { manufacturer: _manufacturer, ...serviceAttributes } = initial.attributes
  const service = { id: initial.id + '-service', type: 'Service', attributes: serviceAttributes }
  const page = await browser.newPage()
  try {
    await signIn(page)
    await publish(page, initial)
    await publish(page, revised)
    await publish(page, service)
    await expect(page.getByText(revised.attributes.name, { exact: true })).toBeVisible()
  } finally {
    await page.close()
  }

  const hostResult = await request.get(new URL(fixture.hostCataloguePath, fixture.gateway).href)
  expect(hostResult.ok()).toBe(true)
  const host = await hostResult.json()
  const tenantUrl = new URL(fixture.tenantCataloguePath, fixture.gateway).href
  expect(host['dcat:catalog']).toContainEqual({ '@id': tenantUrl })
  const tenantResult = await request.get(tenantUrl)
  expect(tenantResult.ok()).toBe(true)
  const tenant = await tenantResult.json()
  const feedUrl = tenantUrl.replace(/dcat\.json$/, 'offerings.json')
  expect(tenant['dcat:service']).toContainEqual(expect.objectContaining({ 'dcat:endpointURL': feedUrl }))
  const feedResult = await request.get(feedUrl)
  expect(feedResult.ok()).toBe(true)
  expect(await feedResult.json()).toEqual(expect.arrayContaining([
    expect.objectContaining({ id: revised.id, type: revised.type, name: revised.attributes.name }),
    expect.objectContaining({ id: service.id, type: service.type, name: service.attributes.name }),
  ]))

  const reopened = await browser.newPage()
  try {
    await signIn(reopened)
    await expect(reopened.getByText(revised.attributes.name, { exact: true })).toBeVisible()
  } finally {
    await reopened.close()
  }
  const outsideAccount = await browser.newPage()
  try {
    await enterPhone(outsideAccount, otherPhone, otherCode)
    await expect(outsideAccount.getByRole('region', { name: 'Organization catalogue' }).getByRole('alert')).toHaveText('No catalogue profile is registered for this account.')
    await expect(outsideAccount.getByRole('textbox', { name: 'Catalogue document' })).toHaveCount(0)
  } finally {
    await outsideAccount.close()
  }
})
