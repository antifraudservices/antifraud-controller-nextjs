// Flow contract: 1. A locally authenticated controller opens the organization workspace. 2. The controller reads gateway-owned licences, invitations, employees, devices and memberships. 3. The trusted hostname exposes canonical synthetic professional roles without turning their labels into authority. 4. Lifecycle and membership mutations return refreshed authoritative state. 5. Departments, employee groups, Schema.org Places and client Services remain separate screens; only separately authorized Places and Services enter the public catalog. 6. A reload preserves structure and catalog state. 7. Employee identity and age-over evidence travel through UI, BFF, public SDK and gateway. 8. The controller searches the real Terminology service through its BFF and published SDK, selects one canonical qualification code, and changes to Spanish without changing that identity. 9. A minimal valid PDF travels as a DIDComm attachment beside its Schema.org MediaObject, is sealed by the managed wallet, retrieved byte-for-byte by the authorized BFF, and its CID is used for qualification evidence. 10. The employer submission persists the canonical terminology identity but remains only an employer attestation. 11. The separately authenticated Professional portal reads only the addressed issuer reference, submits its decision through its own BFF and reloads authoritative Gateway state. Authorization invariant: neither browser supplies actor, organization, assignment, group authorization, sector, jurisdiction, catalog distribution, terminology credential, zone, channel or smart-contract authority. Persistence invariant: state survives browser reload for the lifetime of the owned local Gateway process; durable ledger and deployed-network proof remain separate gates.
import { expect, test, type Page } from '@playwright/test'
import { resolve } from 'node:path'

function evidencePath(projectName: string, action: string): string {
  const now = new Date()
  const stamp = now.toISOString().replace(/[-:]/gu, '').replace('T', '-').slice(0, 15)
  const viewport = projectName.includes('mobile') ? 'mobile' : 'desktop'
  return resolve(process.cwd(), 'screenshots', `antifraud-controller-${stamp}-${action}-en-${viewport}.png`)
}

async function captureEvidence(page: Page, path: string): Promise<void> {
  const style = await page.addStyleTag({ content: '.controller-header { position: static !important; }' })
  await page.screenshot({ path, fullPage: true })
  await style.evaluate(element => element.remove())
}

test('reuses the proven controller home and shared workforce administration', async ({ page }, testInfo) => {
  const errors: string[] = []
  const evidenceIntents: string[] = []
  const controllerIntents: string[] = []
  const mobile = testInfo.project.name.includes('mobile')
  const runLabel = mobile ? 'Mobile' : 'Desktop'
  const transactionPattern = process.env.ANTIFRAUD_NETWORK_KIND === 'local-network'
    ? /[a-f0-9]{64}/u
    : /tx:/u
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('request', request => {
    if (request.url().includes('/api/evidence/')) evidenceIntents.push(request.postData() ?? '')
    if (request.url().includes('/api/controller/actions')) controllerIntents.push(request.postData() ?? '')
  })

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Choose an environment' })).toBeVisible()
  await page.getByRole('link', { name: /Demo — simulated blockchain/u }).click()
  await expect(page).toHaveTitle(/Antifraud Controller/u)
  await expect(page.getByRole('heading', { name: 'Organization' })).toBeVisible()
  await expect(page.getByText('Authenticated controller workspace')).toBeVisible()
  await expect(page.locator('.controller-card').getByText('Organization information')).toBeVisible()
  await expect(page.locator('.controller-card').getByText('Members and devices')).toBeVisible()
  await expect(page.locator('.controller-card').getByText('Departments', { exact: true })).toBeVisible()
  await expect(page.locator('.controller-card').getByText('Employee groups', { exact: true })).toBeVisible()
  await expect(page.locator('.controller-card').getByText('Places', { exact: true })).toBeVisible()
  await expect(page.locator('.controller-card').getByText('Client services', { exact: true })).toBeVisible()
  await expect(page.locator('.controller-card').getByText('Identity and qualification evidence')).toBeVisible()
  await expect(page.locator('.controller-card').getByText('Clearing House')).toBeVisible()
  await captureEvidence(page, evidencePath(testInfo.project.name, 'reused-controller-home'))

  await page.locator('.controller-card').filter({ hasText: 'Members and devices' }).click()
  await expect(page.getByRole('heading', { name: 'Members and devices' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Members and registered devices' })).toBeVisible()
  await expect(page.getByLabel('Administrative role').locator('option[value="doctor"]')).toHaveText(/synthetic test role/u)
  await expect(page.getByLabel('Administrative role').locator('option[value="veterinarian"]')).toHaveText(/synthetic test role/u)
  await expect(page.getByLabel('Administrative role').locator('option[value="police_officer"]')).toHaveText(/synthetic test role/u)
  const currentController = page.getByRole('region', { name: 'Current controller' })
  await expect(currentController.getByText('Authenticated controller')).toBeVisible()
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
  if (!(await serviceMembership.getByRole('checkbox', { name: 'Client group managers' }).isChecked())) await serviceMembership.getByRole('checkbox', { name: 'Client group managers' }).click()
  await expect(serviceMembership.getByRole('checkbox', { name: 'Client group managers' })).toBeChecked()
  if (!(await serviceMembership.getByRole('checkbox', { name: 'Field Services' }).isChecked())) await serviceMembership.getByRole('checkbox', { name: 'Field Services' }).click()
  await expect(serviceMembership.getByRole('checkbox', { name: 'Field Services' })).toBeChecked()

  const activeMember = page.getByRole('row').filter({ hasText: 'service.manager@example.invalid' })
  const suspend = activeMember.getByRole('button', { name: 'Suspend member' })
  await expect(suspend).toBeEnabled()
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
  await expect(reactivate).toBeEnabled()
  page.once('dialog', dialog => dialog.accept())
  await reactivate.click()
  await expect(activeMember.getByText('Active')).toBeVisible()

  const inactiveMember = page.getByRole('row').filter({ hasText: 'member.manager@example.invalid' })
  if (await inactiveMember.count()) {
    const purge = inactiveMember.getByRole('button', { name: 'Purge and release licence' })
    await expect(purge).toBeEnabled()
    page.once('dialog', dialog => dialog.dismiss())
    await purge.click()
    await expect(inactiveMember).toBeVisible()
    page.once('dialog', dialog => dialog.accept())
    await purge.click()
    await expect(inactiveMember).toHaveCount(0)
  }

  const invitationAssignments = page.getByRole('region', { name: 'Initial invitation assignments' })
  await invitationAssignments.getByRole('checkbox', { name: 'Identity evidence assistants' }).check()
  await invitationAssignments.getByRole('checkbox', { name: 'Operations', exact: true }).check()
  await page.getByLabel('Email').fill(`audit.viewer.${runLabel.toLowerCase()}@example.invalid`)
  await page.getByLabel('Administrative role').selectOption('audit-viewer')
  await page.getByLabel('Controller PIN').fill('123456')
  await page.getByRole('button', { name: 'Create invitation' }).click()
  await expect(page.getByText(`audit.viewer.${runLabel.toLowerCase()}@example.invalid`)).toBeVisible()
  await captureEvidence(page, evidencePath(testInfo.project.name, 'shared-members-and-devices'))

  await page.getByRole('button', { name: 'Employee groups', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Employee groups', level: 2 })).toBeVisible()
  await expect(page.getByLabel('Group template').locator('option[value="subject-registration"]')).toHaveCount(1)
  await expect(page.getByLabel('Group template').locator('option[value="scheduling-operations"]')).toHaveCount(1)
  const clientManagers = page.getByRole('article', { name: 'Client group managers' })
  await expect(clientManagers.getByText('service.manager@example.invalid')).toBeVisible()
  const evidenceAssistants = page.getByRole('article', { name: 'Identity evidence assistants' })
  await expect(evidenceAssistants.getByText('service.manager@example.invalid')).toBeVisible()
  await expect(evidenceAssistants.getByText('identity.evidence.record')).toBeVisible()
  await expect(evidenceAssistants.getByText('identity.claim.verify')).toBeVisible()
  await expect(evidenceAssistants.getByText('identity.relationship.attest')).toBeVisible()
  await page.getByLabel('Group name').fill(`${runLabel} schedulers`)
  await page.getByLabel('Group template').selectOption('scheduling-operations')
  const createGroup = page.getByRole('button', { name: 'Create group' })
  if (mobile) { await createGroup.focus(); await page.keyboard.press('Enter') } else await createGroup.click()
  const schedulingGroup = page.getByRole('article', { name: `${runLabel} schedulers` })
  await expect(schedulingGroup).toBeVisible()
  await expect(schedulingGroup.getByText('organization/Appointment.cruds', { exact: true })).toBeVisible()
  await expect(schedulingGroup.getByText('organization/Schedule.cruds', { exact: true })).toBeVisible()
  await expect(schedulingGroup.getByText('organization/Slot.cruds', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Departments', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Departments', level: 2 })).toBeVisible()
  await page.getByLabel('Department name').fill(`${runLabel} Operations`)
  const createDepartment = page.getByRole('button', { name: 'Create department' })
  if (mobile) { await createDepartment.focus(); await page.keyboard.press('Enter') } else await createDepartment.click()
  await expect(page.getByRole('article', { name: `${runLabel} Operations` })).toBeVisible()
  await page.getByRole('button', { name: 'Places', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Places', exact: true })).toBeVisible()
  const placeName = `${runLabel} service point`
  await page.getByLabel('Name').fill(placeName)
  await page.getByLabel('Department').selectOption({ label: `${runLabel} Operations` })
  await page.getByLabel('Latitude (optional)').fill('49.28')
  await page.getByLabel('Longitude (optional)').fill('-123.12')
  await page.getByRole('button', { name: 'Create Place' }).click()
  const placeCard = page.getByRole('article').filter({ hasText: placeName })
  await expect(placeCard).toBeVisible()
  await placeCard.getByRole('checkbox', { name: 'Publish in service catalog' }).click()
  await expect(placeCard.getByText('Public', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Client services', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Client services', exact: true })).toBeVisible()
  const serviceName = `${runLabel} assessment`
  await page.getByLabel('Name').fill(serviceName)
  await page.getByLabel('Service type').fill('qualification-assessment')
  await page.getByLabel('Department').selectOption({ label: `${runLabel} Operations` })
  await page.getByRole('checkbox', { name: new RegExp(placeName, 'u') }).check()
  await page.getByRole('button', { name: 'Create client service' }).click()
  const serviceCard = page.getByRole('article').filter({ hasText: serviceName })
  await expect(serviceCard).toBeVisible()
  await serviceCard.getByRole('checkbox', { name: 'Publish in service catalog' }).click()
  await expect(serviceCard.getByText('Public', { exact: true })).toBeVisible()
  await captureEvidence(page, evidencePath(testInfo.project.name, 'public-service-catalog'))

  await page.reload()
  await expect(page.getByText('Authenticated controller workspace')).toBeVisible()
  await page.getByRole('button', { name: 'Employee groups', exact: true }).click()
  await expect(page.getByRole('article', { name: `${runLabel} schedulers` })).toBeVisible()
  await page.getByRole('button', { name: 'Departments', exact: true }).click()
  await expect(page.getByRole('article', { name: `${runLabel} Operations` })).toBeVisible()
  await page.getByRole('button', { name: 'Places', exact: true }).click()
  await expect(page.getByRole('article').filter({ hasText: placeName }).getByText('Public', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Client services', exact: true }).click()
  await expect(page.getByRole('article').filter({ hasText: serviceName }).getByText('Public', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Identity and qualification evidence' }).click()
  await expect(page.getByRole('heading', { name: 'Identity evidence' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Employee qualification evidence' })).toBeVisible()
  const identityEvidence = page.locator('section[aria-labelledby="identity-evidence-editor-title"]')
  await identityEvidence.getByRole('combobox').nth(0).selectOption({ index: 1 })
  await identityEvidence.getByRole('combobox').nth(1).selectOption('age-over')
  await identityEvidence.getByRole('spinbutton', { name: 'Age threshold' }).fill('21')
  await identityEvidence.getByRole('textbox', { name: 'Evidence check reference' }).fill('check:local:age-over-21')
  await identityEvidence.getByRole('button', { name: 'Record evidence' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Identity evidence recorded' })).toContainText(transactionPattern)
  const qualificationEvidence = page.locator('section[aria-labelledby="qualification-evidence-editor-title"]')
  const classification = page.locator('section[aria-labelledby="qualification-classification-title"]')
  await classification.getByLabel('Qualification classification').fill('synthetic qualification')
  await classification.getByRole('button', { name: 'Search classifications' }).click()
  await classification.getByLabel('Select classification').selectOption(
    'urn:antifraud:terminology:synthetic:education-qualification|synthetic-bachelor-001',
  )
  await expect(classification.getByLabel('Canonical qualification code')).toHaveValue(
    'urn:antifraud:terminology:synthetic:education-qualification|synthetic-bachelor-001',
  )
  await expect(classification.getByText('Classification selected; issuer verification is still pending.')).toBeVisible()
  await classification.getByLabel('Interface language').selectOption('es')
  await expect(classification.getByText('Cualificación sintética de nivel de grado')).toBeVisible()
  await expect(classification.getByLabel('Canonical qualification code')).toHaveValue(
    'urn:antifraud:terminology:synthetic:education-qualification|synthetic-bachelor-001',
  )
  await qualificationEvidence.getByRole('combobox').nth(0).selectOption({ index: 1 })
  await qualificationEvidence.getByRole('textbox', { name: 'Qualification title' }).fill('Example degree')
  await qualificationEvidence.getByRole('textbox', { name: 'Qualification identifier', exact: true }).fill('DEGREE-001')
  await qualificationEvidence.getByRole('textbox', { name: 'Identifier system' }).fill('https://credentials.example.invalid')
  await qualificationEvidence.getByRole('textbox', { name: 'Issuer legal identifier' }).fill('EXAMPLE-UNIVERSITY')
  await qualificationEvidence.getByRole('textbox', { name: 'Issuer jurisdiction' }).fill('ES')
  await qualificationEvidence.getByRole('button', { name: 'Find authoritative issuer' }).click()
  await expect(qualificationEvidence.getByText('Authoritative organization resolved')).toBeVisible()
  await qualificationEvidence.locator('input[type="file"]').setInputFiles({
    name: `example-degree-${runLabel.toLowerCase()}.pdf`,
    mimeType: 'application/pdf',
    buffer: Buffer.from(`%PDF-1.4\n% Synthetic ${runLabel} fixture\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n`),
  })
  await expect(qualificationEvidence.getByText('Content identifier')).toBeVisible()
  await qualificationEvidence.getByRole('checkbox').check()
  const qualificationResponsePromise = page.waitForResponse(response =>
    response.url().endsWith('/api/evidence/qualification') && response.request().method() === 'POST',
  )
  await qualificationEvidence.getByRole('button', { name: 'Record employer attestation' }).click()
  const qualificationResponse = await qualificationResponsePromise
  const qualificationResult = await qualificationResponse.json() as {anchor?: {evidenceId?: string}}
  await expect(qualificationEvidence.getByText('Issuer confirmation queued')).toBeVisible()
  const qualificationTransaction = qualificationEvidence.getByLabel('Issuer confirmation delivery').getByText(transactionPattern)
  await expect(qualificationTransaction).toBeVisible()
  const evidenceLocator = qualificationResult.anchor?.evidenceId
  if (!evidenceLocator) throw new Error('Qualification evidence locator was not returned by the Gateway.')
  await captureEvidence(page, evidencePath(testInfo.project.name, 'identity-and-qualification-evidence'))

  const professionalPage = await page.context().newPage()
  await professionalPage.goto('http://127.0.0.1:3610')
  await professionalPage.getByRole('button', {name: 'Issuer inbox'}).click()
  const addressedEvidence = professionalPage.getByRole('article', {name: evidenceLocator})
  await expect(addressedEvidence).toContainText('pending-issuer-confirmation')
  await addressedEvidence.getByRole('button', {name: 'Open evidence'}).click()
  const issuerClassification = addressedEvidence.getByLabel('Qualification classification')
  await expect(issuerClassification.getByText('synthetic-bachelor-001', {exact: true})).toBeVisible()
  await expect(issuerClassification.getByText('demo-2026-10', {exact: true})).toBeVisible()
  await expect(issuerClassification.getByText('Employer-reviewed evidence; issuer decision pending.')).toBeVisible()
  await addressedEvidence.getByRole('button', {name: 'Confirm evidence'}).click()
  await expect(addressedEvidence).toContainText('confirmed')
  await professionalPage.reload()
  await professionalPage.getByRole('button', {name: 'Issuer inbox'}).click()
  await expect(professionalPage.getByRole('article', {name: evidenceLocator})).toContainText('confirmed')
  await professionalPage.screenshot({ path: evidencePath(testInfo.project.name, 'professional-addressed-inbox'), fullPage: true })
  await professionalPage.close()

  await page.getByRole('button', { name: 'Clearing House', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Clearing House inbox' })).toBeVisible()
  const inboxItem = page.getByRole('article', { name: 'evidence:controller-inbox:001' })
  await expect(inboxItem).toBeVisible()
  const confirmEvidence = inboxItem.getByRole('button', { name: 'Confirm evidence' })
  if (await confirmEvidence.count()) {
    await confirmEvidence.click()
    await expect(inboxItem.getByText('confirmed', { exact: true })).toBeVisible()
  } else {
    await expect(inboxItem.getByText('confirmed', { exact: true })).toBeVisible()
  }
  await captureEvidence(page, evidencePath(testInfo.project.name, 'clearing-house'))

  expect(evidenceIntents).toHaveLength(2)
  const qualificationIntent = JSON.parse(evidenceIntents.find(intent => intent.includes('qualification')) ?? '{}')
  expect(qualificationIntent.qualification.classification).toEqual({
    system: 'urn:antifraud:terminology:synthetic:education-qualification',
    version: 'demo-2026-10',
    code: 'synthetic-bachelor-001',
    display: 'Bachelor-level synthetic qualification',
  })
  for (const intent of evidenceIntents) {
    expect(intent).not.toMatch(/"actor"|"assignmentReference"|"groupAuthorization"|"channel"|"zone"|"smartContract"/u)
  }
  expect(controllerIntents.length).toBeGreaterThanOrEqual(5)
  for (const intent of controllerIntents) {
    expect(intent).not.toMatch(/"actor"|"organizationReference"|"assignmentReference"|"groupAuthorization"|"channel"|"zone"|"smartContract"/u)
  }
  const groupIntent = controllerIntents.find(intent => intent.includes('create-group'))
  expect(groupIntent).toContain('"template":"scheduling-operations"')
  expect(groupIntent).not.toContain('"capabilities"')
  expect(errors).toEqual([])
})
