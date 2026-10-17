'use client'

import { useDeferredValue, useState, type FormEvent } from 'react'
import type { WorkforceEmployee } from 'antifraud-portal-components-react'

export type OperationalGroupTemplate = 'client-group-management' | 'appointment-coordination' | 'data-contribution' | 'encounter-transfer-coordination' | 'identity-evidence-administration'

export type OperationalGroup = Readonly<{
  id: string
  name: string
  template: OperationalGroupTemplate
  capabilities?: readonly string[]
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

const GROUP_TEMPLATE_LABELS: Readonly<Record<OperationalGroupTemplate, string>> = Object.freeze({
  'client-group-management': 'Client group management',
  'appointment-coordination': 'Appointment coordination assignment',
  'data-contribution': 'Data contribution without clinical read',
  'encounter-transfer-coordination': 'Encounter and transfer coordination',
  'identity-evidence-administration': 'Identity evidence administration',
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
}: Readonly<{
  employees: readonly WorkforceEmployee[]
  groups: readonly OperationalGroup[]
  departments: readonly OrganizationDepartment[]
  memberships: readonly EmployeeOrganizationMembership[]
  onCreateGroup(name: string, template: OperationalGroupTemplate): void
  onCreateDepartment(name: string): void
  onMembershipChange(employeeId: string, kind: MembershipKind, membershipId: string, enabled: boolean): void
}>) {
  const [query, setQuery] = useState('')
  const [groupName, setGroupName] = useState('')
  const [groupTemplate, setGroupTemplate] = useState<OperationalGroupTemplate>('client-group-management')
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

  return <section className="organization-structure" aria-labelledby="organization-structure-title">
    <header className="structure-heading"><div><h2 id="organization-structure-title">Groups and departments</h2><p>Create administrative collections and review their employees. Operational work remains in the corresponding professional portal.</p></div><label className="structure-filter"><span>Filter groups or members</span><input type="search" value={query} onChange={event => setQuery(event.currentTarget.value)} placeholder="Group, department, email or role" /></label></header>
    <p className="authority-boundary">An appointment-coordination group assigns administrative eligibility only. This controller does not expose availability, calendars or appointment operations.</p>

    <div className="structure-create-grid">
      <form onSubmit={createGroup}><h3>Create an employee group</h3><label><span>Group name</span><input value={groupName} onChange={event => setGroupName(event.currentTarget.value)} required /></label><label><span>Group template</span><select value={groupTemplate} onChange={event => setGroupTemplate(event.currentTarget.value as OperationalGroupTemplate)}>{Object.entries(GROUP_TEMPLATE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button type="submit">Create group</button></form>
      <form onSubmit={createDepartment}><h3>Create a department</h3><label><span>Department name</span><input value={departmentName} onChange={event => setDepartmentName(event.currentTarget.value)} required /></label><button type="submit">Create department</button></form>
    </div>

    <section className="structure-section" aria-labelledby="employee-groups-title"><h3 id="employee-groups-title">Employee groups</h3><div className="structure-card-grid">{visibleGroups.map(group => {
      const memberIds = memberIdsForGroup(memberships, group.id)
      return <article key={group.id} aria-label={group.name}><header><div><h4>{group.name}</h4><p>{GROUP_TEMPLATE_LABELS[group.template]}</p></div><span>{memberCountLabel(memberIds.size)}</span></header>{group.capabilities?.length ? <div className="group-capabilities" aria-label="Authorized capabilities">{group.capabilities.map(capability => <code key={capability}>{capability}</code>)}</div> : null}<fieldset><legend>Employees</legend>{employees.map(employee => <label key={employee.id}><input type="checkbox" checked={memberIds.has(employee.id)} onChange={event => onMembershipChange(employee.id, 'group', group.id, event.currentTarget.checked)} /><span>{employee.email}<small>{employee.role}</small></span></label>)}</fieldset></article>
    })}</div>{visibleGroups.length === 0 ? <p className="structure-empty">No groups match this filter.</p> : null}</section>

    <section className="structure-section" aria-labelledby="departments-title"><h3 id="departments-title">Departments</h3><div className="structure-card-grid">{visibleDepartments.map(department => {
      const memberIds = memberIdsForDepartment(memberships, department.id)
      return <article key={department.id} aria-label={department.name}><header><div><h4>{department.name}</h4><p>Organization department</p></div><span>{memberCountLabel(memberIds.size)}</span></header><fieldset><legend>Employees</legend>{employees.map(employee => <label key={employee.id}><input type="checkbox" checked={memberIds.has(employee.id)} onChange={event => onMembershipChange(employee.id, 'department', department.id, event.currentTarget.checked)} /><span>{employee.email}<small>{employee.role}</small></span></label>)}</fieldset></article>
    })}</div>{visibleDepartments.length === 0 ? <p className="structure-empty">No departments match this filter.</p> : null}</section>
  </section>
}
