import { getFirestore } from 'firebase-admin/firestore'
import { createFirestoreHostAdmissionPolicyStore } from '../../../../server/firestore-host-admission-policy'
import { handleHostAdmissionReview } from '../../../../server/host-admission-review'
import { createHostAdmissionSessionAuthorizer, getHostAdmissionFirebaseApp, resolveHostAdmissionRequest } from '../../../../server/host-admission-runtime'

export const runtime = 'nodejs'

function resolveScope(request: Request) {
  const context = resolveHostAdmissionRequest(request)
  const jurisdiction = new URL(request.url).searchParams.get('jurisdiction')
  if (!context || !jurisdiction || !/^[A-Z]{2}(?:-[A-Z0-9]{1,3})?$/.test(jurisdiction)) return undefined
  if (!context.allowedJurisdictions.includes(jurisdiction) && !context.allowedJurisdictions.includes(jurisdiction.slice(0, 2))) return undefined
  return { ...context.scope, jurisdiction }
}

async function handle(request: Request) {
  try {
    const app = getHostAdmissionFirebaseApp()
    return await handleHostAdmissionReview(request, {
      resolveScope,
      authorize: createHostAdmissionSessionAuthorizer(app),
      ...createFirestoreHostAdmissionPolicyStore(getFirestore(app)),
    })
  } catch {
    return Response.json({ error: 'Admission review service is unavailable.' }, { status: 503 })
  }
}

export { handle as GET, handle as POST }
