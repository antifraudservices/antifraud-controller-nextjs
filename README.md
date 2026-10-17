# Antifraud Controller Portal

Public, sector-neutral organization-controller portal for qualification and
identity-evidence services.

The controller manages the organization, departments, employees, invitations,
groups and reusable group authorizations. It never opens student, animal,
patient, qualification or identity-evidence records. Those operations belong
to professional portals. The first planned Antifraud professional profile is
`qualification-education`. Animal-sector workflows remain in the multisector
VetChain professional portal; there is no separate Antifraud animal portal.

## Current state

The local application contains a controlled fixture adapter for UI and
responsive testing. It reuses `antifraud-portal-components-react`, including
the workforce component migrated from the public Apache-2.0 UHC component
package.

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
- Professional portals own sector-specific subjects, evidence and professional
  policy. VetChain may consume the shared neutral Antifraud components.
- SDK and gateway packages own trusted transport, policy and persistence.

See [architecture and acceptance](docs/ARCHITECTURE_AND_ACCEPTANCE.md) and
[source provenance](docs/PROVENANCE.md).

## Licence

Copyright 2026 Antifraud Services Inc. Licensed under Apache-2.0.
