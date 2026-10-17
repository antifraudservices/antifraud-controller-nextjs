# Architecture and Acceptance

## Application separation

The controller portal and role portals are different applications.

The controller portal administers organizations, departments, employees,
invitations, groups and reusable group authorizations. It receives no subject
record, relationship, source claim or evidence file.

The initial planned Antifraud professional profile is
`qualification-education`, for authorized education roles. Its implementation
belongs to a separate repository and remains pending. Animal-sector workflows
belong to the existing multisector VetChain professional portal, whose home is
specialized by the active sector and professional role. VetChain may reuse the
neutral Antifraud components; no separate `qualification-animal` application
exists.

## Shared component boundary

`antifraud-portal-components-react` renders controlled state and emits user
intentions. The host owns authentication, localization, BFF calls and error
handling. The trusted backend derives all authority fields and returns the
authoritative result.

The neutral identity-evidence group currently lists:

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
   and gateway.

Unit tests, fixture Playwright, screenshots or a successful response alone do
not satisfy this condition.
