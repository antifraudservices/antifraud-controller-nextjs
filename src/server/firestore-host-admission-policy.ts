import { createHash, randomUUID } from 'node:crypto'
import { FieldPath, FieldValue, type DocumentReference, type Firestore, type Transaction } from 'firebase-admin/firestore'
import { hasVerifiedOrganizationChecks, supportsAutomaticAdmission } from '../config/host-admission-policy'
import type { HostAdmissionScope } from '../security/host-admission-authority'
import type { AdmissionPolicy, VersionedAdmissionPolicy } from './host-admission-policy'
import type { AdmissionDecisionFilter, AdmissionReviewScope, AdmissionReviewItem, ManualAdmissionResult } from './host-admission-review'
import type { AdmissionDecisionRecord, AdmissionDecisionScope, VerifiedAdmissionEvidence } from './gateway-admission-decision'

const INITIAL_POLICY: VersionedAdmissionPolicy = { mode: 'review', revision: 0 }

function allowsAutomaticAdmission(
  scope: AdmissionDecisionScope,
  rule: AdmissionPolicy,
  evidence: VerifiedAdmissionEvidence | undefined,
  eligibleCountries: readonly string[],
): boolean {
  const country = /^([A-Z]{2})(?:-[A-Z0-9]{1,3})?$/.exec(scope.jurisdiction)?.[1]
  if (!country || !eligibleCountries.includes(country) || rule.mode !== 'automatic-after-verification'
    || !evidence || !hasVerifiedOrganizationChecks(evidence.checks)) {
    return false
  }
  return rule.conditions === undefined
    || (rule.conditions.length > 0 && rule.conditions.every(condition => evidence.checks.includes(condition)))
}

function matchesDecisionScope(record: AdmissionReviewItem, scope: AdmissionDecisionScope) {
  return record.hostDid === scope.hostDid && record.network === scope.network && record.jurisdiction === scope.jurisdiction
    && record.sector === scope.sector && record.binding === scope.binding
}

function saveDecision(transaction: Transaction, document: DocumentReference, record: AdmissionReviewItem, actorUid?: string) {
  const saved: AdmissionReviewItem = { ...record, source: actorUid ? 'reviewer' : 'policy' }
  transaction.set(document, saved)
  transaction.create(document.collection('history').doc(String(record.decisionRevision)), {
    ...saved, ...(actorUid ? { actorUid } : {}), decidedAt: FieldValue.serverTimestamp(),
  })
  return saved
}

function reviewItem(record: AdmissionReviewItem): AdmissionReviewItem {
  const { hostDid, network, sector, jurisdiction, binding, decision, reference, decisionRevision, policyRevision, evidence, applicationId, source, policySnapshot } = record
  return {
    hostDid, network, sector, jurisdiction, binding, decision, reference, decisionRevision, policyRevision,
    ...(applicationId ? { applicationId } : {}), ...(evidence ? { evidence } : {}), ...(source ? { source } : {}),
    ...(policySnapshot ? { policySnapshot } : {}),
  }
}

export function createFirestoreHostAdmissionPolicyStore(firestore: Firestore) {
  const decisions = firestore.collection('hostAdmissionDecisions')
  function policyDocument(scope: HostAdmissionScope) {
    const id = createHash('sha256').update(JSON.stringify([scope.hostDid, scope.network, scope.sector])).digest('hex')
    return firestore.collection('hostAdmissionPolicies').doc(id)
  }

  return {
    async read(scope: HostAdmissionScope): Promise<VersionedAdmissionPolicy> {
      const record = (await policyDocument(scope).get()).data()
      return record ? record.policy as VersionedAdmissionPolicy : INITIAL_POLICY
    },
    async change(scope: HostAdmissionScope, policy: AdmissionPolicy, revision: number, actorUid: string): Promise<VersionedAdmissionPolicy | undefined> {
      const document = policyDocument(scope)
      return firestore.runTransaction(async transaction => {
        const record = (await transaction.get(document)).data()
        const previous = record ? record.policy as VersionedAdmissionPolicy : INITIAL_POLICY
        if (previous.revision !== revision) return undefined
        const updated = { ...policy, revision: revision + 1 }
        transaction.set(document, { ...scope, policy: updated })
        transaction.create(document.collection('changes').doc(String(updated.revision)), {
          previous, updated, actorUid, changedAt: FieldValue.serverTimestamp(),
        })
        return updated
      })
    },
    async recordDecision(scope: AdmissionDecisionScope, evidence: VerifiedAdmissionEvidence | undefined, allowedCountries: readonly string[]): Promise<AdmissionDecisionRecord | undefined> {
      const decisionDocument = decisions.doc(scope.binding)
      const policy = policyDocument(scope)
      return firestore.runTransaction(async transaction => {
        const decisionSnapshot = await transaction.get(decisionDocument)
        const prior = decisionSnapshot.data() as AdmissionReviewItem | undefined
        if (prior && !matchesDecisionScope(prior, scope)) return undefined
        const originalApplicationId = prior?.applicationId ?? prior?.evidence?.applicationId
        const receivedApplicationId = scope.applicationId ?? evidence?.applicationId
        if (originalApplicationId && receivedApplicationId && originalApplicationId !== receivedApplicationId) return undefined
        const applicationId = receivedApplicationId ?? originalApplicationId
        if (prior?.decision === 'rejected') return prior
        const automaticScope = supportsAutomaticAdmission(scope.network, scope.sector)
        if (prior?.decision === 'approved') {
          const source = prior.source ?? (automaticScope ? undefined
            : (await transaction.get(decisionDocument.collection('history').doc(String(prior.decisionRevision)))).get('source'))
          if (automaticScope || source === 'reviewer') {
            const original = prior.evidence
            if (!original || !evidence || original.applicationId !== evidence.applicationId
              || original.reference !== evidence.reference
              || !original.checks.every(check => evidence.checks.includes(check))) return undefined
            return prior
          }
        }

        const storedPolicy = (await transaction.get(policy)).data()?.policy as VersionedAdmissionPolicy | undefined
        const current = storedPolicy ?? INITIAL_POLICY
        const eligibleCountries = automaticScope && current.mode === 'automatic-after-verification'
          ? [...new Set(allowedCountries)].filter(code => current.countries.kind === 'all' || current.countries.codes.includes(code)).sort()
          : []
        const decision = allowsAutomaticAdmission(scope, current, evidence, eligibleCountries) ? 'approved' : 'review'
        if (prior?.decision === decision && prior.policyRevision === current.revision
          && JSON.stringify(prior.policySnapshot?.eligibleCountries) === JSON.stringify(eligibleCountries)
          && prior.applicationId === applicationId
          && JSON.stringify(prior.evidence) === JSON.stringify(evidence)) return prior

        const decisionRevision = (prior?.decisionRevision ?? 0) + 1
        const updated: AdmissionReviewItem = {
          ...scope, decision, reference: `urn:uuid:${randomUUID()}`, decisionRevision,
          policyRevision: current.revision, policySnapshot: { policy: current, eligibleCountries },
          ...(applicationId ? { applicationId } : {}), ...(evidence ? { evidence } : {}),
        }
        return saveDecision(transaction, decisionDocument, updated)
      })
    },
    async listAdmissionDecisions(scope: AdmissionReviewScope, decision: AdmissionDecisionFilter, cursor?: string): Promise<AdmissionReviewItem[]> {
      const query = decisions
        .where('hostDid', '==', scope.hostDid)
        .where('network', '==', scope.network)
        .where('sector', '==', scope.sector)
        .where('jurisdiction', '==', scope.jurisdiction)
        .where('decision', '==', decision).orderBy(FieldPath.documentId())
      const snapshot = await (cursor ? query.startAfter(cursor) : query).limit(50).get()
      return snapshot.docs.map(document => reviewItem(document.data() as AdmissionReviewItem))
    },
    async reviewDecision(scope: AdmissionDecisionScope, revision: number, decision: 'approved' | 'rejected', actorUid: string): Promise<ManualAdmissionResult> {
      const document = decisions.doc(scope.binding)
      return firestore.runTransaction(async transaction => {
        const current = (await transaction.get(document)).data() as AdmissionReviewItem | undefined
        if (!current || !matchesDecisionScope(current, scope)) return { status: 'not-found' }
        if (current.decision !== 'review' || current.decisionRevision !== revision) return { status: 'conflict' }
        if (decision === 'approved' && !hasVerifiedOrganizationChecks(current.evidence?.checks)) return { status: 'verification-required' }
        const next: AdmissionReviewItem = {
          ...scope, decision, decisionRevision: revision + 1, reference: `urn:uuid:${randomUUID()}`,
          policyRevision: current.policyRevision,
          ...(current.policySnapshot ? { policySnapshot: current.policySnapshot } : {}),
          ...(current.applicationId ? { applicationId: current.applicationId } : {}),
          ...(current.evidence ? { evidence: current.evidence } : {}),
        }
        return { status: 'saved', record: reviewItem(saveDecision(transaction, document, next, actorUid)) }
      })
    },
  }
}
