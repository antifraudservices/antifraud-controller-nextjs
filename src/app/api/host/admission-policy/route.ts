import { getFirestore } from 'firebase-admin/firestore'
import { handleHostAdmissionPolicy } from '../../../../server/host-admission-policy'
import { createFirestoreHostAdmissionPolicyStore } from '../../../../server/firestore-host-admission-policy'
import { createHostAdmissionSessionAuthorizer, getEnabledAdmissionCountries, getHostAdmissionFirebaseApp, resolveHostAdmissionRequest } from '../../../../server/host-admission-runtime'

export const runtime = 'nodejs'

function resolveScope(request: Request) {
  const context = resolveHostAdmissionRequest(request)
  return context && { scope: context.scope, allowedCountries: getEnabledAdmissionCountries(context.allowedJurisdictions) }
}

async function handle(request: Request) {
  try {
    const app = getHostAdmissionFirebaseApp()
    const store = createFirestoreHostAdmissionPolicyStore(getFirestore(app))
    return await handleHostAdmissionPolicy(request, {
      resolveScope,
      authorize: createHostAdmissionSessionAuthorizer(app),
      ...store,
    })
  } catch {
    return Response.json({ error: 'Admission policy service is unavailable.' }, { status: 503 })
  }
}

export { handle as GET, handle as PUT }
