'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ControllerWorkspace as ControllerWorkspaceState } from 'antifraud-sdk-node-ts'
import { OrganizationWorkforceAdministration, type OrganizationWorkforceCopy, type WorkforceEmployee, type WorkforceInvitation } from 'antifraud-hosting-components-react'
import { EmployeeMembershipDirectory, OrganizationStructureAdministration, type EmployeeOrganizationMembership, type OperationalGroup, type OperationalGroupTemplate, type OrganizationDepartment } from './OrganizationStructureAdministration'
import { EvidenceAdministration } from './EvidenceAdministration'
import { ClearingHouseAdministration } from './ClearingHouseAdministration'
import { ClientServiceAdministration, PlaceAdministration, type OrganizationClientService, type OrganizationPlace } from './OrganizationCatalogAdministration'
import type { PortalModule } from '../config/portal-config'
import type { EmployeeRoleOption } from '../server/professional-role-policy'
import type { OrganizationGroupTemplateOption } from '../server/organization-group-policy'

type WorkspaceView = 'home' | 'organization' | 'members' | 'departments' | 'groups' | 'places' | 'services' | 'evidence' | 'clearing-house'

const WORKFORCE_COPY: OrganizationWorkforceCopy = Object.freeze({
  title: 'Members and devices', description: 'Manage licences, invitations, members and their registered devices.', totalLicenses: 'Licences', usedLicenses: 'Assigned', freeLicenses: 'Free', employeesTitle: 'Members and registered devices', invitationsTitle: 'Pending and completed invitations', inviteTitle: 'Invite a member', emailLabel: 'Email', roleLabel: 'Administrative role', unlockSecretLabel: 'Controller PIN', invite: 'Create invitation', inviting: 'Creating…', noFreeLicenses: 'No free licences are available.', noEmployees: 'No members are registered.', noInvitations: 'No invitations have been issued.', licenseColumn: 'Licence', employeeColumn: 'Member', roleColumn: 'Assignment', statusColumn: 'Status', devicesColumn: 'Devices', actionsColumn: 'Actions', active: 'Active', inactive: 'Inactive', pending: 'Pending', accepted: 'Accepted', cancelled: 'Cancelled', disable: 'Suspend member', reactivate: 'Reactivate member', purge: 'Purge and release licence', confirmDisable: 'Suspend this member? Their licence and identity will be retained.', confirmReactivate: 'Reactivate this member?', confirmPurge: 'Purge this member permanently and release their licence?', devicesLater: 'Not reported',
})

const workspaceCards: readonly Readonly<{ view: WorkspaceView; module: PortalModule; title: string; description: string }>[] = Object.freeze([
  { view: 'organization', module: 'organization', title: 'Organization information', description: 'Review the authenticated organization and its authoritative administration state.' },
  { view: 'members', module: 'workforce', title: 'Members and devices', description: 'Manage licences, invitations, members and registered devices.' },
  { view: 'departments', module: 'structure', title: 'Departments', description: 'Maintain the organization structure used by employees, Places and client services.' },
  { view: 'groups', module: 'structure', title: 'Employee groups', description: 'Assign reusable, narrowly scoped operational capabilities.' },
  { view: 'places', module: 'structure', title: 'Places', description: 'Manage Schema.org Places and choose which ones are public.' },
  { view: 'services', module: 'structure', title: 'Client services', description: 'Manage offered Schema.org Services and their public catalog visibility.' },
  { view: 'evidence', module: 'evidence', title: 'Identity and qualification evidence', description: 'Record employee identity checks, age-over predicates and qualification evidence.' },
  { view: 'clearing-house', module: 'clearing-house', title: 'Clearing House', description: 'Review evidence references addressed to this organization and record a decision.' },
])

async function readWorkspace(): Promise<ControllerWorkspaceState> {
  const response = await fetch('/api/controller/workspace', { cache: 'no-store' })
  const payload = await response.json() as ControllerWorkspaceState & { error?: string }
  if (!response.ok) throw new Error(payload.error ?? 'Controller workspace could not be loaded.')
  return payload
}

async function submitAction(action: object): Promise<ControllerWorkspaceState> {
  const response = await fetch('/api/controller/actions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(action) })
  const payload = await response.json() as ControllerWorkspaceState & { error?: string }
  if (!response.ok) throw new Error(payload.error ?? 'Controller action failed.')
  return payload
}

function InformationalPanel({ title, children }: Readonly<{ title: string; children: React.ReactNode }>) {
  return <section className="reused-panel"><h2>{title}</h2>{children}</section>
}

function InvitationAssignments({ groups, departments, groupReferences, departmentReferences, onGroupsChange, onDepartmentsChange }: Readonly<{
  groups: readonly OperationalGroup[]; departments: readonly OrganizationDepartment[]; groupReferences: readonly string[]; departmentReferences: readonly string[]
  onGroupsChange(value: readonly string[]): void; onDepartmentsChange(value: readonly string[]): void
}>) {
  return <section className="membership-directory" aria-labelledby="invitation-assignments-title"><header><div><h2 id="invitation-assignments-title">Initial invitation assignments</h2><p>Optionally choose the groups and departments proposed in the next invitation.</p></div></header><div className="membership-options"><fieldset><legend>Groups</legend>{groups.map(group => <label key={group.id}><input type="checkbox" checked={groupReferences.includes(group.id)} onChange={event => onGroupsChange(changeSet(groupReferences, group.id, event.currentTarget.checked))}/><span>{group.name}</span></label>)}</fieldset><fieldset><legend>Departments</legend>{departments.map(department => <label key={department.id}><input type="checkbox" checked={departmentReferences.includes(department.id)} onChange={event => onDepartmentsChange(changeSet(departmentReferences, department.id, event.currentTarget.checked))}/><span>{department.name}</span></label>)}</fieldset></div></section>
}

export function ControllerWorkspace({ portalName, organizationName, modules, employeeRoles, groupTemplates }: Readonly<{
  portalName: string
  organizationName: string
  modules?: readonly PortalModule[]
  employeeRoles?: readonly EmployeeRoleOption[]
  groupTemplates?: readonly OrganizationGroupTemplateOption[]
}>) {
  const [view, setView] = useState<WorkspaceView>('home')
  const [workspace, setWorkspace] = useState<ControllerWorkspaceState>()
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [unlockSecret, setUnlockSecret] = useState('')
  const [inviteGroupReferences, setInviteGroupReferences] = useState<readonly string[]>([])
  const [inviteDepartmentReferences, setInviteDepartmentReferences] = useState<readonly string[]>([])

  const load = useCallback(() => {
    setError(undefined)
    void readWorkspace().then(setWorkspace).catch(reason => setError(reason instanceof Error ? reason.message : 'Controller workspace could not be loaded.'))
  }, [])
  useEffect(load, [load])

  const mutate = useCallback((action: object) => {
    setBusy(true); setError(undefined)
    return submitAction(action).then(setWorkspace).catch(reason => setError(reason instanceof Error ? reason.message : 'Controller action failed.')).finally(() => setBusy(false))
  }, [])

  const employees = useMemo<readonly WorkforceEmployee[]>(() => (workspace?.employees ?? []).map(employee => ({ id: employee.reference, licenseId: employee.licenceReference, email: employee.email, role: employee.role, status: employee.status, deviceCount: employee.deviceReferences.length })), [workspace])
  const invitations = useMemo<readonly WorkforceInvitation[]>(() => (workspace?.invitations ?? []).map(invitation => ({ id: invitation.reference, email: invitation.email, role: invitation.role, status: invitation.status as WorkforceInvitation['status'] })), [workspace])
  const groups = useMemo<readonly OperationalGroup[]>(() => (workspace?.groups ?? []).map(group => ({ id: group.reference, name: group.name, template: templateFor(group.capabilities), capabilities: group.capabilities, authorizationReference: group.authorizationReference })), [workspace])
  const departments = useMemo<readonly OrganizationDepartment[]>(() => (workspace?.departments ?? []).map(department => ({ id: department.reference, name: department.name })), [workspace])
  const memberships = useMemo<readonly EmployeeOrganizationMembership[]>(() => (workspace?.employees ?? []).map(employee => ({ employeeId: employee.reference, groupIds: employee.groupReferences, departmentIds: employee.departmentReferences })), [workspace])
  const places = useMemo<readonly OrganizationPlace[]>(() => (workspace?.places ?? []).map(place => ({ id: place.reference, name: place.name, departmentId: place.departmentReference, ...(place.containedInPlaceReference ? { containedInPlaceId: place.containedInPlaceReference } : {}), ...(place.geo ? { geo: place.geo } : {}), publishInCatalog: place.publishInCatalog })), [workspace])
  const services = useMemo<readonly OrganizationClientService[]>(() => (workspace?.services ?? []).map(service => ({ id: service.reference, name: service.name, ...(service.description ? { description: service.description } : {}), serviceType: service.serviceType, departmentId: service.departmentReference, placeIds: service.placeReferences, publishInCatalog: service.publishInCatalog })), [workspace])

  function open(next: WorkspaceView): void { setView(next); window.scrollTo({ top: 0 }) }
  function invite(): void { void mutate({ type: 'create-invitation', email: email.trim(), role, groupReferences: inviteGroupReferences, departmentReferences: inviteDepartmentReferences }).then(() => { setEmail(''); setRole(''); setUnlockSecret(''); setInviteGroupReferences([]); setInviteDepartmentReferences([]) }) }
  function changeMembership(employeeId: string, kind: 'group' | 'department', membershipId: string, enabled: boolean): void {
    const current = memberships.find(item => item.employeeId === employeeId) ?? { employeeId, groupIds: [], departmentIds: [] }
    void mutate({ type: 'set-memberships', employeeReference: employeeId, groupReferences: kind === 'group' ? changeSet(current.groupIds, membershipId, enabled) : current.groupIds, departmentReferences: kind === 'department' ? changeSet(current.departmentIds, membershipId, enabled) : current.departmentIds })
  }
  function createGroup(name: string, template: OperationalGroupTemplate): void { void mutate({ type: 'create-group', name, template }) }
  function createDepartment(name: string): void { void mutate({ type: 'create-department', name }) }
  function createPlace(input: Readonly<{ name: string; departmentReference: string; geo?: Readonly<{ latitude: number; longitude: number }> }>): void { void mutate({ type: 'create-place', ...input }) }
  function createClientService(input: Readonly<{ name: string; description?: string; serviceType: string; departmentReference: string; placeReferences: readonly string[] }>): void { void mutate({ type: 'create-client-service', ...input }) }

  const displayedOrganization = workspace?.organization.displayName || organizationName
  const enabledModules = modules ?? workspaceCards.map(item => item.module)
  const enabledCards = workspaceCards.filter(card => enabledModules.includes(card.module))
  const roleOptions = employeeRoles ?? [{ value: 'organization-manager', label: 'Organization manager' }, { value: 'evidence-reviewer', label: 'Evidence reviewer' }, { value: 'audit-viewer', label: 'Audit viewer' }]
  return <div className="controller-workspace" data-reuse-source="antifraud-hosting-components-react@1">
    <header className="controller-header"><button type="button" className="controller-brand" onClick={() => open('home')} aria-label={`${portalName} home`}><span className="controller-mark" aria-hidden="true">◇</span><span><strong>{portalName}</strong><small>Organization controller</small></span></button><div className="controller-context"><small>Active organization</small><strong>{displayedOrganization}</strong></div><button type="button" className="controller-account">Controller session</button></header>
    <nav className="controller-nav" aria-label="Controller workspace"><button type="button" aria-current={view === 'home' ? 'page' : undefined} onClick={() => open('home')}>Home</button>{enabledCards.map(card => <button type="button" key={card.view} aria-current={view === card.view ? 'page' : undefined} onClick={() => open(card.view)}>{card.title}</button>)}</nav>
    <main className="controller-main">
      <div className="controller-demo-note" role="status"><strong>Authenticated controller workspace</strong><span>{busy ? 'Saving authoritative state…' : 'Organization authority is resolved by the backend and every mutation is reloaded from the gateway.'}</span></div>
      {error ? <p role="alert">{error}</p> : null}
      {view === 'home' ? <><section className="controller-welcome"><span>Organization controller</span><h1>{displayedOrganization}</h1><p>Choose an administrative workspace.</p></section><section className="controller-card-grid" aria-label="Controller capabilities">{enabledCards.map(card => <button type="button" className="controller-card" key={card.view} onClick={() => open(card.view)}><span aria-hidden="true">→</span><strong>{card.title}</strong><small>{card.description}</small></button>)}</section></> : <>
        <button type="button" className="workspace-back" onClick={() => open('home')}>← Back to controller home</button>
        {view === 'members' ? <div className="shared-workforce-wrapper"><section className="current-controller-summary" aria-label="Current controller"><span><strong>Authenticated controller</strong><small>Protected controller reservation</small></span><span>Managed by trusted backend state</span></section><InvitationAssignments groups={groups} departments={departments} groupReferences={inviteGroupReferences} departmentReferences={inviteDepartmentReferences} onGroupsChange={setInviteGroupReferences} onDepartmentsChange={setInviteDepartmentReferences}/><OrganizationWorkforceAdministration copy={WORKFORCE_COPY} summary={workspace ? { total: workspace.licences.total, used: workspace.licences.assigned, free: workspace.licences.free } : { total: 0, used: 0, free: 0 }} employees={employees} invitations={invitations} roles={roleOptions} email={email} role={role} unlockSecret={unlockSecret} onEmailChange={setEmail} onRoleChange={setRole} onUnlockSecretChange={setUnlockSecret} onInvite={invite} onDisable={id => { void mutate({ type: 'set-status', employeeReference: id, status: 'inactive' }) }} onReactivate={id => { void mutate({ type: 'set-status', employeeReference: id, status: 'active' }) }} onPurge={id => { void mutate({ type: 'purge-employee', employeeReference: id }) }} /><EmployeeMembershipDirectory employees={employees} groups={groups} departments={departments} memberships={memberships} onMembershipChange={changeMembership} /></div> : null}
        {view === 'organization' ? <InformationalPanel title="Organization information"><p>This state is read from the authenticated gateway organization.</p><dl className="controller-facts"><div><dt>Organization</dt><dd>{displayedOrganization}</dd></div><div><dt>Reference</dt><dd>{workspace?.organization.reference ?? 'Loading…'}</dd></div><div><dt>Employees</dt><dd>{employees.length}</dd></div><div><dt>Notifications</dt><dd>{workspace?.notifications.length ?? 0}</dd></div></dl></InformationalPanel> : null}
        {view === 'departments' ? <OrganizationStructureAdministration mode="departments" employees={employees} groups={groups} departments={departments} memberships={memberships} groupTemplates={groupTemplates} onCreateGroup={createGroup} onCreateDepartment={createDepartment} onMembershipChange={changeMembership} /> : null}
        {view === 'groups' ? <OrganizationStructureAdministration mode="groups" employees={employees} groups={groups} departments={departments} memberships={memberships} groupTemplates={groupTemplates} onCreateGroup={createGroup} onCreateDepartment={createDepartment} onMembershipChange={changeMembership} /> : null}
        {view === 'places' ? <PlaceAdministration departments={departments} places={places} onCreate={createPlace} onPublicationChange={(placeReference, publishInCatalog) => { void mutate({ type: 'set-place-catalog-publication', placeReference, publishInCatalog }) }} /> : null}
        {view === 'services' ? <ClientServiceAdministration departments={departments} places={places} services={services} onCreate={createClientService} onPublicationChange={(serviceReference, publishInCatalog) => { void mutate({ type: 'set-client-service-catalog-publication', serviceReference, publishInCatalog }) }} /> : null}
        {view === 'evidence' ? <EvidenceAdministration employees={workspace?.employees ?? []} /> : null}
        {view === 'clearing-house' ? <ClearingHouseAdministration /> : null}
      </>}
    </main>
  </div>
}

function templateFor(capabilities: readonly string[]): OperationalGroupTemplate {
  if (capabilities.includes('identity.evidence.record')) return 'identity-evidence-administration'
  if (capabilities.includes('qualification-evidence:create')) return 'qualification-evidence-administration'
  if (capabilities.includes('qualification-inbox:list')) return 'clearing-house-review'
  if (capabilities.some(capability => capability.startsWith('organization/Subject.c?organization=Organization/'))) return 'subject-registration'
  if (capabilities.includes('organization/Schedule.cruds')) return 'scheduling-operations'
  if (capabilities.includes('organization/Encounter.cruds')) return 'encounter-operations'
  if (capabilities.includes('Subject/Composition.cuds')) return 'clinical-contribution'
  if (capabilities.includes('organization/CommunicationRequest.c')) return 'public-communication-request-publishing'
  return 'custom'
}

function changeSet(values: readonly string[], value: string, enabled: boolean): readonly string[] {
  return enabled ? [...new Set([...values, value])] : values.filter(item => item !== value)
}
