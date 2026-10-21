# Shared portal service and trusted hostname profiles

## Decision

One deployed web service may serve several approved portal hostnames. The
server resolves an exact hostname profile and uses it to select presentation,
navigation, terminology, allowed sectors, jurisdictions and enrollment policy.
The browser cannot submit a hostname profile, sector, role, tenant, gateway,
Fabric zone, channel or smart-contract name.

This reduces duplicated deployments and prevents Vet, health, education and
future sector portals from drifting. It does not merge their meanings or their
authorization boundaries.

The same pattern is intended for four separately authorized portal families:

1. host administration;
2. organization administration;
3. professional workspaces; and
4. personal workspaces.

They may share one codebase, complete screens, components and neutral BFF
operations. A session authorized for one family does not acquire another
family's permissions because the same binary renders both.

## Trusted resolution

The ingress must replace, rather than append, forwarded host headers. The
server normalizes the resulting request hostname and performs an exact lookup
in `CONTROLLER_PORTAL_HOST_PROFILES_JSON`. Unknown hostnames fail closed. A
suffix match is never accepted.

Each profile contains only reviewed values:

- stable profile id and portal family;
- name, logo, accent and support URL;
- enabled modules;
- allowed organization sectors and jurisdictions; and
- the identifier of a server-side enrollment-policy resolver.

These values narrow available behavior. They never prove that the signed-in
actor is a controller, host operator, professional or subject. Every BFF call
revalidates the authenticated actor, exact organization, assignment,
capability, tenant and environment.

## Host organization directory

The host-operator page must not use the public autodiscovery catalog because
that catalog deliberately omits suspended and non-provider tenants. Its source
is the protected host registry search:

```text
POST /host/cds-<jurisdiction>/v1/<network>/registry/org.schema/Organization/_search
```

The request and response are wrapped in DIDComm and sent by the trusted BFF
over the gateway's protected transport. The inner response is a paginated
`Bundle`. Each successful entry is a privacy-minimized
`Organization` projection using `org.schema` claims. Entry failures are
`OperationOutcome` results under the normal Bundle response contract.

The host derives storage, environment and registry scope. The caller may
request only bounded filters such as jurisdiction, sector, lifecycle status,
legal identifier or display-name text plus a cursor and page size. The server
enforces a maximum page size and stable ordering. Results may include active,
suspended and revoked registrations but never tenant secrets, private keys,
wallet material, database coordinates or unrestricted configuration.

The directory supports these exact lifecycle commands for a selected tenant:

- `_status` reads authoritative state and dependency counts;
- `_disable` suspends the tenant after lifecycle gates pass;
- `_enable` reactivates a suspended tenant;
- `_purge` permanently removes a suspended tenant only after descendant and
  evidence checks pass.

Suspension is the ordinary reversible control. Purge is a separate destructive
operation and must never be presented as a synonym for disable. The portal
reloads the authoritative search result after every command.

## Jurisdiction and enrollment

Jurisdiction policy is resolved by a trusted backend provider, not by React.
For example, a production Spanish profile may require a qualified natural-
person certificate or legal-representative proof, while a Canadian or United
States profile may use a governed telephone activation ceremony. Test and
`-tech` sectors may deliberately use a different reviewed policy. These are
policy adapters behind the same enrollment screen, not separate copied pages.

The hostname profile only selects which reviewed provider may be considered.
The provider performs the proof and returns an auditable result.

## Personal and professional portals

The same architecture applies to a neutral personal or professional portal,
for example a generic staging hostname plus approved VetChain, UHC or SOSChain
aliases. Shared screens and BFF operations remain versioned once. A trusted
manifest selects:

- human or animal subject profile;
- jurisdictional terminology and required fields;
- professional roles and service capabilities;
- consent labels and policies;
- available clinical, emergency, communication and public-alert modules; and
- branding and help content.

Reusable controls do not make meanings interchangeable. `species` and `breed`
remain animal concepts; human race and ethnicity remain jurisdiction-specific
human concepts. Animal IPS currently has no advance-directive module, so that
screen is absent rather than emulated. Consent screens can be shared while the
server supplies the correct professional roles, purpose and policy.

## Assistants and governed content

Telephone and chat assistants consume the same trusted profile and the same
versioned policy/content service as the visual portal. Country-specific facts,
such as the minimum interval between donations or whether directed donation is
available, are governed content keyed by jurisdiction, subject kind, sector,
service and effective date. They are not hard-coded into prompts or selected
freely by the browser.

The assistant may explain or navigate. It does not create authority, choose a
tenant, change an enrollment proof requirement or turn informational content
into clinical advice.

## Authentication across aliases

Cookies, CORS, redirect URLs and WebAuthn relying-party identifiers are
hostname-sensitive. A passkey registered for `connecthealth.info` cannot be
silently reused on `vetchain.app` or `unid.online`, because they are different
registrable domains. A deployment must choose one of two explicit models:

- register a separate passkey for each relying-party domain; or
- authenticate at one canonical domain and return a short-lived, audience-
  bound authorization result to the branded portal.

Brand aliases must not weaken biometric policy or share a broad cookie across
unrelated registrable domains.

## Delivery sequence

1. Resolve and validate exact hostname profiles on the server.
2. Extract neutral complete screens and BFF operation contracts.
3. Add the protected host `Organization/_search` manager contract and paginated
   DIDComm Bundle readback.
4. Add the host-operator screen only after that contract is executable.
5. Port Vet, UHC and SOS personal/professional screens to the shared modules.
6. Add jurisdiction content and enrollment providers independently.
7. Prove local UI to BFF to SDK to gateway readback, then local-network and
   Test Network in that order.

Fixtures, hidden navigation, HTTP success, queue acceptance and unit tests do
not prove the host directory or a lifecycle transition.
