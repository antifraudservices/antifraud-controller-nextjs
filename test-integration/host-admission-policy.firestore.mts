// Flow contract: Firestore persists each policy revision with its audit entry and serves a committed decision only to the assigned Gateway for the exact transaction scope.
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'vitest'
import { deleteApp, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { createFirestoreHostAdmissionPolicyStore } from '../src/server/firestore-host-admission-policy.ts'
import { handleGatewayAdmissionDecision } from '../src/server/gateway-admission-decision.ts'

test('persists policy updates and audit events atomically with authoritative readback', async () => {
  assert.match(process.env.FIRESTORE_EMULATOR_HOST || '', /^127\.0\.0\.1:\d+$/)
  const app = initializeApp({ projectId: 'demo-antifraud-admission' }, 'admission-storage-test')
  try {
    const firestore = getFirestore(app)
    const store = createFirestoreHostAdmissionPolicyStore(firestore)
    const scope = { hostDid: `did:web:${randomUUID()}.example`, network: 'test-network', sector: 'animal-care' }
    const automatic = { mode: 'automatic-after-verification', countries: { kind: 'selected', codes: ['ES'] }, conditions: ['signed-application-template'] } as const
    assert.deepEqual(await store.read(scope), { mode: 'review', revision: 0 })

    const concurrent = await Promise.all([
      store.change(scope, automatic, 0, 'controller-a'),
      store.change(scope, automatic, 0, 'controller-b'),
    ])
    assert.equal(concurrent.filter(Boolean).length, 1)
    assert.deepEqual(await store.read(scope), { ...automatic, revision: 1 })
    assert.deepEqual(await store.change(scope, { mode: 'review' }, 1, 'controller-a'), { mode: 'review', revision: 2 })
    assert.deepEqual(await store.read(scope), { mode: 'review', revision: 2 })

    const policies = await firestore.collection('hostAdmissionPolicies').where('hostDid', '==', scope.hostDid).get()
    assert.equal(policies.size, 1)
    const changes = await policies.docs[0].ref.collection('changes').orderBy('changedAt').get()
    assert.equal(changes.size, 2)
    assert.deepEqual(changes.docs[0].get('updated'), { ...automatic, revision: 1 })
    assert.deepEqual(changes.docs[1].get('updated'), { mode: 'review', revision: 2 })
    assert.equal(changes.docs[1].get('actorUid'), 'controller-a')
  } finally {
    await deleteApp(app)
  }
})

test('authorizes only the exact committed admission decision from Firestore', async () => {
  assert.match(process.env.FIRESTORE_EMULATOR_HOST || '', /^127\.0\.0\.1:\d+$/)
  const app = initializeApp({ projectId: 'demo-antifraud-admission' }, 'admission-decision-test')
  try {
    const firestore = getFirestore(app)
    const hostDid = `did:web:${randomUUID()}.example`
    const binding = randomUUID().replaceAll('-', '').repeat(2)
    const expected = { bearer: 'test-gateway-token', hostDid, network: 'test-network' }
    const scope = { hostDid, network: expected.network, jurisdiction: 'ES-MD', sector: 'animal-care', binding }
    const decision = { decision: 'approved', reference: 'urn:example:approval' }
    const store = createFirestoreHostAdmissionPolicyStore(firestore)
    const proof = { applicationId: 'case-1', reference: 'urn:example:proof', checks: ['legal-identifier-match', 'official-registry-active'] }
    const post = (body: typeof scope) => handleGatewayAdmissionDecision(new Request('https://controller.example/api/internal/host-admission-decision', {
      method: 'POST', headers: { authorization: `Bearer ${expected.bearer}` }, body: JSON.stringify({ ...body, evidence: proof }),
    }), expected, (scope, evidence) => store.recordDecision(scope, evidence, ['ES']))
    const mismatch = { ...scope, sector: 'health-care' }
    await firestore.collection('hostAdmissionDecisions').doc(binding).create({ ...mismatch, ...decision, evidence: proof, source: 'reviewer' })
    assert.deepEqual(await (await post(scope)).json(), { binding, decision: 'review' })
    assert.deepEqual(await (await post(mismatch)).json(), { binding, ...decision })
  } finally {
    await deleteApp(app)
  }
})

test('uses the current policy and records a replay-safe decision with its ICA evidence references', async () => {
  assert.match(process.env.FIRESTORE_EMULATOR_HOST || '', /^127\.0\.0\.1:\d+$/)
  const app = initializeApp({ projectId: 'demo-antifraud-admission' }, 'admission-evaluation-test')
  try {
    const firestore = getFirestore(app)
    const store = createFirestoreHostAdmissionPolicyStore(firestore)
    const host = { hostDid: `did:web:${randomUUID()}.example`, network: 'test-network', sector: 'health-tech' }
    const scope = { ...host, jurisdiction: 'ES-MD', binding: randomUUID().replaceAll('-', '').repeat(2) }
    const evidence = { applicationId: 'case-1', reference: 'urn:example:verification', checks: ['legal-identifier-match', 'official-registry-active'] } as const
    const expected = { ...host, bearer: 'test-gateway-token' }
    async function submit(current: typeof scope & { applicationId?: string }, result?: Omit<typeof evidence, 'reference'> & { reference: string }, countries = ['ES']) {
      const request = new Request('https://controller.example/api/internal/host-admission-decision', {
        method: 'POST', headers: { authorization: `Bearer ${expected.bearer}` },
        body: JSON.stringify({ ...current, ...(result ? { evidence: result } : {}) }),
      })
      const response = await handleGatewayAdmissionDecision(request, expected, (candidate, verified) => store.recordDecision(candidate, verified, countries))
      assert.equal(response.status, 200)
      return await response.json()
    }
    const pending = await submit({ ...scope, applicationId: evidence.applicationId })
    assert.equal(pending?.decision, 'review')
    const reviewRows = await store.listAdmissionDecisions({ ...host, jurisdiction: scope.jurisdiction }, 'review')
    assert.equal(reviewRows[0]?.applicationId, evidence.applicationId)
    assert.equal(reviewRows[0]?.evidence, undefined)
    const wrongCase = await submit({ ...scope, applicationId: 'different-case' })
    assert.deepEqual(wrongCase, { binding: scope.binding, decision: 'review' })
    await store.change(host, { mode: 'automatic-after-verification', countries: { kind: 'selected', codes: ['ES'] } }, 0, 'controller')
    assert.equal((await submit({ ...scope, jurisdiction: 'CA-ON', binding: randomUUID().replaceAll('-', '').repeat(2) }, evidence, ['ES', 'CA'])).decision, 'review')
    const results = await Promise.all([submit(scope, evidence), submit(scope, evidence)])
    assert.equal(results[0]?.decision, 'approved')
    assert.equal(results[0]?.reference, results[1]?.reference)
    const document = firestore.collection('hostAdmissionDecisions').doc(scope.binding)
    const record = await document.get()
    const archived = await store.listAdmissionDecisions({ ...host, jurisdiction: scope.jurisdiction }, 'approved')
    assert.equal(archived[0]?.reference, results[0]?.reference)
    assert.equal(archived[0]?.source, 'policy')
    assert.equal(archived[0]?.policyRevision, 1)
    assert.deepEqual(await store.listAdmissionDecisions({ ...host, jurisdiction: 'ES-CL' }, 'approved'), [])
    assert.equal(record.get('policyRevision'), 1)
    assert.equal(record.get('applicationId'), evidence.applicationId)
    assert.deepEqual(record.get('evidence'), evidence)
    assert.equal((await document.collection('history').get()).size, 2)
    await store.change(host, { mode: 'review' }, 1, 'controller')
    assert.equal((await submit(scope, evidence)).reference, results[0]?.reference)
    const afterPolicyChange = await store.listAdmissionDecisions({ ...host, jurisdiction: scope.jurisdiction }, 'approved')
    assert.deepEqual(afterPolicyChange[0]?.policySnapshot, {
      policy: {
        mode: 'automatic-after-verification', revision: 1, countries: { kind: 'selected', codes: ['ES'] },
      },
      eligibleCountries: ['ES'],
    })
    assert.deepEqual(await submit(scope), { binding: scope.binding, decision: 'review' })
    assert.deepEqual(await submit(scope, { ...evidence, reference: 'urn:example:different-verification' }),
      { binding: scope.binding, decision: 'review' })
    assert.equal((await submit(scope, evidence)).reference, results[0]?.reference)
    assert.equal((await document.collection('history').get()).size, 2)
    assert.equal((await submit({ ...scope, binding: randomUUID().replaceAll('-', '').repeat(2) }, evidence)).decision, 'review')
  } finally {
    await deleteApp(app)
  }
})

test('requires all configured checks for technical admissions and ignores automatic policies outside eligible scopes', async () => {
  assert.match(process.env.FIRESTORE_EMULATOR_HOST || '', /^127\.0\.0\.1:\d+$/)
  const app = initializeApp({ projectId: 'demo-antifraud-admission' }, 'conditional-admission-test')
  try {
    const store = createFirestoreHostAdmissionPolicyStore(getFirestore(app))
    const host = { hostDid: `did:web:${randomUUID()}.example`, network: 'test-network', sector: 'animal-tech' }
    const scope = { ...host, jurisdiction: 'ES-MD', binding: randomUUID().replaceAll('-', '').repeat(2) }
    const evidence = { applicationId: 'case-1', reference: 'urn:example:verification', checks: ['legal-identifier-match', 'official-registry-active'] } as const
    await store.change(host, {
      mode: 'automatic-after-verification',
      countries: { kind: 'selected', codes: ['ES'] },
      conditions: ['signed-application-template', 'regional-marketplace-entry'],
    }, 0, 'controller')
    assert.equal((await store.recordDecision(scope, evidence, ['ES', 'CA']))?.decision, 'review')
    const signedOnly = { ...evidence, checks: [...evidence.checks, 'signed-application-template'] } as const
    const directoryOnly = { ...evidence, checks: [...evidence.checks, 'regional-marketplace-entry'] } as const
    assert.equal((await store.recordDecision(scope, signedOnly, ['ES', 'CA']))?.decision, 'review')
    assert.equal((await store.recordDecision(scope, directoryOnly, ['ES', 'CA']))?.decision, 'review')
    const complete = { ...signedOnly, checks: [...signedOnly.checks, 'regional-marketplace-entry'] } as const
    assert.equal((await store.recordDecision({ ...scope, binding: randomUUID().replaceAll('-', '').repeat(2), jurisdiction: 'CA-ON' }, complete, ['ES', 'CA']))?.decision, 'review')
    assert.equal((await store.recordDecision({ ...scope, binding: randomUUID().replaceAll('-', '').repeat(2), jurisdiction: 'CA-ON' }, complete, ['ES']))?.decision, 'review')
    for (const legacyScope of [{ ...host, sector: 'animal-care' }, { ...host, network: 'network' }]) {
      await store.change(legacyScope, {
        mode: 'automatic-after-verification', countries: { kind: 'all' },
        conditions: ['signed-application-template', 'regional-marketplace-entry'],
      }, 0, 'controller')
      const legacy = { ...scope, ...legacyScope, binding: randomUUID().replaceAll('-', '').repeat(2) }
      assert.equal((await store.recordDecision(legacy, complete, ['ES']))?.decision, 'review')
      const earlierApproval = { ...legacy, binding: randomUUID().replaceAll('-', '').repeat(2) }
      await getFirestore(app).collection('hostAdmissionDecisions').doc(earlierApproval.binding).create({
        ...earlierApproval, decision: 'approved', source: 'policy', policyRevision: 1, decisionRevision: 1,
        reference: 'urn:example:legacy-automatic-approval', evidence: complete,
      })
      assert.equal((await store.recordDecision(earlierApproval, complete, ['ES']))?.decision, 'review')
    }
    assert.equal((await store.recordDecision(scope, complete, ['ES']))?.decision, 'approved')
  } finally {
    await deleteApp(app)
  }
})

test('records a scoped reviewer decision once and keeps a proofless admission from advancing', async () => {
  assert.match(process.env.FIRESTORE_EMULATOR_HOST || '', /^127\.0\.0\.1:\d+$/)
  const app = initializeApp({ projectId: 'demo-antifraud-admission' }, 'manual-admission-test')
  try {
    const firestore = getFirestore(app)
    const store = createFirestoreHostAdmissionPolicyStore(firestore)
    const host = { hostDid: `did:web:${randomUUID()}.example`, network: 'test-network', sector: 'animal-care' }
    const scope = { ...host, jurisdiction: 'ES-MD', binding: randomUUID().replaceAll('-', '').repeat(2) }
    const evidence = { applicationId: 'case-manual', reference: 'urn:example:verification', checks: ['legal-identifier-match', 'official-registry-active'] } as const
    await store.recordDecision(scope, undefined, ['ES'])
    const rejectedApproval = await store.reviewDecision(scope, 1, 'approved', 'reviewer')
    assert.equal(rejectedApproval.status, 'verification-required')
    await store.recordDecision(scope, evidence, ['ES'])
    const inbox = await store.listAdmissionDecisions({ ...host, jurisdiction: 'ES-MD' }, 'review')
    assert.deepEqual(inbox.map(record => record.binding), [scope.binding])
    assert.deepEqual(await store.listAdmissionDecisions({ ...host, jurisdiction: 'ES-CL' }, 'review'), [])
    assert.equal((await store.reviewDecision(scope, 1, 'approved', 'reviewer')).status, 'conflict')
    const results = await Promise.all([
      store.reviewDecision(scope, 2, 'approved', 'reviewer'),
      store.reviewDecision(scope, 2, 'rejected', 'other-reviewer'),
    ])
    assert.equal(results.filter(result => result.status === 'saved').length, 1)
    const persisted = await store.recordDecision(scope, evidence, ['ES'])
    assert.ok(persisted && ['approved', 'rejected'].includes(persisted.decision))
    assert.deepEqual(await store.listAdmissionDecisions({ ...host, jurisdiction: 'ES-MD' }, 'review'), [])
    const event = await firestore.collection('hostAdmissionDecisions').doc(scope.binding).collection('history').doc('3').get()
    assert.equal(event.get('source'), 'reviewer')
    assert.equal(event.get('actorUid'), persisted.decision === 'approved' ? 'reviewer' : 'other-reviewer')
  } finally {
    await deleteApp(app)
  }
})
