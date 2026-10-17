# Antifraud Controller Portal agent contract

## Boundary

This public repository owns only sector-neutral organization-controller UI.
Do not add student, animal, patient, clinical, qualification or evidence-record
screens. The planned `qualification-education` and `qualification-animal` role
portals remain separate.

Browser-selected organization, employee, group, role or sector never grants
authority. Production must fail closed until the trusted backend confirms the
controller, exact organization, assignment, membership, reusable group
authorization and administrative capability.

Reuse controlled components from `antifraud-portal-components-react`. Do not
copy UHC product screens or policy. Any migrated public Apache-2.0 component
must retain source provenance and be neutralized in the shared Antifraud
component package before this portal consumes it.

## Delivery

Use red-green-refactor TDD. Every test file starts with a flow-contract comment.
Every browser test states its numbered journey plus authorization and
persistence invariants. Validate Node.js 24, unit tests, type-check, production
build and desktop/mobile Playwright.

Fixture UI, screenshots and HTTP success do not prove backend persistence or
authorization. Do not publish or deploy while the dependency uses a local
`file:` link or while the real portal-to-backend-to-gateway journey is absent.

Store screenshots as flat, Git-ignored files named
`antifraud-controller-<yyyymmdd-hhmmss>-<action>-<language>-<viewport>.png`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
