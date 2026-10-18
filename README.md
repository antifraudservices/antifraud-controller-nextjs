# Antifraud Controller Portal

Public, sector-neutral organization-controller portal for qualification and
identity-evidence services.

The controller manages the organization, departments, employees, invitations,
groups and reusable group authorizations. It also provides controller views of
the Clearing House inbox. A tenant controller sees only claims addressed to
its organization and may act or delegate exact review capabilities. A host
controller sees routing, delivery failures and unclaimed-reference envelopes,
but has no implicit right to open confidential tenant evidence or decide for a
tenant. This neutral portal also owns controller-authorized employee identity
evidence, age-over predicates and employer-reviewed qualification evidence.
Those operations do not grant clinical or product-sector authority.

## Current state

The local application contains controlled organization/workforce fixture state
for UI testing. It reuses `antifraud-portal-components-react`, including a
workforce component migrated from a compatible public Apache-2.0 package. The
evidence journey is no longer callback-only: desktop and mobile tests exercise
the real local UI to backend-for-frontend to Node SDK to gateway path for an
employee age-over predicate and employer qualification evidence.

This is local in-memory gateway proof, not Fabric, Test Network or production
proof. Production authentication, authoritative organization binding,
durable persistence, notifications and authorization readback remain open.

The portal pins the public `antifraud-portal-components-react@0.1.0` release
with a committed lockfile. The BFF uses the neutral Node SDK during the local
evidence journey; its exact registry dependency is a release gate.

## Security boundary

Browser state never grants authority. A trusted server must resolve and verify:

1. the authenticated controller or delegated human-resources actor;
2. the exact organization and active assignment;
3. active group membership and reusable group authorization;
4. the exact administrative capability and jurisdiction; and
5. any separate subject authorization required later by a role portal.

Joining a group does not create an employee-specific Consent. Invitations and
membership changes may generate Communication notices, but a notification is
not authorization.

## Local validation

Use Node.js 24:

```bash
npm install
CONTROLLER_DEMO_MODE=true npm run dev
```

Validation commands:

```bash
npm test
npm run typecheck
npm run build
npm run test:e2e
```

## Repository boundaries

- `antifraud-portal-components-react` owns controlled, product-neutral UI.
- This repository owns controller navigation, host state and BFF calls,
  plus controller-authorized employee identity, age-over and employer
  qualification-evidence workflows.
- Role portals own sector-specific professional policy. This increment adds no
  Antifraud action to a veterinarian or another sector-specific role. Other
  public applications may consume the shared neutral components.
- SDK and gateway packages own trusted transport, policy and persistence.
- The writing host owns its local addressed-reference index. The issuer's home
  host performs exact authenticated discovery across approved federation
  peers; no controller or issuer scans Fabric channels.

See [architecture and acceptance](docs/ARCHITECTURE_AND_ACCEPTANCE.md) and
[the controller parity backlog](docs/CONTROLLER_PARITY_BACKLOG.md). Source
history is summarized in [provenance](docs/PROVENANCE.md).

## Licence

Copyright 2026 Antifraud Services Inc. Licensed under Apache-2.0.
