import { createHash } from 'node:crypto'
import { FieldValue, type Firestore } from 'firebase-admin/firestore'
import type { HostAdmissionScope } from '../security/host-admission-authority'
import { INITIAL_CATALOGUE_PUBLICATION_POLICY, type CataloguePublicationPolicy } from './host-catalogue-publication-policy'

/** Admin-only data store shared by the host policy editor and the publisher BFF. */
export function createFirestoreHostCataloguePublicationPolicyStore(firestore: Firestore) {
  function policyDocument(scope: HostAdmissionScope) {
    const id = createHash('sha256').update(JSON.stringify([scope.hostDid, scope.network, scope.sector])).digest('hex')
    return firestore.collection('hostCataloguePublicationPolicies').doc(id)
  }

  function readPolicy(data: FirebaseFirestore.DocumentData | undefined): CataloguePublicationPolicy {
    if (!data) return INITIAL_CATALOGUE_PUBLICATION_POLICY
    const { allowTenantPublication, revision } = data
    if (typeof allowTenantPublication !== 'boolean' || !Number.isSafeInteger(revision) || revision < 1) {
      throw new Error('Stored catalogue publication policy is invalid.')
    }
    return { allowTenantPublication, revision }
  }

  return {
    async read(scope: HostAdmissionScope): Promise<CataloguePublicationPolicy> {
      return readPolicy((await policyDocument(scope).get()).data())
    },
    async change(scope: HostAdmissionScope, allowTenantPublication: boolean, revision: number, actorUid: string) {
      const document = policyDocument(scope)
      return firestore.runTransaction(async transaction => {
        const previous = readPolicy((await transaction.get(document)).data())
        if (previous.revision !== revision) return undefined
        const updated = { allowTenantPublication, revision: revision + 1 }
        transaction.set(document, { ...scope, ...updated })
        transaction.create(document.collection('changes').doc(String(updated.revision)), {
          previous, updated, actorUid, changedAt: FieldValue.serverTimestamp(),
        })
        return updated
      })
    },
  }
}
