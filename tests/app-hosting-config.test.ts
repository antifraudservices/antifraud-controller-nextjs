// Flow contract: the verified local source tree maps to the Antifraud Beta App Hosting backend while its trusted BFF calls the stable Connectech Kubernetes ingress; generated state, local secrets and browser evidence never enter the rollout archive, and the hosted page resolves its Demo authorization from runtime configuration instead of a build-time static snapshot.
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
    expect(config.apphosting.backendId).toBe('antifraud-controller-beta')
    expect(config.apphosting.rootDir).toBe('.')
    expect(config.apphosting.alwaysDeployFromSource).toBe(true)
    expect(config.apphosting.ignore).toEqual(expect.arrayContaining(['.git', '.next', 'node_modules', '.env*']))
    expect(appHostingYaml).toMatch(/ANTIFRAUD_NETWORK_KIND[\s\S]*value: demo/u)
    expect(appHostingYaml).toMatch(/ANTIFRAUD_PRODUCTION_ENABLED[\s\S]*value: "false"/u)
    expect(appHostingYaml).toMatch(/ANTIFRAUD_GATEWAY_BASE_URL[\s\S]*https:\/\/host-beta\.antifraud\.services/u)
    expect(appHostingYaml).toMatch(/ANTIFRAUD_GATEWAY_BEARER[\s\S]*secret: antifraud-demo-controller-bff-token/u)
    expect(appHostingYaml).toMatch(/TERMINOLOGY_BASE_URL[\s\S]*https:\/\/terminology-beta\.antifraud\.services/u)
    expect(appHostingYaml).toMatch(/TERMINOLOGY_SERVICE_TOKEN[\s\S]*secret: antifraud-demo-terminology-token/u)
    expect(appHostingYaml).toMatch(/CONTROLLER_PORTAL_HOST_PROFILES_JSON[\s\S]*antifraud-controller-beta--project-f70afb24-dd73-4fb4-be5\.us-central1\.hosted\.app[\s\S]*antifraud-tech/u)
    expect(appHostingYaml).toMatch(/CONTROLLER_PORTAL_HOST_PROFILES_JSON[\s\S]*antifraud-controller-beta-982931712028\.us-central1\.run\.app[\s\S]*antifraud-tech/u)
    expect(appHostingYaml).toMatch(/CONTROLLER_PORTAL_HOST_PROFILES_JSON[\s\S]*controller-beta\.antifraud\.services[\s\S]*antifraud-tech/u)
    expect(appHostingYaml).not.toMatch(/controller-temp|788157665132/u)
    expect(pageSource).toContain("export const dynamic = 'force-dynamic'")
  })

  it('deploys Test Network with host-scoped credentials and no inherited Beta endpoints', async () => {
    const testNetworkYaml = await readFile(resolve(process.cwd(), 'apphosting.test-network.yaml'), 'utf8')
    const blocks = Object.fromEntries([...testNetworkYaml.matchAll(/- variable: ([A-Z_]+)\n((?:    [^\n]*\n)+)/gu)]
      .map(([, name, content]) => [name, content]))
    expect(blocks.ANTIFRAUD_NETWORK_KIND).toContain('value: test-network')
    expect(blocks.ANTIFRAUD_TEST_NETWORK_ENABLED).toContain('value: "true"')
    expect(blocks.ANTIFRAUD_PRODUCTION_ENABLED).toContain('value: "false"')
    expect(blocks.CONTROLLER_DEMO_MODE).toContain('value: "false"')
    expect(blocks.SOS_GATEWAY_HOST_NETWORK).toContain('value: test-network')
    for (const variable of [
      'ANTIFRAUD_ADMISSION_CONTROLLER_ASSIGNMENTS_JSON', 'ANTIFRAUD_ADMISSION_GATEWAY_BEARER',
      'CONTROLLER_PORTAL_HOST_PROFILES_JSON', 'ANTIFRAUD_ADMISSION_POLICY_HOSTNAME',
      'SOS_GATEWAY_HOST_BASE_URL', 'ANTIFRAUD_GATEWAY_BASE_URL', 'ANTIFRAUD_GATEWAY_BEARER',
      'TERMINOLOGY_BASE_URL', 'TERMINOLOGY_SERVICE_TOKEN',
    ]) {
      expect(blocks[variable]).toMatch(/secret: antifraud-test-network-/u)
      expect(blocks[variable]).toContain('availability: [RUNTIME]')
    }
    for (const variable of [
      'ANTIFRAUD_ADMISSION_FIREBASE_PROJECT_ID', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'NEXT_PUBLIC_FIREBASE_APP_ID',
    ]) expect(blocks[variable]).toMatch(/secret: antifraud-test-network-/u)
    expect(testNetworkYaml).not.toMatch(/-beta|antifraud-demo-|EMULATOR|AUTH_TESTING/u)
  })

})
