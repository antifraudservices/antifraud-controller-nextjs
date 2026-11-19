import type { HostAdmissionScope } from '../security/host-admission-authority'
import { ADMISSION_CONDITIONS, supportsAutomaticAdmission, type AdmissionPolicy, type VersionedAdmissionPolicy } from '../config/host-admission-policy'

export type { AdmissionPolicy, VersionedAdmissionPolicy } from '../config/host-admission-policy'

type ScopeResolution = Readonly<{ scope: HostAdmissionScope; allowedCountries: readonly string[] }>

type HostAdmissionPolicyPorts = Readonly<{
  resolveScope(request: Request): ScopeResolution | undefined
  authorize(authorization: string, scope: HostAdmissionScope): Promise<Readonly<{ uid: string }> | undefined>
  read(scope: HostAdmissionScope): Promise<VersionedAdmissionPolicy>
  change(scope: HostAdmissionScope, policy: AdmissionPolicy, revision: number, actorUid: string): Promise<VersionedAdmissionPolicy | undefined>
}>

function parseChange(body: unknown, allowedCountries: readonly string[]): { policy: AdmissionPolicy; revision: number } | undefined {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return undefined
  const value = body as Record<string, unknown>
  if (Object.keys(value).some(key => !['mode', 'revision', 'countries', 'conditions'].includes(key))
    || typeof value.revision !== 'number' || !Number.isSafeInteger(value.revision) || value.revision < 0) return undefined
  const revision = value.revision
  if (value.mode === 'review' && value.countries === undefined && value.conditions === undefined) return { policy: { mode: 'review' }, revision }
  if (value.mode !== 'automatic-after-verification' || !value.countries || typeof value.countries !== 'object' || Array.isArray(value.countries)) return undefined
  if (value.conditions !== undefined && (!Array.isArray(value.conditions) || !value.conditions.length
    || value.conditions.some(condition => typeof condition !== 'string' || !Object.hasOwn(ADMISSION_CONDITIONS, condition)))) return undefined
  const policy = { mode: value.mode, ...(value.conditions ? { conditions: [...new Set(value.conditions)] } : {}) } as const
  const countries = value.countries as Record<string, unknown>
  if (countries.kind === 'all' && Object.keys(countries).length === 1 && allowedCountries.length) {
    return { policy: { ...policy, countries: { kind: 'all' } }, revision }
  }
  if (countries.kind !== 'selected' || Object.keys(countries).length !== 2 || !Array.isArray(countries.codes)
    || !countries.codes.length || countries.codes.some(code => typeof code !== 'string' || !allowedCountries.includes(code))) return undefined
  return {
    policy: { ...policy, countries: { kind: 'selected', codes: [...new Set<string>(countries.codes)].sort() } },
    revision,
  }
}

export async function handleHostAdmissionPolicy(request: Request, ports: HostAdmissionPolicyPorts): Promise<Response> {
  const resolved = ports.resolveScope(request)
  if (!resolved || resolved.scope.network !== 'test-network') return Response.json({ error: 'Test Network scope required.' }, { status: 400 })
  const { scope, allowedCountries } = resolved
  const actor = await ports.authorize(request.headers.get('authorization') || '', scope)
  if (!actor) return Response.json({ error: 'Host controller assignment required.' }, { status: 403 })
  if (request.method === 'GET') {
    return Response.json({ ...scope, allowedCountries, ...await ports.read(scope) }, { headers: { 'cache-control': 'no-store' } })
  }
  if (request.method !== 'PUT') return Response.json({ error: 'Method not allowed.' }, { status: 405 })
  const change = parseChange(await request.json().catch(() => undefined), allowedCountries)
  if (!change || (change.policy.mode === 'automatic-after-verification' && !supportsAutomaticAdmission(scope.network, scope.sector))) {
    return Response.json({ error: 'Invalid admission policy for this sector or country selection.' }, { status: 400 })
  }
  const saved = await ports.change(scope, change.policy, change.revision, actor.uid)
  if (!saved) return Response.json({ error: 'The policy changed. Reload before updating.' }, { status: 409 })
  return Response.json({ ...scope, allowedCountries, ...saved }, { headers: { 'cache-control': 'no-store' } })
}
