# Changelog

All notable changes to this project are documented here.

## Unreleased

- Publish the controller delivery gates as repository-owned GitHub issues and
  link the parity backlog to their executable acceptance work.
- Permit the synthetic controller authority only in local development or an
  explicitly declared staging demo, while Test Network and production remain
  fail-closed.
- Document that interactive local portal acceptance targets real
  `local-network` Fabric and that staging demo persistence uses the same gateway
  contract with a six-second simulated ledger delay.
- Pin the verified `antifraud-sdk-node-ts@0.2.2` release, including
  `antifraud-sdk-core-ts@0.1.2` and `antifraud-data-utils-ts@0.1.3`, for the
  explicit three-state issuer-resolution and governed document-CID contracts.
- Replace browser-only workforce fixtures with authenticated gateway state for
  organization, licences, employees, invitations, devices, groups,
  departments, memberships, reusable authorizations and notifications.
- Reload authoritative workspace state after every mutation and prove that it
  survives a browser reload during the local gateway process.
- Add optional initial group and department selections to invitations.
- Add the addressed Clearing House inbox and confirmation or rejection action
  without exposing confidential evidence or browser-owned authority.
- Add the neutral controller evidence workspace for employee identity,
  age-over predicates and employer-reviewed qualification evidence.
- Add desktop and mobile Playwright coverage for the employee age-over editor
  and employer qualification flow through the real local BFF, Node SDK and
  in-memory gateway, with returned transaction identifiers.
- Hash PDF, PNG, JPEG and TIFF fixtures in the local BFF as CIDv1 raw with
  SHA3-384 instead of relying on unsupported browser Web Crypto algorithms.
- Assert that browser evidence intents contain no actor, assignment, group
  authorization, channel, zone or smart-contract authority.
- Pin the published `antifraud-portal-components-react@0.1.0` artifact and
  synchronize the lockfile with its verified registry integrity.
- Align controller theme variables and responsive workforce selectors with the
  public component package's neutral `afpc-*` namespace.
- Keep the browser journey focused on accessible lifecycle behavior instead of
  private component CSS class names.
- Establish the public Antifraud-owned controller application.
- Consume the controlled Antifraud workforce component migrated from the
  compatible public Apache-2.0 component package with provenance retained.
- Add the neutral identity-evidence group and exact create, update, evidence,
  verification, subject-attestation and relationship-attestation capabilities.
- Specify active assignment plus active group membership and reusable group
  authorization, with separate optional subject authorization and no
  employee-specific Consent.
- Define invitation and assignment-change Communication notices and the
  executable completion journey required before the integration is claimed.
- Define controller and authorized human-resources employee evidence for staff
  identity and qualifications, including authoritative organization lookup and
  separate employer and source-issuer proofs.
- Replace the placeholder permissions and scheduling destinations with a
  controller-owned groups and departments workspace.
- Add employee filtering and collapsible group and department memberships.
- Add group-centric member lists and creation of neutral employee groups and
  organization departments.

## 0.1.0 - Unreleased

- Migrate and neutralize the controller shell as the initial local baseline.
