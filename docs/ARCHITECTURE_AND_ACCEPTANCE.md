# Architecture and Acceptance

## Application boundary

The controller portal administers organizations, departments, employees,
invitations, groups and reusable group authorizations. It also owns the
controller-authorized employee identity-evidence, age-over and employer
qualification-evidence workflows and renders controller views of addressed
Clearing House items. This does not turn host administration into tenant,
issuer or unrestricted evidence authority.

A host controller may operate peer discovery, queues, retries, dead letters,
delivery receipts and unresolved protected organization references. It sees
only the minimum operational envelope and cannot open confidential evidence or
submit a tenant decision merely because it operates the host.

Its observability view may show total pending counts and aggregates by tenant,
addressed destination, domain, lifecycle and delivery state. The portal may
resolve legal identifier and jurisdiction for the authenticated host
controller's operational display, but logs, metrics and cross-host indexes use
protected references. It shows attempts, retry state, receipt and a safe error
category without bodies, evidence, tokens or unrestricted diagnostics.

A tenant controller may list only items addressed to its verified
organization. Subject to exact evidence-access policy, it may inspect an item,
act under controller authority or delegate separate list, open, compare,
propose, approve and submit capabilities to a group. An authorized controller
or human-resources employee may record evidence about an employee through this
portal. Users without controller administration authority do not receive these
screens.

## Shared component boundary

`antifraud-portal-components-react` renders controlled state and emits user
intentions. The host owns authentication, localization, BFF calls and error
handling. The trusted backend derives all authority fields and returns the
authoritative result.

The identity-evidence group currently lists:

- `identity.subject.create`
- `identity.subject.update`
- `identity.evidence.record`
- `identity.claim.verify`
- `identity.subject.attest`
- `identity.relationship.attest`

Displaying a capability is not proof that the actor holds it.

## Completion condition

The controller portal is complete only when an executable journey proves:

1. a verified controller bound to one organization creates a group and its
   reusable authorization;
2. an invitation may propose a department and groups but grants nothing before
   acceptance and authoritative activation;
3. membership changes, suspension and reactivation persist and produce the
   required Communication notices;
4. removal from one group blocks only that employee and preserves the shared
   authorization for other members;
5. mismatched organization, inactive assignment, inactive membership, missing
   capability and caller-authored authority fields fail closed; and
6. a reload reads the authoritative state through portal, BFF, high-level SDK
   and gateway;
7. a tenant controller sees only its organization's addressed items and can
   delegate review without creating employee-specific Consent;
8. a host controller can recover a failed delivery but cannot retrieve the
   confidential evidence or decide for the tenant; and
9. the issuer's home host discovers pending references through exact
   authenticated peer-host queries over local indexes without listing Fabric
   channels; and
10. host and tenant observability expose only their authorized pending counts,
    delivery status, receipts and safe failures;
11. an authorized controller or human-resources actor records employee
    identity evidence and age-over predicates through BFF, high-level SDK and
    gateway without browser-supplied authority; and
12. employer qualification evidence remains distinct from issuer confirmation
    or a wallet credential.

Unit tests, fixture Playwright, screenshots or a successful response alone do
not satisfy this condition.

The current local increment proves UI to backend-for-frontend to Node SDK to
in-memory gateway writes and authoritative readback for organization,
workforce, reusable authorizations, notifications, identity age-over and
employer qualification evidence. It does not yet satisfy the deployed-network
condition because durable Fabric restart/readback, Clearing House federation
and Test Network journeys have not been proven.
