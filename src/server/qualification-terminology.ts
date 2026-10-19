import {
  MemoryTerminologyCache,
  TerminologyClient,
  type CodeCandidate,
} from 'terminology-sdk-node-ts/terminology-client'

export const QUALIFICATION_CLASSIFICATION_CLAIM =
  'org.schema.EducationalOccupationalCredential.credentialCategory'

export type QualificationTerminologyCandidate = Readonly<{
  system: string
  version?: string
  uri?: string
  code: string
  label: string
  display: string
  language: string
}>

type QualificationTerminologyClient = Pick<
  TerminologyClient,
  'searchCodeCandidatesFromText' | 'resolveCodeLabels'
>

let cachedClient: TerminologyClient | undefined

function configuredClient(): TerminologyClient {
  if (cachedClient) return cachedClient
  const baseUrl = process.env.TERMINOLOGY_BASE_URL?.trim()
  const serviceToken = process.env.TERMINOLOGY_SERVICE_TOKEN?.trim()
  if (!baseUrl || !serviceToken) throw new Error('Terminology BFF configuration is required.')
  cachedClient = new TerminologyClient({
    baseUrl,
    serviceToken,
    cache: new MemoryTerminologyCache({ maxEntries: 200 }),
  })
  return cachedClient
}

function candidate(value: CodeCandidate): QualificationTerminologyCandidate {
  return Object.freeze({
    system: value.system,
    ...(value.terminologyVersion ? { version: value.terminologyVersion } : {}),
    code: value.code,
    label: value.text,
    display: value.display,
    language: value.language,
  })
}

export async function searchQualificationClassifications(
  input: Readonly<{ text: string; language: string }>,
  client: QualificationTerminologyClient = configuredClient(),
): Promise<readonly QualificationTerminologyCandidate[]> {
  const results = await client.searchCodeCandidatesFromText({
    text: input.text,
    language: input.language,
    sector: 'antifraud-tech',
    jurisdiction: 'ES',
    claim: QUALIFICATION_CLASSIFICATION_CLAIM,
    limit: 20,
  })
  return Object.freeze(results.map(candidate))
}

export async function resolveQualificationClassificationLabel(
  input: Readonly<{ system: string; code: string; version?: string; language: string }>,
  client: QualificationTerminologyClient = configuredClient(),
): Promise<QualificationTerminologyCandidate | undefined> {
  const result = await client.resolveCodeLabels({
    system: input.system,
    code: input.code,
    ...(input.version ? { version: input.version } : {}),
    language: input.language,
    sector: 'antifraud-tech',
    jurisdiction: 'ES',
    claim: QUALIFICATION_CLASSIFICATION_CLAIM,
  })
  return result ? candidate(result) : undefined
}
