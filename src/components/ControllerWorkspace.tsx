'use client'

import { useState } from 'react'
import {
  OrganizationWorkforceAdministration,
  type OrganizationWorkforceCopy,
  type WorkforceEmployee,
  type WorkforceInvitation,
} from 'antifraud-portal-components-react'
import {
  EmployeeMembershipDirectory,
  OrganizationStructureAdministration,
  type EmployeeOrganizationMembership,
  type OperationalGroup,
  type OperationalGroupTemplate,
  type OrganizationDepartment,
} from './OrganizationStructureAdministration'
import { EvidenceAdministration } from './EvidenceAdministration'

type WorkspaceView = 'home' | 'organization' | 'members' | 'structure' | 'evidence'

const WORKFORCE_COPY: OrganizationWorkforceCopy = Object.freeze({
  title: 'Members and devices',
  description: 'Manage licences, invitations, members and their registered devices.',
  totalLicenses: 'Licences',
  usedLicenses: 'Assigned',
  freeLicenses: 'Free',
  employeesTitle: 'Members and registered devices',
  invitationsTitle: 'Pending and completed invitations',
  inviteTitle: 'Invite a member',
  emailLabel: 'Email',
  roleLabel: 'Administrative role',
  unlockSecretLabel: 'Controller PIN',
  invite: 'Create invitation',
  inviting: 'Creating…',
  noFreeLicenses: 'No free licences are available.',
  noEmployees: 'No members are registered.',
  noInvitations: 'No invitations have been issued.',
  licenseColumn: 'Licence',
  employeeColumn: 'Member',
  roleColumn: 'Assignment',
  statusColumn: 'Status',
  devicesColumn: 'Devices',
  actionsColumn: 'Actions',
  active: 'Active',
  inactive: 'Inactive',
  pending: 'Pending',
  accepted: 'Accepted',
  cancelled: 'Cancelled',
  disable: 'Suspend member',
  reactivate: 'Reactivate member',
  purge: 'Purge and release licence',
  confirmDisable: 'Suspend this member? Their licence and identity will be retained.',
  confirmReactivate: 'Reactivate this member?',
  confirmPurge: 'Purge this member permanently and release their licence?',
  devicesLater: 'Not reported',
})

const INITIAL_EMPLOYEES: readonly WorkforceEmployee[] = Object.freeze([
  { id: 'member-1', licenseId: 'licence-1', email: 'service.manager@example.invalid', role: 'Service manager', status: 'active', deviceCount: 1 },
  { id: 'member-2', licenseId: 'licence-2', email: 'member.manager@example.invalid', role: 'Member manager', status: 'inactive', deviceCount: 0 },
])

const INITIAL_INVITATIONS: readonly WorkforceInvitation[] = Object.freeze([
  { id: 'invitation-1', email: 'new.member@example.invalid', role: 'Audit viewer', status: 'pending' },
])

const INITIAL_GROUPS: readonly OperationalGroup[] = Object.freeze([
  { id: 'client-group-managers', name: 'Client group managers', template: 'client-group-management' },
  { id: 'appointment-coordinators', name: 'Appointment coordinators', template: 'appointment-coordination' },
  { id: 'data-contributors', name: 'Data contributors', template: 'data-contribution' },
  {
    id: 'identity-evidence-assistants',
    name: 'Identity evidence assistants',
    template: 'identity-evidence-administration',
    capabilities: Object.freeze([
      'identity.subject.create',
      'identity.subject.update',
      'identity.evidence.record',
      'identity.claim.verify',
      'identity.subject.attest',
      'identity.relationship.attest',
    ]),
  },
])

const INITIAL_DEPARTMENTS: readonly OrganizationDepartment[] = Object.freeze([
  { id: 'operations', name: 'Operations' },
  { id: 'field-services', name: 'Field Services' },
])

const INITIAL_MEMBERSHIPS: readonly EmployeeOrganizationMembership[] = Object.freeze([
  { employeeId: 'member-1', groupIds: ['appointment-coordinators', 'identity-evidence-assistants'], departmentIds: ['operations'] },
  { employeeId: 'member-2', groupIds: ['data-contributors'], departmentIds: [] },
])

const workspaceCards: readonly Readonly<{ view: WorkspaceView; title: string; description: string }>[] = Object.freeze([
  { view: 'organization', title: 'Organization information', description: 'Manage public identity, verified details, locations, departments and services.' },
  { view: 'members', title: 'Members and devices', description: 'Manage licences, invitations, members and registered devices.' },
  { view: 'structure', title: 'Groups and departments', description: 'Organize employees and assign narrow administrative eligibility.' },
  { view: 'evidence', title: 'Identity and qualification evidence', description: 'Prepare employee identity checks, age-over predicates and employer-reviewed qualification evidence.' },
])

function InformationalPanel({ title, children }: Readonly<{ title: string; children: React.ReactNode }>) {
  return <section className="reused-panel"><h2>{title}</h2>{children}</section>
}

export function ControllerWorkspace({ portalName, organizationName }: Readonly<{
  portalName: string
  organizationName: string
}>) {
  const [view, setView] = useState<WorkspaceView>('home')
  const [employees, setEmployees] = useState<readonly WorkforceEmployee[]>(INITIAL_EMPLOYEES)
  const [invitations, setInvitations] = useState<readonly WorkforceInvitation[]>(INITIAL_INVITATIONS)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [unlockSecret, setUnlockSecret] = useState('')
  const [groups, setGroups] = useState<readonly OperationalGroup[]>(INITIAL_GROUPS)
  const [departments, setDepartments] = useState<readonly OrganizationDepartment[]>(INITIAL_DEPARTMENTS)
  const [memberships, setMemberships] = useState<readonly EmployeeOrganizationMembership[]>(INITIAL_MEMBERSHIPS)
  const used = employees.length + 1

  function open(next: WorkspaceView): void {
    setView(next)
    window.scrollTo({ top: 0 })
  }

  function invite(): void {
    const next: WorkforceInvitation = {
      id: `invitation-${invitations.length + 1}`,
      email: email.trim(),
      role,
      status: 'pending',
    }
    setInvitations(current => [...current, next])
    setEmail('')
    setRole('')
    setUnlockSecret('')
  }

  function changeMembership(employeeId: string, kind: 'group' | 'department', membershipId: string, enabled: boolean): void {
    setMemberships(current => {
      const existing = current.find(item => item.employeeId === employeeId) ?? { employeeId, groupIds: [], departmentIds: [] }
      const key = kind === 'group' ? 'groupIds' : 'departmentIds'
      const values = enabled ? [...new Set([...existing[key], membershipId])] : existing[key].filter(id => id !== membershipId)
      const next = { ...existing, [key]: values }
      return [...current.filter(item => item.employeeId !== employeeId), next]
    })
  }

  function createGroup(name: string, template: OperationalGroupTemplate): void {
    setGroups(current => [...current, { id: `group-${current.length + 1}`, name, template }])
  }

  function createDepartment(name: string): void {
    setDepartments(current => [...current, { id: `department-${current.length + 1}`, name }])
  }

  return <div className="controller-workspace" data-reuse-source="antifraud-portal-components-react@0.1.0">
    <header className="controller-header">
      <button type="button" className="controller-brand" onClick={() => open('home')} aria-label={`${portalName} home`}>
        <span className="controller-mark" aria-hidden="true">◇</span><span><strong>{portalName}</strong><small>Organization controller</small></span>
      </button>
      <div className="controller-context"><small>Active organization</small><strong>{organizationName}</strong></div>
      <button type="button" className="controller-account">Controller session</button>
    </header>

    <nav className="controller-nav" aria-label="Controller workspace">
      <button type="button" aria-current={view === 'home' ? 'page' : undefined} onClick={() => open('home')}>Home</button>
      {workspaceCards.map(card => <button type="button" key={card.view} aria-current={view === card.view ? 'page' : undefined} onClick={() => open(card.view)}>{card.title}</button>)}
    </nav>

    <main className="controller-main">
      <div className="controller-demo-note" role="status"><strong>Reusable controller Demo</strong><span>Local fixture state only. Browser selection grants no authority and performs no gateway write.</span></div>
      {view === 'home' ? <>
        <section className="controller-welcome">
          <span>Organization controller</span>
          <h1>{organizationName}</h1>
          <p>Choose an administrative workspace. Professional and clinical functions remain outside this portal.</p>
        </section>
        <section className="controller-card-grid" aria-label="Controller capabilities">
          {workspaceCards.map(card => <button type="button" className="controller-card" key={card.view} onClick={() => open(card.view)}>
            <span aria-hidden="true">→</span><strong>{card.title}</strong><small>{card.description}</small>
          </button>)}
        </section>
      </> : <>
        <button type="button" className="workspace-back" onClick={() => open('home')}>← Back to controller home</button>
        {view === 'members' ? <div className="shared-workforce-wrapper">
          <section className="current-controller-summary" aria-label="Current controller">
            <span><strong>controller@example.invalid</strong><small>Current controller · one registered device</small></span>
            <span>Protected controller reservation</span>
          </section>
          <OrganizationWorkforceAdministration
            copy={WORKFORCE_COPY}
            summary={{ total: 5, used, free: Math.max(0, 5 - used) }}
            employees={employees}
            invitations={invitations}
            roles={[
              { value: 'service-manager', label: 'Service manager' },
              { value: 'member-manager', label: 'Member manager' },
              { value: 'audit-viewer', label: 'Audit viewer' },
            ]}
            email={email}
            role={role}
            unlockSecret={unlockSecret}
            onEmailChange={setEmail}
            onRoleChange={setRole}
            onUnlockSecretChange={setUnlockSecret}
            onInvite={invite}
            onDisable={id => setEmployees(current => current.map(employee => employee.id === id ? { ...employee, status: 'inactive' } : employee))}
            onReactivate={id => setEmployees(current => current.map(employee => employee.id === id ? { ...employee, status: 'active' } : employee))}
            onPurge={id => { setEmployees(current => current.filter(employee => employee.id !== id)); setMemberships(current => current.filter(item => item.employeeId !== id)) }}
          />
          <EmployeeMembershipDirectory employees={employees} groups={groups} departments={departments} memberships={memberships} onMembershipChange={changeMembership} />
        </div> : null}
        {view === 'organization' ? <InformationalPanel title="Organization information"><p>Public identity, verified legal details, locations, departments and service configuration are loaded from the trusted gateway adapter.</p><dl className="controller-facts"><div><dt>Organization</dt><dd>{organizationName}</dd></div><div><dt>Connection</dt><dd>Gateway adapter required</dd></div></dl></InformationalPanel> : null}
        {view === 'structure' ? <OrganizationStructureAdministration employees={employees} groups={groups} departments={departments} memberships={memberships} onCreateGroup={createGroup} onCreateDepartment={createDepartment} onMembershipChange={changeMembership} /> : null}
        {view === 'evidence' ? <EvidenceAdministration /> : null}
      </>}
    </main>
  </div>
}
