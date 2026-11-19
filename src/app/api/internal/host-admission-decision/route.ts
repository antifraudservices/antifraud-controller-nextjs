import { getFirestore } from 'firebase-admin/firestore'
import { readPortalEnvironment, resolvePortalDeployment } from '../../../../config/portal-config'
import { handleGatewayAdmissionDecision } from '../../../../server/gateway-admission-decision'
import { createFirestoreHostAdmissionPolicyStore } from '../../../../server/firestore-host-admission-policy'
import { getConfiguredAdmissionHostDid, getEnabledAdmissionCountries, getHostAdmissionFirebaseApp } from '../../../../server/host-admission-runtime'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const hostDid = getConfiguredAdmissionHostDid()
    const bearer = process.env.ANTIFRAUD_ADMISSION_GATEWAY_BEARER?.trim()
    const network = process.env.SOS_GATEWAY_HOST_NETWORK
    const policyHostname = process.env.ANTIFRAUD_ADMISSION_POLICY_HOSTNAME?.trim()
    if (!hostDid || !bearer || !policyHostname || network !== 'test-network' || readPortalEnvironment().active !== network) {
      return Response.json({ error: 'Admission decision service is unavailable.' }, { status: 503 })
    }
    const deployment = resolvePortalDeployment(policyHostname)
    if (deployment.kind !== 'host-controller' || !deployment.modules.includes('host-organizations')) {
      return Response.json({ error: 'Admission decision service is unavailable.' }, { status: 503 })
    }
    const firestore = getFirestore(getHostAdmissionFirebaseApp())
    const store = createFirestoreHostAdmissionPolicyStore(firestore)
    const countries = getEnabledAdmissionCountries(deployment.allowedJurisdictions)
    return await handleGatewayAdmissionDecision(
      request, { hostDid, network, bearer },
      (scope, evidence) => deployment.allowedSectors.includes(scope.sector)
        && (deployment.allowedJurisdictions.includes(scope.jurisdiction) || deployment.allowedJurisdictions.includes(scope.jurisdiction.slice(0, 2)))
        ? store.recordDecision(scope, evidence, countries)
        : Promise.resolve(undefined),
    )
  } catch {
    return Response.json({ error: 'Admission decision service is unavailable.' }, { status: 503 })
  }
}
