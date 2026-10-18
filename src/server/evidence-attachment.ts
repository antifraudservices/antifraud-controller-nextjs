import { createHash } from 'node:crypto'

const BASE58BTC_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
export const MAX_LOCAL_EVIDENCE_BYTES = 5 * 1024 * 1024
export const SUPPORTED_LOCAL_EVIDENCE_MEDIA_TYPES = new Set([
  'application/pdf', 'image/png', 'image/jpeg', 'image/tiff',
])

function base58btc(bytes: Uint8Array): string {
  let number = 0n
  for (const byte of bytes) number = number * 256n + BigInt(byte)
  let encoded = ''
  while (number > 0n) {
    encoded = BASE58BTC_ALPHABET[Number(number % 58n)] + encoded
    number /= 58n
  }
  for (const byte of bytes) {
    if (byte !== 0) break
    encoded = `1${encoded}`
  }
  return `z${encoded}`
}

export function createLocalEvidenceAttachment(input: Readonly<{
  bytes: Uint8Array
  fileName: string
  mediaType: string
}>) {
  if (!SUPPORTED_LOCAL_EVIDENCE_MEDIA_TYPES.has(input.mediaType)) throw new TypeError('Unsupported evidence media type.')
  if (input.bytes.byteLength === 0 || input.bytes.byteLength > MAX_LOCAL_EVIDENCE_BYTES) {
    throw new TypeError('Evidence attachment must contain between 1 byte and 5 MiB.')
  }
  const digest = createHash('sha3-384').update(input.bytes).digest()
  const cidBytes = new Uint8Array(4 + digest.length)
  cidBytes.set([0x01, 0x55, 0x15, 0x30])
  cidBytes.set(digest, 4)
  const contentId = base58btc(cidBytes)
  return Object.freeze({
    fileName: input.fileName,
    mediaType: input.mediaType,
    size: input.bytes.byteLength,
    storageReference: `urn:cid:${contentId}`,
    contentId,
  })
}
