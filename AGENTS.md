# Antifraud Controller Portal agent contract

## Boundary

This public repository owns organization-controller UI, including
controller-authorized employee identity, age-over and employer
qualification-evidence workflows. Do not add unrelated role applications.

Browser-selected organization, employee, group or role never grants
authority. Production must fail closed until the trusted backend confirms the
controller, exact organization, assignment, membership, reusable group
authorization and administrative capability.

Reuse controlled components from `antifraud-portal-components-react`. Do not
copy unrelated application screens or policy. Any migrated public Apache-2.0 component
must retain generic source provenance and be neutralized in the shared
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
