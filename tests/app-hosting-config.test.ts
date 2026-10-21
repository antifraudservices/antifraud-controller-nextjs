// Flow contract: the verified local source tree maps to the explicitly temporary Connectech App Hosting backend; generated state, local secrets and browser evidence never enter the rollout archive, and the hosted page resolves its Demo authorization from runtime configuration instead of a build-time static snapshot.
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Firebase App Hosting source deployment', () => {
  it('targets the reserved backend and excludes local-only state', async () => {
    const [configText, appHostingYaml, pageSource] = await Promise.all([
      readFile(resolve(process.cwd(), 'firebase.json'), 'utf8'),
      readFile(resolve(process.cwd(), 'apphosting.yaml'), 'utf8'),
      readFile(resolve(process.cwd(), 'src/app/page.tsx'), 'utf8'),
    ])
    const config = JSON.parse(configText) as {
      apphosting: {backendId: string; rootDir: string; alwaysDeployFromSource: boolean; ignore: string[]}
    }
    expect(config.apphosting.backendId).toBe('antifraud-controller-temp')
    expect(config.apphosting.rootDir).toBe('.')
    expect(config.apphosting.alwaysDeployFromSource).toBe(true)
    expect(config.apphosting.ignore).toEqual(expect.arrayContaining(['.git', '.next', 'node_modules', '.env*']))
    expect(appHostingYaml).toMatch(/ANTIFRAUD_NETWORK_KIND[\s\S]*value: demo/u)
    expect(appHostingYaml).toMatch(/ANTIFRAUD_PRODUCTION_ENABLED[\s\S]*value: "false"/u)
    expect(appHostingYaml).toMatch(/ANTIFRAUD_GATEWAY_BASE_URL[\s\S]*antifraud-gw-temp-788157665132\.us-central1\.run\.app/u)
    expect(appHostingYaml).toMatch(/ANTIFRAUD_GATEWAY_BEARER[\s\S]*secret: antifraud-controller-bff-token-temp/u)
    expect(appHostingYaml).toMatch(/TERMINOLOGY_BASE_URL[\s\S]*antifraud-terminology-temp-788157665132\.us-central1\.run\.app/u)
    expect(appHostingYaml).toMatch(/TERMINOLOGY_SERVICE_TOKEN[\s\S]*secret: antifraud-terminology-token-temp/u)
    expect(appHostingYaml).toMatch(/CONTROLLER_PORTAL_HOST_PROFILES_JSON[\s\S]*antifraud-controller-temp--connectech-es-shared-test\.us-central1\.hosted\.app[\s\S]*antifraud-tech/u)
    expect(appHostingYaml).toMatch(/CONTROLLER_PORTAL_HOST_PROFILES_JSON[\s\S]*antifraud-controller-temp-788157665132\.us-central1\.run\.app[\s\S]*antifraud-tech/u)
    expect(appHostingYaml).not.toMatch(/project-f70afb24-dd73-4fb4-be5|982931712028/u)
    expect(pageSource).toContain("export const dynamic = 'force-dynamic'")
  })
})
