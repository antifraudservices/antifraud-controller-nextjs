// Flow contract: the public neutral controller source, documentation and styles contain no upstream product or organization branding and no inherited CSS namespace. Provenance remains generic and sector-specific applications stay outside this repository.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function filesUnder(path: string): string[] {
  if (statSync(path).isFile()) return [path]
  return readdirSync(path).flatMap(name => filesUnder(join(path, name)))
}

describe('public repository hygiene', () => {
  it('keeps public implementation and narrative product-neutral', () => {
    const files = ['README.md', 'CHANGELOG.md', 'AGENTS.md', 'docs', 'src']
      .flatMap(filesUnder)
      .filter(path => !path.endsWith('.map'))
    const contents = files.map(path => readFileSync(path, 'utf8')).join('\n')
    expect(contents).not.toMatch(/VetChain|SOSChain|UHC|GlobalDataCare|Fundaci[oó]n UNID|Connecting Solution/i)
    expect(contents).not.toContain('uhcp-')
  })
})
