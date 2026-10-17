# Antifraud Controller Portal

Public, sector-neutral organization-controller portal for qualification and
identity-evidence services.

The controller manages the organization, departments, employees, invitations,
groups and reusable group authorizations. It also provides controller views of
the Clearing House inbox. A tenant controller sees only claims addressed to
its organization and may act or delegate exact review capabilities. A host
controller sees routing, delivery failures and unclaimed-reference envelopes,
but has no implicit right to open confidential tenant evidence or decide for a
tenant. Subject work delegated to employees belongs to role portals.

## Current state

The local application contains a controlled fixture adapter for UI and
responsive testing. It reuses `antifraud-portal-components-react`, including
a workforce component migrated from a compatible public Apache-2.0 package.

This is not production or gateway proof. Authentication, authoritative
organization binding, persistence, notifications and authorization readback
still require a trusted backend-for-frontend and real gateway integration.

The unpublished component package is temporarily linked from the adjacent
workspace for local development. A public release must replace that link with
an exact published version and committed lockfile.

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
- This repository owns controller navigation, host state and future BFF calls.
- Role portals own sector-specific subjects, evidence and professional policy.
  Other public applications may consume the shared neutral components.
- SDK and gateway packages own trusted transport, policy and persistence.
- The writing host owns its local addressed-reference index. The issuer's home
  host performs exact authenticated discovery across approved federation
  peers; no controller or issuer scans Fabric channels.

See [architecture and acceptance](docs/ARCHITECTURE_AND_ACCEPTANCE.md) and
[source provenance](docs/PROVENANCE.md).

## Licence

Copyright 2026 Antifraud Services Inc. Licensed under Apache-2.0.
