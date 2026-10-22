'use client'

import { useDeferredValue, useState, type FormEvent } from 'react'
import type { WorkforceEmployee } from 'antifraud-hosting-components-react'
import type { OrganizationGroupTemplate, OrganizationGroupTemplateOption } from '../server/organization-group-policy'

export type OperationalGroupTemplate = OrganizationGroupTemplate

export type OperationalGroup = Readonly<{
  id: string
  name: string
  template: OperationalGroupTemplate
  capabilities?: readonly string[]
  authorizationReference?: string
}>

export type OrganizationDepartment = Readonly<{
  id: string
  name: string
}>

export type EmployeeOrganizationMembership = Readonly<{
  employeeId: string
  groupIds: readonly string[]
  departmentIds: readonly string[]
}>

type MembershipKind = 'group' | 'department'

const GROUP_TEMPLATE_LABELS: Readonly<Record<string, string>> = Object.freeze({
  'identity-evidence-administration': 'Identity evidence administration',
  'qualification-evidence-administration': 'Qualification evidence administration',
  'clearing-house-review': 'Clearing House review',
  custom: 'Custom group without capabilities',
  'subject-registration': 'Subject registration',
  'scheduling-operations': 'Scheduling operations',
  'encounter-operations': 'Encounter operations',
  'clinical-contribution': 'Clinical contribution',
  'public-communication-request-publishing': 'Public communication requests',
})

function matchesEmployee(employee: WorkforceEmployee, query: string): boolean {
  const normalized = query.trim().toLocaleLowerCase()
  return !normalized || employee.email.toLocaleLowerCase().includes(normalized) || employee.role.toLocaleLowerCase().includes(normalized)
}

function memberIdsForGroup(memberships: readonly EmployeeOrganizationMembership[], groupId: string): ReadonlySet<string> {
  return new Set(memberships.filter(item => item.groupIds.includes(groupId)).map(item => item.employeeId))
}

function memberIdsForDepartment(memberships: readonly EmployeeOrganizationMembership[], departmentId: string): ReadonlySet<string> {
  return new Set(memberships.filter(item => item.departmentIds.includes(departmentId)).map(item => item.employeeId))
}

function memberCountLabel(count: number): string {
  return `${count} ${count === 1 ? 'member' : 'members'}`
}

export function EmployeeMembershipDirectory({
  employees,
  groups,
  departments,
  memberships,
  onMembershipChange,
}: Readonly<{
  employees: readonly WorkforceEmployee[]
  groups: readonly OperationalGroup[]
  departments: readonly OrganizationDepartment[]
  memberships: readonly EmployeeOrganizationMembership[]
  onMembershipChange(employeeId: string, kind: MembershipKind, membershipId: string, enabled: boolean): void
}>) {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const filteredEmployees = employees.filter(employee => matchesEmployee(employee, deferredQuery))

  return <section className="membership-directory" aria-labelledby="employee-memberships-title">
    <header>
      <div><h2 id="employee-memberships-title">Employee groups and departments</h2><p>Expand an employee to review or change their administrative memberships.</p></div>
      <label className="structure-filter"><span>Filter employees</span><input type="search" value={query} onChange={event => setQuery(event.currentTarget.value)} placeholder="Name, email or role" /></label>
    </header>
    <p className="authority-boundary">Membership is administrative intent only. The gateway must verify the controller, organization and exact capability before an operation is allowed.</p>
    <div className="employee-membership-list">
      {filteredEmployees.map(employee => {
        const membership = memberships.find(item => item.employeeId === employee.id)
        return <details key={employee.id} className="employee-membership" role="group" aria-label={`${employee.email} memberships`}>
          <summary><span><strong>{employee.email}</strong><small>{employee.role}</small></span><span>{(membership?.groupIds.length ?? 0) + (membership?.departmentIds.length ?? 0)} assignments</span></summary>
          <div className="membership-options">
            <fieldset><legend>Operational groups</legend>{groups.map(group => <label key={group.id}><input type="checkbox" checked={membership?.groupIds.includes(group.id) ?? false} onChange={event => onMembershipChange(employee.id, 'group', group.id, event.currentTarget.checked)} /><span>{group.name}<small>{GROUP_TEMPLATE_LABELS[group.template]}</small></span></label>)}</fieldset>
            <fieldset><legend>Departments</legend>{departments.map(department => <label key={department.id}><input type="checkbox" checked={membership?.departmentIds.includes(department.id) ?? false} onChange={event => onMembershipChange(employee.id, 'department', department.id, event.currentTarget.checked)} /><span>{department.name}</span></label>)}</fieldset>
          </div>
        </details>
      })}
      {filteredEmployees.length === 0 ? <p className="structure-empty">No employees match this filter.</p> : null}
    </div>
  </section>
}

export function OrganizationStructureAdministration({
  employees,
  groups,
  departments,
  memberships,
  onCreateGroup,
  onCreateDepartment,
  onMembershipChange,
  groupTemplates,
  mode = 'all',
}: Readonly<{
  employees: readonly WorkforceEmployee[]
  groups: readonly OperationalGroup[]
  departments: readonly OrganizationDepartment[]
  memberships: readonly EmployeeOrganizationMembership[]
  onCreateGroup(name: string, template: OperationalGroupTemplate): void
  onCreateDepartment(name: string): void
  onMembershipChange(employeeId: string, kind: MembershipKind, membershipId: string, enabled: boolean): void
  groupTemplates?: readonly OrganizationGroupTemplateOption[]
  mode?: 'all' | 'groups' | 'departments'
}>) {
  const [query, setQuery] = useState('')
  const [groupName, setGroupName] = useState('')
  const availableGroupTemplates = groupTemplates ?? Object.entries(GROUP_TEMPLATE_LABELS).slice(0, 4).map(([value, label]) => ({ value: value as OperationalGroupTemplate, label }))
  const [groupTemplate, setGroupTemplate] = useState<OperationalGroupTemplate>(availableGroupTemplates[0]?.value ?? 'custom')
  const [departmentName, setDepartmentName] = useState('')
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase())
  const visibleGroups = groups.filter(group => {
    const memberIds = memberIdsForGroup(memberships, group.id)
    return !deferredQuery || group.name.toLocaleLowerCase().includes(deferredQuery) || employees.some(employee => memberIds.has(employee.id) && matchesEmployee(employee, deferredQuery))
  })
  const visibleDepartments = departments.filter(department => {
    const memberIds = memberIdsForDepartment(memberships, department.id)
    return !deferredQuery || department.name.toLocaleLowerCase().includes(deferredQuery) || employees.some(employee => memberIds.has(employee.id) && matchesEmployee(employee, deferredQuery))
  })

  function createGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = groupName.trim()
    if (!name) return
    onCreateGroup(name, groupTemplate)
    setGroupName('')
  }

  function createDepartment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = departmentName.trim()
    if (!name) return
    onCreateDepartment(name)
    setDepartmentName('')
  }

  const showGroups = mode === 'all' || mode === 'groups'
  const showDepartments = mode === 'all' || mode === 'departments'
  const title = mode === 'groups' ? 'Employee groups' : mode === 'departments' ? 'Departments' : 'Groups and departments'
  const description = mode === 'groups'
    ? 'Create reusable authorization groups and assign employees.'
    : mode === 'departments'
      ? 'Create the organization departments used by employees, places and client services.'
      : 'Create administrative collections, assign explicit capabilities and review their employees.'

  return <section className="organization-structure" aria-labelledby="organization-structure-title">
    <header className="structure-heading"><div><h2 id="organization-structure-title">{title}</h2><p>{description}</p></div><label className="structure-filter"><span>Filter</span><input type="search" value={query} onChange={event => setQuery(event.currentTarget.value)} placeholder="Name, email or role" /></label></header>
    {showGroups ? <p className="authority-boundary">A group records reusable administrative authorization. Each operation still verifies the active employee, membership and exact capability.</p> : null}

    <div className="structure-create-grid">
      {showGroups ? <form onSubmit={createGroup}><h3>Create an employee group</h3><label><span>Group name</span><input value={groupName} onChange={event => setGroupName(event.currentTarget.value)} required /></label><label><span>Group template</span><select value={groupTemplate} onChange={event => setGroupTemplate(event.currentTarget.value as OperationalGroupTemplate)}>{availableGroupTemplates.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><button type="submit">Create group</button></form> : null}
      {showDepartments ? <form onSubmit={createDepartment}><h3>Create a department</h3><label><span>Department name</span><input value={departmentName} onChange={event => setDepartmentName(event.currentTarget.value)} required /></label><button type="submit">Create department</button></form> : null}
    </div>

    {showGroups ? <section className="structure-section" aria-labelledby="employee-groups-title"><h3 id="employee-groups-title">Employee groups</h3><div className="structure-card-grid">{visibleGroups.map(group => {
      const memberIds = memberIdsForGroup(memberships, group.id)
      return <article key={group.id} aria-label={group.name}><header><div><h4>{group.name}</h4><p>{GROUP_TEMPLATE_LABELS[group.template]}</p></div><span>{memberCountLabel(memberIds.size)}</span></header>{group.authorizationReference ? <small>Authorization: {group.authorizationReference}</small> : null}{group.capabilities?.length ? <div className="group-capabilities" aria-label="Authorized capabilities">{group.capabilities.map(capability => <code key={capability}>{capability}</code>)}</div> : null}<fieldset><legend>Employees</legend>{employees.map(employee => <label key={employee.id}><input type="checkbox" checked={memberIds.has(employee.id)} onChange={event => onMembershipChange(employee.id, 'group', group.id, event.currentTarget.checked)} /><span>{employee.email}<small>{employee.role}</small></span></label>)}</fieldset></article>
    })}</div>{visibleGroups.length === 0 ? <p className="structure-empty">No groups match this filter.</p> : null}</section> : null}

    {showDepartments ? <section className="structure-section" aria-labelledby="departments-title"><h3 id="departments-title">Departments</h3><div className="structure-card-grid">{visibleDepartments.map(department => {
      const memberIds = memberIdsForDepartment(memberships, department.id)
      return <article key={department.id} aria-label={department.name}><header><div><h4>{department.name}</h4><p>Organization department</p></div><span>{memberCountLabel(memberIds.size)}</span></header><fieldset><legend>Employees</legend>{employees.map(employee => <label key={employee.id}><input type="checkbox" checked={memberIds.has(employee.id)} onChange={event => onMembershipChange(employee.id, 'department', department.id, event.currentTarget.checked)} /><span>{employee.email}<small>{employee.role}</small></span></label>)}</fieldset></article>
    })}</div>{visibleDepartments.length === 0 ? <p className="structure-empty">No departments match this filter.</p> : null}</section> : null}
  </section>
}
