import { createCipheriv, randomBytes, randomUUID } from 'node:crypto'
import { AntifraudGatewayClient } from 'antifraud-sdk-node-ts'
import { ControllerGatewayFailure } from './controller-gateway-capabilities'

const localClaimsKey = randomBytes(32)

function requiredEnvironment(name: 'ANTIFRAUD_GATEWAY_BASE_URL' | 'ANTIFRAUD_GATEWAY_BEARER'): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required.`)
  return value
}

export function localGatewayClient(preserveStatus = false): AntifraudGatewayClient {
  return new AntifraudGatewayClient({
    baseUrl: requiredEnvironment('ANTIFRAUD_GATEWAY_BASE_URL'),
    bearerCredential: async () => requiredEnvironment('ANTIFRAUD_GATEWAY_BEARER'),
    fetch: preserveStatus ? async (input, init) => {
      const response = await fetch(input, { ...init, redirect: 'error', cache: 'no-store' })
      if (!response.ok) throw new ControllerGatewayFailure(response.status)
      return response
    } : undefined,
  })
}

export function sealLocalClaims(value: unknown): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', localClaimsKey, iv)
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()])
  return [
    'local-a256gcm',
    iv.toString('base64url'),
    ciphertext.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
  ].join('.')
}

export function localOperationReference(kind: 'identity-evidence' | 'qualification-evidence'): string {
  return `${kind}:${randomUUID()}`
}
