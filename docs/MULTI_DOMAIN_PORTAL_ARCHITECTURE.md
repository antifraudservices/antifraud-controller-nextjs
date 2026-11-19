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

### Admission policy in the host controller workspace

An authorized host controller chooses the admission policy for one sector
and network. The country selector accepts one country, an explicit list, or
all countries enabled for the host. Each request retains its exact
jurisdiction for evidence verification. The backend validates the
controller's host, network and sector assignment on each policy change.

| Scope | Admission policy |
| --- | --- |
| No matching rule, or review selected | The application requires review. |
| Enabled Test Network `-tech` rule | Automatic approval requires ICA verification for the configured sector and country coverage, plus every condition selected for that rule. |
| Production and other sectors | An authorized reviewer decides each application. |

A controller can return an eligible scope to review at any time. Reviewers
can select Pending review, Approved or Rejected for their assigned sector
and jurisdiction. Finalized cases are read-only and show the application,
decision and evidence references, the policy revision at the time of the
decision and whether approval was automatic or recorded by a reviewer when
that information is available. New decisions preserve the policy, the
effective list of eligible countries and its configured evidence conditions.
This includes resolving the host's enabled countries when a rule covers all
of them. A later policy change preserves the original
decision and its basis.

For example, a rule for a technical organization applying from Spain may
require the signed application template and a matching regional directory
entry. The applicant submits the signed application with its sector and
jurisdiction. ICA checks the template version and mandatory fields on the
same PDF whose signature and signer authority it verifies. It compares the
normalized legal identifier with the active official record and checks the
regional entry when the rule requires it. The backend binds the verified
result to the same application, host, network, sector and jurisdiction.
An eligible application that satisfies all checks advances to the licence
Offer and Order. Missing evidence keeps the application in review.

Veterinary and dental practices, research organizations and public bodies
follow the manual review process for their respective sectors. The reviewer
can use the ICA evidence collected for their jurisdiction.

Acceptance requires a Test Network test using registered Firebase virtual
phone accounts. An authorized host controller switches an eligible scope to
automatic approval and back to review. The test verifies the recorded policy
and decision, covers submissions that pass and lack the required evidence,
and confirms that sectors outside `-tech` remain under manual review even
when ICA confirms all evidence checks.

The online browser policy gate runs with
`npx playwright test --config playwright.test-network.config.ts`.
Supply `ANTIFRAUD_ADMISSION_E2E_ORIGIN`, `ANTIFRAUD_ADMISSION_E2E_HOST_DID`,
`ANTIFRAUD_ADMISSION_E2E_SECTOR` and `ANTIFRAUD_ADMISSION_E2E_COUNTRY`.
Use a dedicated Test Network technical sector configured for review with
no organization traffic. Supply `ANTIFRAUD_ADMISSION_E2E_PHONE` and
`ANTIFRAUD_ADMISSION_E2E_CODE` from the private virtual-phone fixture. The
test rejects emulator settings, reads each saved revision through the
portal, and restores review using the revision check. Browser traces,
screenshots and videos are disabled for this suite. This gate covers
controller authentication and policy persistence. The separate admission
journey must prove the ICA decision, licence purchase and DCR.

For App Hosting, assign the environment name `test-network` to the
dedicated controller backend. This selects
[`apphosting.test-network.yaml`](../apphosting.test-network.yaml). Provision
its Secret Manager references with the approved staging web app, controller
hostname profile and Gateway configuration. The web project and the
Firebase Admin project use the same project reference. Add the deployed
controller hostname to that project's Firebase Auth authorized domains.
Grant the backend's workload identity access to the secrets and to Firebase
Auth user lookup and Firestore in that project. The committed
`firebase.json` targets the Beta backend. Release the Test Network revision
through its own backend and verify the effective environment after rollout.
[App Hosting environment configuration](https://firebase.google.com/docs/app-hosting/multiple-environments)

The Test Network settings endpoint uses Firebase Admin to verify tokens from
the configured project and requires a phone-provider sign-in. Set the
project via `ANTIFRAUD_ADMISSION_FIREBASE_PROJECT_ID`. Set server-only
`ANTIFRAUD_ADMISSION_CONTROLLER_ASSIGNMENTS_JSON` to the authorized
assignments, each with a Firebase UID, verified phone number, host DID,
network and sector. The host profile supplies the allowed sectors and
jurisdictions. Firestore stores each policy revision and its audit event in
one transaction. Configure this collection for server access.

After proof verification and before creating the licence Offer, the Gateway
requests a decision with a dedicated service credential. Antifraud checks
the host, network, jurisdiction, sector and verified transaction binding.
For ICA evidence the Gateway supplies the application reference, proof
reference and verified checks. The decision endpoint reads the current rule
and commits the decision, rule revision and evidence references in one
Firestore transaction. It returns the decision and its reference. Repeating
an approved transaction returns the same decision when the ICA confirms
the original evidence and checks. An outage or mismatched evidence leaves
the request in review and preserves the historical approval. For signed PDF
applications the Gateway uses the same binding when it retries with the
same application and document.

Set `ANTIFRAUD_ADMISSION_POLICY_HOSTNAME` to the host-controller profile that
owns the policy. Its enabled sectors and jurisdictions bound the decision
service. Configure the dedicated Gateway bearer through secret references.

For manual review, add the exact permitted jurisdictions in the reviewer's
`reviewJurisdictions` assignment. Set `managePolicy: false` for a reviewer
who can decide cases without editing the host policy. The queue shows the signed application
reference while verification is pending. It displays the ICA evidence
reference and confirmed checks once available for the chosen sector
and jurisdiction. A reviewer can reject a case or approve when ICA confirms
the legal identifier and active official registration. The action uses the
displayed revision and records the reviewer's identity in the audit history.
The applicant can retry the same application after approval to receive the
licence Offer.

## Personal and professional portals

The same architecture applies to neutral personal or professional portals
exposed through approved host aliases. Shared screens and BFF operations
remain versioned once. A trusted manifest selects:

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

## Public organization service catalogs

The organization Controller creates and assigns the reusable `Places
management` and `Public Services management` Groups. Its UI stops at that
authorization boundary. Versioned shared management components will be
consumed by authorized personal and professional portals to create and
maintain Schema.org Places and client Services. Creating a Place or
Service is private by default. Publication is an explicit, separately
authorized action; a public Service must reference a public Place from its own
department.

The gateway publishes the resulting claims-first graph with a DCAT descriptor
whose jurisdiction, sector, publisher and access URL come from trusted server
configuration. Marketplace discovery may cache that descriptor and graph for a
bounded interval, revalidate stale entries, fetch newer versions, evict
withdrawn datasets and reject rollback or publisher mismatches. It does not
copy private organization structure into the public cache.

Schedules, Slots, Appointments, subjects and research studies remain outside
the public catalog and outside controller structure administration. A future
sector adapter may translate the Schema.org graph into FHIR without changing
the canonical controller record.

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
hostname-sensitive. A passkey registered for one portal's registrable domain
cannot be silently reused on another registrable domain. A deployment must
choose one of two explicit models:

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
5. Port sector-specific personal/professional screens to the shared modules.
6. Add jurisdiction content and enrollment providers independently.
7. Prove local UI to BFF to SDK to gateway readback, then local-network and
   Test Network in that order.

Fixtures, hidden navigation, HTTP success, queue acceptance and unit tests do
not prove the host directory or a lifecycle transition.
