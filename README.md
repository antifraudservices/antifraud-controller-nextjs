# Antifraud Controller Portal

Public organization-controller portal for qualification and
identity-evidence services.

The controller manages the organization, departments, employees, invitations,
groups and reusable group authorizations. It also provides controller views of
the Clearing House inbox. A tenant controller sees only claims addressed to
its organization and may act or delegate exact review capabilities. A host
controller sees routing, delivery failures and unclaimed-reference envelopes,
but has no implicit right to open confidential tenant evidence or decide for a
tenant. This portal also owns controller-authorized employee identity
evidence, age-over predicates and employer-reviewed qualification evidence.

## Current state

The local application reads and mutates organization and workforce state
through the backend-for-frontend, public Node SDK and local gateway. It reuses `antifraud-portal-components-react`, including a
workforce component migrated from a compatible public Apache-2.0 package.
Desktop and mobile tests exercise
the real local UI to backend-for-frontend to Node SDK to gateway path for an
employee age-over predicate and employer qualification evidence. The same
journey uploads a valid minimal PDF as a DIDComm attachment beside the
Schema.org `DigitalDocument`/`MediaObject` graph, verifies JWE-sealed Gateway
storage by retrieving the exact bytes in the BFF, and sends only the CID into
the qualification record. It never creates a FHIR `DocumentReference`.

The qualification editor searches the neutral Terminology service only through
the authenticated BFF and Node SDK. It persists the governed classification
system, release version, optional concept URI and code; English and Spanish
labels remain presentation metadata. The employer signs only its evidence
statement. The addressed education institution remains the only authority that
can confirm or reject the claimed issuer relationship in
`qualification-education-<zone>`.

The MVP delivery target is Demo. It uses the normal UI, BFF, public Node SDK
and gateway contracts with the six-second in-memory Fabric adapter. Demo must
keep the same components, options, validation and business flows designed for
future Test Network use, while every simulated transaction and receipt remains
visibly non-Fabric. Test Network remains disabled in the hosted portal until
the separately gated Fabric and service deployment exists; Kubernetes is not
an application requirement. Production is disabled.

The current flow covers authoritative organization binding, notifications,
identity and qualification evidence, the minimal PDF attachment, addressed
professional review and authoritative readback within one gateway process.
The hosted Demo is the current delivery gate. A separately operated Fabric
Test Network, initially allowed to use one orderer, is later work; Kubernetes
is optional infrastructure rather than a prerequisite.

The controller also lists Clearing House references addressed to its
authenticated organization and may confirm or reject a pending reference. The
list contains operational envelope data only; it does not expose confidential
evidence.

The portal pins exact reviewed releases of the public component package and
neutral Node SDK with a committed lockfile. Registry integrity and the full
local browser journey are release gates.

## Security boundary

Browser state never grants authority. A trusted server must resolve and verify:

1. the authenticated controller or delegated human-resources actor;
2. the exact organization and active assignment;
3. active group membership and reusable group authorization;
4. the exact administrative capability and jurisdiction; and
5. any separate subject authorization required by the requested operation.

Joining a group does not create an employee-specific Consent. Invitations and
membership changes may generate Communication notices, but a notification is
not authorization.

Reuse the wallet, secure-message and managed-profile security already
implemented by the shared core and Node.js SDKs. React never generates or
receives private keys and the portal does not reimplement cryptography. When a
controller action requires a natural-person signature, Dynamic Client
Registration exposes the separate signing public key while the private key
remains protected by the wallet. A cloud-managed wallet requires local
biometric unlock when available, with a governed PIN or password fallback. The
ceremony authorizes only a short-lived session bound to the authenticated user,
registered device, exact operation and document manifest. The BFF invokes the
managed wallet through the high-level SDK and returns only the proof and
receipt; lock, expiry, cancellation, replay or binding failure invalidates the
session. Authentication, approval, delivery and read state are not signatures.

## Local validation

Use Node.js 24:

```bash
npm install
CONTROLLER_DEMO_MODE=true npm run dev
```

Demo is the only enabled MVP profile. Existing deployment-stage configuration
must resolve Demo on the trusted server; the browser never chooses an adapter,
collection prefix, tenant, network, channel or chaincode. Test Network and
Production controls remain disabled and their server routes fail closed.

The BFF and gateway reuse their configured collection-prefix resolver so Demo
cannot read, write, search or enumerate Test Network or Production data. Do not
invent a second prefix mechanism or accept a prefix from React.

## Demo hosting handoff

The portal may be deployed as a Firebase App Hosting backend connected to this
GitHub repository. Bolt or another implementation agent prepares configuration
but never receives a service-account JSON key or raw hosting credentials. The
project owner authorizes the official Firebase GitHub application and selects
the Firebase project, region, backend and live branch in Firebase Console.
Runtime Firebase Admin/Firestore access uses Application Default Credentials;
secret values remain in Cloud Secret Manager and are referenced by name from
`apphosting.yaml`.

Prefer the reviewed Firestore vault for the low-infrastructure hosted Demo.
The shared gateway also proves PostgreSQL plus local IPFS. Its current
Supabase adapter is object storage, and its MongoDB initializer is not wired as
an equivalent vault repository; do not present either as a complete database
profile without the missing adapter and tests.

Firebase Authentication also requires more than enabling the Google provider.
The project must register this portal's web app, authorize `localhost` and the
four Beta portal domains, expose only the public web configuration, verify the
Firebase ID token in the BFF, and preserve popup-compatible response headers.
Follow the exact [Beta Firebase authentication handoff](docs/BETA_FIREBASE_AUTH.md).

Validation commands:

```bash
npm test
npm run typecheck
npm run build
npm run test:e2e
```

## Repository boundaries

- `antifraud-portal-components-react` owns controlled reusable UI.
- This repository owns controller navigation, host state and BFF calls,
  plus controller-authorized employee identity, age-over and employer
  qualification-evidence workflows.
- SDK and gateway packages own trusted transport, policy and persistence.
- The writing host owns its local addressed-reference index. The issuer's home
  host performs exact authenticated discovery across approved federation
  peers; no controller or issuer scans Fabric channels.

See [architecture and acceptance](docs/ARCHITECTURE_AND_ACCEPTANCE.md) and
[the shared multi-domain portal architecture](docs/MULTI_DOMAIN_PORTAL_ARCHITECTURE.md),
[the controller parity backlog](docs/CONTROLLER_PARITY_BACKLOG.md). Source
history is summarized in [provenance](docs/PROVENANCE.md). Portal UI is under
`antifraud.services`; the Foundation is a bounded tenant of
`host-beta.antifraud.services`, and its person-index services publish verified
bindings under `antifraud.online`.

## Licence

Copyright 2026 Antifraud Services Inc. Licensed under Apache-2.0.
