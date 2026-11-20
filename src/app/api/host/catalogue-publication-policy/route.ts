import { getFirestore } from 'firebase-admin/firestore'
import { createFirestoreHostCataloguePublicationPolicyStore } from '../../../../server/firestore-host-catalogue-publication-policy'
import { handleHostCataloguePublicationPolicy } from '../../../../server/host-catalogue-publication-policy'
import {
  createHostAdmissionSessionAuthorizer, getHostAdmissionFirebaseApp, resolveHostAdmissionRequest,
} from '../../../../server/host-admission-runtime'

export const runtime = 'nodejs'

async function handle(request: Request) {
  const scope = process.env.PONTUS_X_PUBLICATION_ENABLED === 'true'
    ? resolveHostAdmissionRequest(request)?.scope : undefined
  if (!scope) return Response.json({ error: 'Catalogue publication settings are unavailable.' }, { status: 404 })
  try {
    const app = getHostAdmissionFirebaseApp()
    const store = createFirestoreHostCataloguePublicationPolicyStore(getFirestore(app))
    return await handleHostCataloguePublicationPolicy(request, {
      resolveScope: () => scope,
      authorize: createHostAdmissionSessionAuthorizer(app),
      ...store,
    })
  } catch {
    return Response.json({ error: 'Catalogue publication settings are unavailable.' }, { status: 503 })
  }
}

export { handle as GET, handle as PUT }
