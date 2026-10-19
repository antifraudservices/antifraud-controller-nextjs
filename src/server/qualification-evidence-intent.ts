import {
  defineQualificationClassificationReference,
  type QualificationClassificationReference,
} from 'antifraud-data-utils-ts'

export type QualificationEvidenceIntent = Readonly<{
  employeeId: string
  qualification: Readonly<{
    title: string
    type: 'degree' | 'certificate' | 'licence' | 'accreditation' | 'training'
    identifier: Readonly<{ system: string; value: string }>
    classification: QualificationClassificationReference
  }>
  issuer: Readonly<{
    organizationReference: string
    legalIdentifier: string
    jurisdiction: string
  }>
  evidence: Readonly<{
    reference: string
    contentId: string
    mediaType: 'application/pdf' | 'image/png' | 'image/jpeg' | 'image/tiff'
    fileName: string
  }>
  assertionKind: 'employer-attestation'
}>

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

export function normalizeQualificationEvidenceIntent(input: unknown): QualificationEvidenceIntent {
  const intent = record(input)
  const qualification = record(intent.qualification)
  const classification = record(qualification.classification)
  const normalizedClassification = defineQualificationClassificationReference({
    system: typeof classification.system === 'string' ? classification.system : '',
    version: typeof classification.version === 'string' ? classification.version : undefined,
    uri: typeof classification.uri === 'string' ? classification.uri : undefined,
    code: typeof classification.code === 'string' ? classification.code : '',
    display: typeof classification.display === 'string' ? classification.display : undefined,
  })
  return Object.freeze({
    ...(intent as QualificationEvidenceIntent),
    qualification: Object.freeze({
      ...(qualification as QualificationEvidenceIntent['qualification']),
      classification: normalizedClassification,
    }),
  })
}
