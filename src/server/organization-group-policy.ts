import {
  OrganizationWorkflowCapabilities,
  OrganizationWorkflowGroupKinds,
  buildOrganizationSubjectRegisterCapability,
} from 'sos-data-utils-ts/organization-workflow-access'

export type OrganizationGroupTemplate =
  | 'identity-evidence-administration'
  | 'qualification-evidence-administration'
  | 'clearing-house-review'
  | 'places-management'
  | 'public-services-management'
  | 'custom'
  | typeof OrganizationWorkflowGroupKinds[keyof typeof OrganizationWorkflowGroupKinds]

export type OrganizationGroupTemplateOption = Readonly<{ value: OrganizationGroupTemplate; label: string; syntheticOnly?: boolean }>

const ADMINISTRATIVE_TEMPLATES: readonly OrganizationGroupTemplateOption[] = Object.freeze([
  Object.freeze({ value: 'identity-evidence-administration', label: 'Identity evidence administration' }),
  Object.freeze({ value: 'qualification-evidence-administration', label: 'Qualification evidence administration' }),
  Object.freeze({ value: 'clearing-house-review', label: 'Clearing House review' }),
  Object.freeze({ value: 'places-management', label: 'Places management' }),
  Object.freeze({ value: 'public-services-management', label: 'Public Services management' }),
  Object.freeze({ value: 'custom', label: 'Custom group without capabilities' }),
])

const TECH_WORKFLOW_TEMPLATES: readonly OrganizationGroupTemplateOption[] = Object.freeze([
  Object.freeze({ value: OrganizationWorkflowGroupKinds.SubjectRegistration, label: 'Subject registration — synthetic Test Network workflow', syntheticOnly: true }),
  Object.freeze({ value: OrganizationWorkflowGroupKinds.SchedulingOperations, label: 'Scheduling operations — synthetic Test Network workflow', syntheticOnly: true }),
  Object.freeze({ value: OrganizationWorkflowGroupKinds.EncounterOperations, label: 'Encounter operations — synthetic Test Network workflow', syntheticOnly: true }),
  Object.freeze({ value: OrganizationWorkflowGroupKinds.ClinicalContribution, label: 'Clinical contribution — synthetic Test Network workflow', syntheticOnly: true }),
  Object.freeze({ value: OrganizationWorkflowGroupKinds.PublicCommunicationRequestPublishing, label: 'Public communication requests — synthetic Test Network workflow', syntheticOnly: true }),
])

export function allowedGroupTemplateOptions(allowedSectors: readonly string[]): readonly OrganizationGroupTemplateOption[] {
  return Object.freeze(allowedSectors.includes('antifraud-tech')
    ? [...ADMINISTRATIVE_TEMPLATES, ...TECH_WORKFLOW_TEMPLATES]
    : [...ADMINISTRATIVE_TEMPLATES])
}

export function resolveGroupTemplateCapabilities(template: OrganizationGroupTemplate, organizationReference: string): readonly string[] {
  if (template === 'identity-evidence-administration') return Object.freeze(['identity.subject.create', 'identity.subject.update', 'identity.evidence.record', 'identity.claim.verify', 'identity.subject.attest', 'identity.relationship.attest'])
  if (template === 'qualification-evidence-administration') return Object.freeze(['qualification-evidence:create'])
  if (template === 'clearing-house-review') return Object.freeze(['qualification-inbox:list', 'qualification-evidence:decide'])
  if (template === 'places-management') return Object.freeze(['controller.structure.write'])
  if (template === 'public-services-management') return Object.freeze(['controller.structure.write', 'controller.catalog.publish'])
  if (template === 'custom') return Object.freeze([])
  if (template === OrganizationWorkflowGroupKinds.SubjectRegistration) return Object.freeze([buildOrganizationSubjectRegisterCapability(organizationReference)])
  if (template === OrganizationWorkflowGroupKinds.SchedulingOperations) return Object.freeze([
    OrganizationWorkflowCapabilities.AppointmentCruds,
    OrganizationWorkflowCapabilities.ScheduleCruds,
    OrganizationWorkflowCapabilities.SlotCruds,
  ])
  if (template === OrganizationWorkflowGroupKinds.EncounterOperations) return Object.freeze([
    OrganizationWorkflowCapabilities.EncounterCruds,
    OrganizationWorkflowCapabilities.EncounterHistoryCruds,
  ])
  if (template === OrganizationWorkflowGroupKinds.ClinicalContribution) return Object.freeze([OrganizationWorkflowCapabilities.CompositionCuds])
  if (template === OrganizationWorkflowGroupKinds.PublicCommunicationRequestPublishing) return Object.freeze([OrganizationWorkflowCapabilities.CommunicationRequestCreate])
  throw new Error('group_template_not_allowed')
}
