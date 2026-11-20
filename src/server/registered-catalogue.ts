import { randomUUID } from 'node:crypto'
import { getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { buildAuthorityDidWeb, buildOrganizationEmployeeDidWeb } from 'antifraud-data-utils-ts/organization-identity'
import { WorkforceClient, WorkforceSubmitError } from 'sos-sdk-node-ts/workforce-client'
import { openRegisteredCommunicationWallet } from 'sos-sdk-node-ts/registered-communication-wallet'
import { resolveRegisteredDidWebKeys } from 'sos-sdk-node-ts/registered-did-keys'
import { createIndividualRegistrationSecureAdapter } from 'sos-sdk-node-ts/individual-registration-client'
import { createAesGcmProfileSealer, createGoogleKmsProfileSealer } from 'sos-sdk-node-ts/profile-sealer'
import { verifyFirebasePhoneSession } from '../security/firebase-phone-session'
import { readPortalEnvironment, resolvePortalDeployment } from '../config/portal-config'

type Profile = Readonly<{
  ownerId: string
  profileId: string
  walletKeyDerivationId: string
  actorDid: string
  providerDid: string
  clientId: string
  tenantIssuer: string
  routeContext: { tenantId: string; jurisdiction: string; sector: string }
  publicJwks: readonly Readonly<Record<string, unknown>>[]
  sealedWalletSeed: string
}>

export function cataloguePhoneConfig(hostname: string) {
  const projectId = process.env.CONTROLLER_CATALOGUE_FIREBASE_PROJECT_ID
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  if (!projectId || projectId !== process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || !apiKey || !authDomain || !appId
    || process.env.CONTROLLER_CATALOGUE_ENABLED !== 'true') return undefined
  const loopbackTest = ['localhost', '127.0.0.1'].includes(hostname)
    && process.env.CONTROLLER_CATALOGUE_LOCAL_TEST === 'true'
    && process.env.NODE_ENV !== 'production'
    && process.env.CONTROLLER_DEPLOYMENT_STAGE !== 'production'
  return { projectId, apiKey, authDomain, appId, loopbackTest }
}

function responseError(status: number, error: string) {
  return Response.json({ error }, { status })
}

export async function handleRegisteredCatalogue(request: Request) {
  const deployment = resolvePortalDeployment(request.headers.get('host') || 'localhost')
  const config = cataloguePhoneConfig(deployment.hostname)
  if (!config || deployment.kind !== 'organization-controller' || !deployment.modules.includes('organization')
    || readPortalEnvironment().active !== 'test-network') return responseError(404, 'Catalogue is unavailable.')

  try {
    const appName = 'registered-controller-catalogue'
    const app = getApps().find(candidate => candidate.name === appName) || initializeApp({ projectId: config.projectId }, appName)
    if (app.options.projectId !== config.projectId || process.env.FIREBASE_AUTH_EMULATOR_HOST) {
      return responseError(503, 'Catalogue identity service is unavailable.')
    }
    const session = await verifyFirebasePhoneSession(request.headers.get('authorization') || '',
      token => getAuth(app).verifyIdToken(token, !config.loopbackTest))
    if (!session) return responseError(401, 'Sign in with your registered phone number.')

    const profile = (config.loopbackTest
      ? JSON.parse(process.env.CONTROLLER_CATALOGUE_LOCAL_PROFILE || 'null')
      : (await getFirestore(app).collection('registeredControllerCatalogueProfiles').doc(session.uid).get()).data()) as Profile | null
    if (profile?.ownerId !== session.uid || !profile.profileId || !profile.walletKeyDerivationId || !profile.clientId || !profile.tenantIssuer) {
      return responseError(403, 'No catalogue profile is registered for this account.')
    }
    const base = new URL(process.env.CONTROLLER_CATALOGUE_GATEWAY_ORIGIN || '')
    const loopbackGateway = config.loopbackTest && ['localhost', '127.0.0.1'].includes(base.hostname)
    if (base.username || base.password || base.pathname !== '/' || base.search || base.hash
      || (base.protocol !== 'https:' && !(loopbackGateway && base.protocol === 'http:'))) {
      return responseError(503, 'Catalogue gateway is unavailable.')
    }
    const ctx = profile.routeContext
    const hostDid = buildAuthorityDidWeb({ authority: base.origin })
    const provider = `${hostDid}:${ctx.tenantId}:cds-${ctx.jurisdiction.toLowerCase()}:v1:${ctx.sector}`
    if (!/^[-a-zA-Z0-9]+$/u.test(ctx.tenantId) || ctx.tenantId === 'host' || !/^[-a-z0-9]+$/u.test(ctx.sector)
      || !deployment.allowedSectors.includes(ctx.sector) || !deployment.allowedJurisdictions.includes(ctx.jurisdiction)
      || profile.providerDid.toLowerCase() !== provider.toLowerCase()
      || profile.actorDid !== buildOrganizationEmployeeDidWeb({
        contactKind: 'phone', contact: session.phone, organizationDidWeb: profile.providerDid, role: 'RESPRSN',
      })) return responseError(403, 'The account is outside the registered tenant scope.')

    const sealer = config.loopbackTest
      ? createAesGcmProfileSealer(Buffer.from(process.env.CONTROLLER_CATALOGUE_LOCAL_SEALER_KEY || '', 'base64url'))
      : createGoogleKmsProfileSealer({ keyName: process.env.CONTROLLER_CATALOGUE_KMS_KEY || '' })
    const unlockedWalletSeed = await sealer.unseal(profile.sealedWalletSeed,
      JSON.stringify([profile.ownerId, profile.profileId, profile.providerDid, profile.actorDid, profile.clientId]))
    const tenantPath = `/${ctx.tenantId}/cds-${ctx.jurisdiction}/v1/${ctx.sector}`
    const keys = await resolveRegisteredDidWebKeys(profile.providerDid, {
      allowLoopbackHttp: loopbackGateway,
      fetchImpl: (_input, init) => fetch(new URL(tenantPath + '/.well-known/did.json', base), init),
    })
    const { wallet, context } = await openRegisteredCommunicationWallet({
      unlockedWalletSeed, walletKeyDerivationId: profile.walletKeyDerivationId, registeredPublicJwks: profile.publicJwks,
      resolveRecipientJwk: async did => {
        if (did !== profile.providerDid) throw new Error('Unexpected catalogue recipient.')
        return { ...keys.keyAgreementJwk }
      },
    })
    const client = new WorkforceClient({
      baseUrl: base.origin, ctx, providerDid: profile.providerDid, gatewayDid: profile.providerDid,
      dcrResponseIssuer: hostDid, issuerDid: profile.actorDid, bearerToken: session.token, clientId: profile.clientId,
      tenantIssuer: profile.tenantIssuer, transportProfile: 'registered-didcomm-encrypted',
      secureTransportAdapter: createIndividualRegistrationSecureAdapter({
        gatewayDid: profile.providerDid,
        pack: message => wallet.packForRecipientWithContext(message, profile.providerDid, { context }),
        decrypt: packed => wallet.unpackWithContext(packed, { context }),
        resolveGatewaySigningJwk: async did => {
          if (did !== profile.providerDid) throw new Error('Unexpected catalogue signer.')
          return keys.signingJwk
        },
      }),
    })
    if (request.method === 'PUT') {
      const raw = await request.text()
      if (Buffer.byteLength(raw) > 1_048_576) return responseError(413, 'The catalogue document is too large.')
      const document = JSON.parse(raw)
      if (!document || !Array.isArray(document.data) || !document.data.length
        || !['Product', 'Service'].includes(document.data[0]?.type)
        || document.data.some((entry: { type?: string } | null) => entry?.type !== document.data[0].type)) {
        return responseError(400, 'Provide a document with a single kind of product or service.')
      }
      await client.publishOfferingBatch({ document, operationId: randomUUID() })
    }
    return Response.json({ offerings: await client.getPublishedOfferings() }, {
      headers: { 'cache-control': 'private, no-store' },
    })
  } catch (error) {
    if (error instanceof SyntaxError) return responseError(400, 'Provide a valid JSON document.')
    if (error instanceof WorkforceSubmitError && error.status >= 400 && error.status < 500) {
      return responseError(error.status, 'The gateway rejected the catalogue update.')
    }
    return responseError(503, 'The catalogue could not be loaded or updated.')
  }
}
