---
name: implement-antifraud-controller-portal
description: Implement or review the public sector-neutral Antifraud organization controller portal without adding qualification-sector subject workflows.
---

# Implement Antifraud Controller Portal

Keep this application limited to organization profile, departments, employees,
invitations, groups, reusable group authorizations and administrative notices.
Do not add learner, animal, patient, qualification or evidence-record screens.

Read `docs/ARCHITECTURE_AND_ACCEPTANCE.md` before changing behavior. Reuse
controlled components from `antifraud-portal-components-react`. If a public UHC
component is still required, migrate only the neutral component into the
shared Antifraud package with Apache-2.0 provenance; do not copy UHC policy or
application screens here.

The browser emits intentions only. The trusted backend resolves controller,
organization, assignment, membership, reusable group authorization,
capability, jurisdiction and notification state. A group membership is not an
employee-specific Consent.

Use red-green-refactor TDD and begin every test with a flow-contract comment.
Run Node.js 24 unit tests, type-check, production build and desktop/mobile
Playwright. Fixture Playwright is visual and interaction proof only; completion
requires authoritative persistence and readback through the real backend, SDK
and gateway.

Never publish with a `file:` dependency, internal prompt, tenant host, secret,
real personal data or unverified deployment claim.
