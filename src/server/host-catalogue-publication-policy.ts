import type { HostAdmissionScope } from '../security/host-admission-authority'

export type CataloguePublicationPolicy = Readonly<{ allowTenantPublication: boolean; revision: number }>

export const INITIAL_CATALOGUE_PUBLICATION_POLICY: CataloguePublicationPolicy = {
  allowTenantPublication: false,
  revision: 0,
}

type Ports = Readonly<{
  resolveScope(request: Request): HostAdmissionScope | undefined
  authorize(authorization: string, scope: HostAdmissionScope): Promise<Readonly<{ uid: string }> | undefined>
  read(scope: HostAdmissionScope): Promise<CataloguePublicationPolicy>
  change(scope: HostAdmissionScope, allowed: boolean, revision: number, actorUid: string): Promise<CataloguePublicationPolicy | undefined>
}>

function isPolicy(value: unknown): value is CataloguePublicationPolicy {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const { allowTenantPublication, revision } = value as Record<string, unknown>
  return Object.keys(value).length === 2 && typeof allowTenantPublication === 'boolean'
    && typeof revision === 'number' && Number.isSafeInteger(revision) && revision >= 0
}

export async function handleHostCataloguePublicationPolicy(request: Request, ports: Ports): Promise<Response> {
  const scope = ports.resolveScope(request)
  if (!scope) return Response.json({ error: 'Catalogue publication settings are unavailable.' }, { status: 404 })
  const actor = await ports.authorize(request.headers.get('authorization') || '', scope)
  if (!actor) return Response.json({ error: 'Host controller assignment required.' }, { status: 403 })
  const headers = { 'cache-control': 'no-store' }
  if (request.method === 'GET') return Response.json(await ports.read(scope), { headers })
  if (request.method !== 'PUT') return Response.json({ error: 'Method not allowed.' }, { status: 405 })
  const change: unknown = await request.json().catch(() => undefined)
  if (!isPolicy(change)) return Response.json({ error: 'Invalid catalogue publication policy.' }, { status: 400 })
  const saved = await ports.change(scope, change.allowTenantPublication, change.revision, actor.uid)
  return saved
    ? Response.json(saved, { headers })
    : Response.json({ error: 'The policy changed. Reload before updating.' }, { status: 409 })
}
