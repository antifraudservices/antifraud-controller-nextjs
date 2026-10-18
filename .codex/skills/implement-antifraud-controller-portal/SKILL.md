---
name: implement-antifraud-controller-portal
description: Implement or review the public sector-neutral Antifraud organization controller portal without adding qualification-sector subject workflows.
---

# Implement Antifraud Controller Portal

Keep this application limited to organization profile, departments, employees,
invitations, groups, reusable group authorizations, administrative notices and
controller Clearing House views. Do not add general learner, animal, patient
or employee role-work screens.

Distinguish host and tenant controllers. Host controllers operate discovery,
delivery, retry, dead-letter and unresolved-reference envelopes but cannot
open confidential tenant evidence or decide for a tenant. Tenant controllers
see only claims addressed to their verified organization and may act or
delegate exact inbox capabilities. Delegated employees perform evidence work
in the applicable role portal.

Reuse the privacy-minimized host observability pattern. Show total and
per-tenant pending counts, protected destination resolved for authorized
display, lifecycle, attempts, retry, receipt and safe error state. Tenant
controllers see only items addressed to their organization. Never render
message bodies, evidence, tokens or unrestricted diagnostics as observability.

Read `docs/ARCHITECTURE_AND_ACCEPTANCE.md` before changing behavior. Reuse
controlled components from `antifraud-portal-components-react`. If a component
from another public application is still required, migrate only the neutral
component into the shared package with Apache-2.0 provenance; do not copy the
source application's policy or screens here.

The browser emits intentions only. The trusted backend resolves controller,
organization, assignment, membership, reusable group authorization,
capability, jurisdiction and notification state. A group membership is not an
employee-specific Consent.

Reuse shared SDK wallet, secure-message and managed-profile security. Do not
implement cryptography, canonicalization, private-key custody or wallet unlock
inside React or portal-local utilities. A cloud-managed signing operation
requires local biometric unlock when available, with a governed PIN or
password fallback, and creates only a short-lived user-, device-, operation-
and manifest-bound BFF session. Invoke the managed wallet through the
high-level SDK and return only proof metadata and the receipt. Never expose the
seed or private key, and never treat login, approval, delivery or read state as
a signature.

Use red-green-refactor TDD and begin every test with a flow-contract comment.
Run Node.js 24 unit tests, type-check, production build and desktop/mobile
Playwright. Fixture Playwright is visual and interaction proof only; completion
requires authoritative persistence and readback through the real backend, SDK
and gateway.

For the focused MVP, Demo is the only executable environment. Keep the same
production-shaped UI, components, options and flows intended for Test Network,
but use the gateway's six-second in-memory Fabric adapter and label every
result as simulated. Test Network is visible but disabled until the project
owner supplies Kubernetes and configuration; Production is disabled. Reuse
the existing trusted BFF/gateway collection-prefix resolver and prove Demo
cannot access either disabled environment. The browser never supplies a
prefix or environment authority.

When preparing Firebase App Hosting, never request or commit a service-account
key. The project owner authorizes the official Firebase GitHub application and
selects project, region, backend and branch. Use Application Default
Credentials for Firebase Admin/Firestore and Cloud Secret Manager references
for secrets. Verify an adapter and its tests before naming it as supported.

Before implementing Google login, read `docs/BETA_FIREBASE_AUTH.md`. Enabling
the provider is not sufficient: keep a distinct Firebase web-app registration
for this portal, authorize `localhost` and every deployed portal hostname,
verify exact Firebase issuer and audience in the BFF, and retain server-side
controller authorization. Use either the Auth Emulator or live local Google
login, never a mixture. Preserve popup compatibility with COOP
`same-origin-allow-popups` where needed and no global COEP `require-corp`.
The Foundation is a bounded tenant of `host-beta.antifraud.services`; its
person-index bindings are under `antifraud.online`, not browser-selected portal
authority.

Never publish with a `file:` dependency, internal prompt, tenant host, secret,
real personal data or unverified deployment claim.
