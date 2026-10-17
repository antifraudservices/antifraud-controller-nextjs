// Flow contract: 1. A local verified controller enters the sector-neutral Antifraud controller home. 2. Qualification-sector subject work is absent. 3. The user opens Members and devices and manages confirmed lifecycle actions. 4. Each employee expands to editable group and department memberships and the directory can be filtered. 5. The controller assigns the identity-evidence group and reviews its exact reusable capabilities. 6. The Groups and departments workspace lists members per group and creates neutral groups and departments. Authorization invariant: fixture selection grants no gateway or qualification-sector authority; assignments are displayed as server-owned administrative intent only. Persistence invariant: this journey performs no network write and production mode remains disabled.
import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

function evidencePath(projectName: string, action: string): string {
  const now = new Date()
  const stamp = now.toISOString().replace(/[-:]/gu, '').replace('T', '-').slice(0, 15)
  const viewport = projectName.includes('mobile') ? 'mobile' : 'desktop'
  return resolve(process.cwd(), 'screenshots', `antifraud-controller-${stamp}-${action}-en-${viewport}.png`)
}

test('reuses the proven controller home and shared workforce administration', async ({ page }, testInfo) => {
  const errors: string[] = []
  const mobile = testInfo.project.name.includes('mobile')
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })

  await page.goto('/')
  await expect(page).toHaveTitle(/Antifraud Controller/u)
  await expect(page.getByRole('heading', { name: 'Example Organization' })).toBeVisible()
  await expect(page.getByText('Reusable controller Demo')).toBeVisible()
  await expect(page.locator('.controller-card').getByText('Organization information')).toBeVisible()
  await expect(page.locator('.controller-card').getByText('Members and devices')).toBeVisible()
  await expect(page.locator('.controller-card').getByText('Groups and departments')).toBeVisible()
  await expect(page.getByText('Availability and appointments')).toHaveCount(0)

  const homeText = await page.locator('body').innerText()
  expect(homeText).not.toMatch(/Student records|Patient records|Animal records|Clinical records/u)
  await mkdir(resolve(process.cwd(), 'screenshots'), { recursive: true })
  await page.screenshot({ path: evidencePath(testInfo.project.name, 'reused-controller-home'), fullPage: true })

  await page.locator('.controller-card').filter({ hasText: 'Members and devices' }).click()
  await expect(page.getByRole('heading', { name: 'Members and devices' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Members and registered devices' })).toBeVisible()
  const currentController = page.getByRole('region', { name: 'Current controller' })
  await expect(currentController.getByText('controller@example.invalid')).toBeVisible()
  await expect(currentController.getByRole('button')).toHaveCount(0)
  await expect(page.getByText('new.member@example.invalid')).toBeVisible()

  const membershipDirectory = page.getByRole('region', { name: 'Employee groups and departments' })
  await expect(membershipDirectory).toBeVisible()
  const employeeFilter = membershipDirectory.getByLabel('Filter employees')
  await employeeFilter.fill('service.manager')
  await expect(membershipDirectory.getByText('service.manager@example.invalid')).toBeVisible()
  await expect(membershipDirectory.getByText('member.manager@example.invalid')).toHaveCount(0)
  const serviceMembership = membershipDirectory.getByRole('group', { name: /service.manager@example.invalid/u })
  await serviceMembership.getByText('service.manager@example.invalid').click()
  await serviceMembership.getByRole('checkbox', { name: 'Client group managers' }).check()
  await serviceMembership.getByRole('checkbox', { name: 'Field Services' }).check()

  const activeMember = page.getByRole('row').filter({ hasText: 'service.manager@example.invalid' })
  const suspend = activeMember.getByRole('button', { name: 'Suspend member' })
  await expect(suspend).toHaveClass(/uhcp-warning-action/u)
  page.once('dialog', async dialog => {
    expect(dialog.message()).toContain('Suspend this member?')
    await dialog.dismiss()
  })
  await suspend.click()
  await expect(activeMember.getByText('Active')).toBeVisible()
  page.once('dialog', dialog => dialog.accept())
  await suspend.click()
  await expect(activeMember.getByText('Inactive')).toBeVisible()
  const reactivate = activeMember.getByRole('button', { name: 'Reactivate member' })
  await expect(reactivate).toHaveClass(/uhcp-primary-action/u)
  page.once('dialog', dialog => dialog.accept())
  await reactivate.click()
  await expect(activeMember.getByText('Active')).toBeVisible()

  const inactiveMember = page.getByRole('row').filter({ hasText: 'member.manager@example.invalid' })
  const purge = inactiveMember.getByRole('button', { name: 'Purge and release licence' })
  await expect(purge).toHaveClass(/uhcp-danger/u)
  page.once('dialog', dialog => dialog.dismiss())
  await purge.click()
  await expect(inactiveMember).toBeVisible()
  page.once('dialog', dialog => dialog.accept())
  await purge.click()
  await expect(inactiveMember).toHaveCount(0)

  await page.getByLabel('Email').fill('audit.viewer@example.invalid')
  await page.getByLabel('Administrative role').selectOption('audit-viewer')
  await page.getByLabel('Controller PIN').fill('123456')
  await page.getByRole('button', { name: 'Create invitation' }).click()
  await expect(page.getByText('audit.viewer@example.invalid')).toBeVisible()
  await page.screenshot({ path: evidencePath(testInfo.project.name, 'shared-members-and-devices'), fullPage: true })

  await page.getByRole('button', { name: 'Groups and departments' }).click()
  await expect(page.getByRole('heading', { name: 'Groups and departments' })).toBeVisible()
  const clientManagers = page.getByRole('article', { name: 'Client group managers' })
  await expect(clientManagers.getByText('service.manager@example.invalid')).toBeVisible()
  const evidenceAssistants = page.getByRole('article', { name: 'Identity evidence assistants' })
  await expect(evidenceAssistants.getByText('service.manager@example.invalid')).toBeVisible()
  await expect(evidenceAssistants.getByText('identity.evidence.record')).toBeVisible()
  await expect(evidenceAssistants.getByText('identity.claim.verify')).toBeVisible()
  await expect(evidenceAssistants.getByText('identity.relationship.attest')).toBeVisible()
  await page.getByLabel('Group name').fill('Weekend coordinators')
  await page.getByLabel('Group template').selectOption('appointment-coordination')
  const createGroup = page.getByRole('button', { name: 'Create group' })
  if (mobile) { await createGroup.focus(); await page.keyboard.press('Enter') } else await createGroup.click()
  await expect(page.getByRole('article', { name: 'Weekend coordinators' })).toBeVisible()
  await page.getByLabel('Department name').fill('Mobile Response')
  const createDepartment = page.getByRole('button', { name: 'Create department' })
  if (mobile) { await createDepartment.focus(); await page.keyboard.press('Enter') } else await createDepartment.click()
  await expect(page.getByRole('article', { name: 'Mobile Response' })).toBeVisible()
  await expect(page.getByText('Schedule availability')).toHaveCount(0)
  await expect(page.getByText('Manage appointments')).toHaveCount(0)
  await page.screenshot({ path: evidencePath(testInfo.project.name, 'groups-and-departments'), fullPage: true })

  expect(errors).toEqual([])
})
