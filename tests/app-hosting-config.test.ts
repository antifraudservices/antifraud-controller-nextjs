// Flow contract: the verified local source tree maps to exactly one reserved Beta App Hosting backend; generated state, local secrets and browser evidence never enter the rollout archive.
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Firebase App Hosting source deployment', () => {
  it('targets the reserved backend and excludes local-only state', async () => {
    const [configText, appHostingYaml] = await Promise.all([
      readFile(resolve(process.cwd(), 'firebase.json'), 'utf8'),
      readFile(resolve(process.cwd(), 'apphosting.yaml'), 'utf8'),
    ])
    const config = JSON.parse(configText) as {
      apphosting: {backendId: string; rootDir: string; alwaysDeployFromSource: boolean; ignore: string[]}
    }
    expect(config.apphosting.backendId).toBe('antifraud-controller-beta')
    expect(config.apphosting.rootDir).toBe('.')
    expect(config.apphosting.alwaysDeployFromSource).toBe(true)
    expect(config.apphosting.ignore).toEqual(expect.arrayContaining(['.git', '.next', 'node_modules', '.env*']))
    expect(appHostingYaml).toMatch(/ANTIFRAUD_NETWORK_KIND[\s\S]*value: demo/u)
    expect(appHostingYaml).toMatch(/ANTIFRAUD_PRODUCTION_ENABLED[\s\S]*value: "false"/u)
    expect(appHostingYaml).toMatch(/ANTIFRAUD_GATEWAY_BEARER[\s\S]*secret: antifraud-demo-controller-bff-token/u)
    expect(appHostingYaml).toMatch(/TERMINOLOGY_BASE_URL[\s\S]*antifraud-terminology-beta-982931712028\.us-central1\.run\.app/u)
    expect(appHostingYaml).toMatch(/TERMINOLOGY_SERVICE_TOKEN[\s\S]*secret: antifraud-demo-terminology-token/u)
  })
})
