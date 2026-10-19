import { randomUUID } from 'node:crypto'
import {
  prepareConfidentialArtifactUpload,
  type AntifraudGatewayClient,
} from 'antifraud-sdk-node-ts'

export const MAX_LOCAL_EVIDENCE_BYTES = 5 * 1024 * 1024
export const SUPPORTED_LOCAL_EVIDENCE_MEDIA_TYPES = new Set([
  'application/pdf', 'image/png', 'image/jpeg', 'image/tiff',
])

type ConfidentialArtifactClient = Pick<
  AntifraudGatewayClient,
  'storeConfidentialArtifact' | 'readConfidentialArtifact'
>

export async function createLocalEvidenceAttachment(input: Readonly<{
  bytes: Uint8Array
  fileName: string
  mediaType: string
}>, client: ConfidentialArtifactClient) {
  if (!SUPPORTED_LOCAL_EVIDENCE_MEDIA_TYPES.has(input.mediaType)) throw new TypeError('Unsupported evidence media type.')
  if (input.bytes.byteLength === 0 || input.bytes.byteLength > MAX_LOCAL_EVIDENCE_BYTES) {
    throw new TypeError('Evidence attachment must contain between 1 byte and 5 MiB.')
  }
  const operationId = randomUUID()
  const upload = prepareConfidentialArtifactUpload({
    bytes: input.bytes,
    fileName: input.fileName,
    mediaType: input.mediaType,
    attachmentId: `urn:attachment:${operationId}`,
    manifest: {
      id: `urn:document-set:${operationId}`,
      name: `${input.fileName} evidence set`,
      additionalType: 'https://antifraud.services/schema/identity-evidence-set',
      version: '1',
    },
    document: {
      id: `urn:document:${operationId}`,
      name: input.fileName,
      additionalType: 'https://antifraud.services/schema/identity-evidence-document',
      version: '1',
    },
  })
  const descriptor = upload.document.documents[0].attachment
  const stored = await client.storeConfidentialArtifact(upload)
  if (stored.artifact.artifactId !== descriptor.contentId || stored.artifact.byteCount !== input.bytes.byteLength) {
    throw new Error('Gateway artifact receipt does not match the submitted evidence.')
  }
  const retrieved = await client.readConfidentialArtifact(descriptor.contentId)
  if (
    retrieved.mediaType !== input.mediaType
    || retrieved.bytes.byteLength !== input.bytes.byteLength
    || !Buffer.from(retrieved.bytes).equals(Buffer.from(input.bytes))
  ) {
    throw new Error('Gateway artifact retrieval did not return the exact submitted bytes.')
  }
  return Object.freeze({
    fileName: input.fileName,
    mediaType: input.mediaType,
    size: input.bytes.byteLength,
    storageReference: descriptor.contentUrl,
    contentId: descriptor.contentId,
  })
}
