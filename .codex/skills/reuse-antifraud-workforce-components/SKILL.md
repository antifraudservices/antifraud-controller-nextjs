---
name: reuse-antifraud-workforce-components
description: Reuse or implement product-neutral Antifraud workforce components in the generic SOS Gateway Controller Portal. Use for employee invitations, optional departments, operational or professional group membership, shared group authorization, identity-evidence permissions, assignment notifications, or migration away from product-specific controller screens.
---

# Reuse Antifraud Workforce Components

Read `docs/ANTIFRAUD_WORKFORCE_COMPONENT_REUSE.md` completely before changing
workforce behavior, components, adapters, authorization, or documentation.

Preserve these boundaries:

- `antifraud-data-utils-ts` owns neutral schemas, types, claims, and capability
  identifiers.
- `antifraud-sdk-core-ts` owns runtime-neutral orchestration.
- `antifraud-sdk-node-ts` owns trusted backend adapters.
- `antifraud-portal-components-react` owns controlled presentation and emits
  typed intentions only.
- this portal owns SOS routes, localization, session, controller binding,
  capability resolution, backend calls, and complete journeys.
- `antifraud-ica-node-ts` owns provider readback, issuance policy, signing, and
  non-personal audit.

Never create a Consent merely because an employee joins a group. Require an
active assignment, active membership in the exact group, and the active shared
authorization for that group and capability. Treat subject or lawful
representative authorization as a separate optional gate defined by the use
case.

Invitation department and group values are proposals and grant nothing before
acceptance and server-confirmed activation. Send invitation acceptance and
later assignment changes as Communication notices; never interpret a notice as
authority.

Controllers and authorized human-resources managers may record employee
identity and qualification evidence. Resolve an awarding organization by legal
identifier plus jurisdiction. Without a source-issued credential, label and
sign the result as an employer attestation; never impersonate the university
or licensing body. Preserve any later source credential as an additional proof
with its own issuer.

Treat provenance without authority substitution as the central Antifraud
invariant. In regulated health use, display and evaluate identity,
qualification, current professional licence, active employment, group
authorization, and subject authorization separately. Never derive professional
authority from an employer attestation alone.

For behavior changes, follow red-green-refactor. Start with the smallest
failing contract test, then prove the real local portal to backend to SDK to
gateway journey without mocked routes. Continue through local-network and Test
Network only after the earlier gate is green. Do not claim completion from
fixtures, screenshots, Storybook, HTTP success, or separate boundary tests.

Do not add unpublished local Antifraud dependencies to a releasable branch.
Release and verify changed shared packages from the lowest dependency upward,
then pin exact published versions in this portal.
