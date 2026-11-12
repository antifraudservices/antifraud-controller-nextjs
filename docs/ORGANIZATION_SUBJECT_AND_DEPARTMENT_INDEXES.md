# Organizations as subjects and department-scoped indexes

Status: design proposal and acceptance requirements. Department and group
administration already exist in the source. This document does not establish
that organization-subject enrollment, confidential department indexes, their
permissions or document reassignment are implemented or deployed. It adds no
runtime, API, resource type, capability token or storage contract.

## Subject, service consumer and provider are separate dimensions

A legal organization can be the subject and customer of a service, just as a
person can receive services. That does not make the organization an index
operator. A school, professional practice or accounting organization can read
and create authorized records without hosting anyone else's indexes.

An organization can also supply services or operate indexes when independently
admitted and authorized for those capabilities. These capabilities must not be
inferred from legal registration, organization-subject enrollment, controller
status, sector selection or the presence of an organization in a directory.

For example, a company receives invoices and verified documents from legal and
accounting service providers. The company is the customer subject. An external
contributor, the receiving organization and the index operator remain distinct
parties, even when one deployment supports several of those roles.

The actor signs in as a verified person and acts for an authorized organization.
The organization subject is not the actor's personal identity, a financial
account, a patient or a provider credential.

## Organization hierarchy and index scope

Start with one legal organization and an Administration department. A department
is an organizational unit with a stable reference under its parent. It is not
automatically a separately registered legal entity. A department index is a
logical data and authorization scope; a separate personal card is unnecessary.
If a locator or QR is useful, it identifies the organizational unit/index scope,
not a new person or animal.

```text
Legal organization: customer subject
  Administration department: organizational unit
    Accounting index: sectoral context
      Received invoices: section
    Legal-services index: sectoral context
      Contracts: section
  Another department: separately authorized organizational unit
    Its configured sectoral indexes and sections
```

Keep these dimensions independent:

| Dimension | Meaning |
| --- | --- |
| Legal organization | The legally identified customer and parent authority context |
| Department | An organizational unit and departmental access boundary |
| Sectoral index | A configured domain context, such as accounting or legal services |
| Section | A governed category within that index, such as received invoices or contracts |
| Index provider | The separately verified service operating the index |
| Group and authorization | Who may perform which operations within an exact scope |

Several departments may use the same sectoral index template. A department may
need more than one sectoral context. Neither the department name nor a section
label creates a permission, collection prefix, tenant or network route.

Separate authorization does not by itself require a separate database, key or
ledger channel for every department. The provider must map the reviewed scope
to its real isolation and key-custody adapters and prove that mapping. A Fabric
channel is never a department, group, document section or communication thread.

## First enrollment and later growth

1. Verify the actor, legal organization, representation and target service
   enrollment through the existing trusted BFF and SDK boundaries.
2. Enroll the organization as a customer subject, without enabling provider or
   host-operator capabilities implicitly.
3. Establish the parent organization's authoritative index-provider binding.
4. Create the initial Administration unit/index scope under explicit policy.
5. Let authorized controllers create further departments and reviewed groups.
6. Assign documents and permissions to explicit departmental scopes.

Subject enrollment and document work belong to the authorized subject or
professional workspace. The Controller portal owns structure, delegation,
membership and reviewed authorization administration. This proposal does not
move subject creation or operational document editing into Controller screens.

Creating a department must not disclose another department's documents,
metadata, search counts or history. Cross-department access is an explicit,
current authorization, not a consequence of a shared parent or provider.

## Provider inheritance and configurable creation fields

The common creation screen renders trusted configuration and host-supplied
state. It does not discover providers, select tenants or grant authority.

| Creation profile | Provider default | Provider selector | Name fields | Birth and sex fields |
| --- | --- | --- | --- | --- |
| Department | Parent organization's authoritative provider | Hidden by default | Optional trading/display name; optional local legal-name field only if the reviewed profile needs it | Absent |
| Legal organization subject | Reviewed portal default or explicit eligible choice during enrollment | Controlled by enrollment policy | Trading name; official legal identity supplied or verified under jurisdiction policy | Absent |
| Primary individual card | Reviewed default or eligible choice | Controlled by portal policy | Preferred name and configured legal-name fields | Profile-dependent |
| Dependent individual card | Primary card's authoritative provider | Optional only when portal policy permits an override | Profile-dependent | Profile-dependent |

Provider inheritance is resolved and validated by the BFF from the authorized
parent or primary-card binding. A hidden selector is not enforcement. A
modified request must not override an inherited-only provider. An allowed
override must still belong to the current eligible catalog and support the
requested subject profile. An incompatible inherited provider must produce
clear feedback; it must not silently route the record elsewhere.

Field labels, visibility, requiredness and defaults are configurable. The
backend validates the same subject-specific contract. Hidden department birth
or sex fields must not survive in submitted data or be accepted as department
attributes. An optional department name can receive a reviewed default or
generated label; it must not force the user to invent personal information.

The department's display information must not change the parent company's
verified legal name or registration. Human, animal, legal-organization and
department adapters retain distinct meanings behind the shared renderer.

Use **Preferred name** / **Nombre habitual** for the individual's informal
display-name field, not **Family name**, which denotes a surname. Organization
or department profiles may label their corresponding configured field
**Trading name** / **Nombre comercial**. Label reuse does not make those
properties legally or semantically equivalent.

## Administration, legal representation and confidential data

The following are proposed permission profiles, not new wire-level roles.
Verified legal representation, a service-controller assignment, group
membership, index operation and document access remain independent checks.

| Actor context | Administration | Confidential document access |
| --- | --- | --- |
| Legal representative or legally authorized controller | Only the granted organization and delegation actions | Departmental or organization-wide access only under an explicit reviewed grant; representation alone is not blanket read access |
| Technical controller | Only delegated structure, membership and operational administration | No implicit plaintext read; no unrestricted content replacement |
| Department employee | Exact active assignment, group and operation scope | Only the authorized departments, sections and actions |
| External document contributor | No internal structure authority | May submit approved documents to a named scope; submission does not grant history read |
| Host/index operator | Operational custody, routing and delivery under host policy | No automatic tenant decision or confidential-content access |

Managing groups must not let a technical administrator grant themselves
confidential read access. Protected policy changes and sensitive memberships
need independently authorized approval or an equally strong server-enforced
delegation boundary. A browser-hidden button is insufficient.

Write without read means a specific permitted operation: for example, appending
an authorized new document or updating an allowed administrative field without
receiving existing confidential content. It does not mean replacing arbitrary
unseen documents, changing issuer assertions, deleting history or reading data
through error responses, search metadata or returned diffs. Such operations
need separate contracts, field restrictions, revision checks and receipts.

An organization-wide grant remains subject to sensitivity, third-party and
issuer restrictions. It must not become unrestricted access to personal
employee or client records merely because the organization is their employer
or service provider.

## Department reassignment and document provenance

Reassignment is a governed operation involving the source and destination
scopes, not a browser-side change of subject identifier. It must preserve the
document's logical identity, original legal parties, issuer proof, versions,
attachments and audit trail, while applying the destination's permissions and
the reviewed source retention policy.

An invoice addressed to the parent company does not acquire a different legal
customer when it is routed internally. Department routing can be maintained as
separate authorized indexing metadata. If a department reference is part of a
signed payload, that payload cannot be silently rewritten: preserve the
original and use the appropriate corrective version or signed transfer record.

Specify concurrency, idempotency, partial-failure recovery, notification,
retention and former-reader revocation before implementation. Cross-provider
transfer is a separate, more demanding case; it must not be implied by an
internal reassignment screen.

## Existing sources and implementation gaps

Source inspection confirms that organization context, department/group
administration, reusable authorization, employee memberships and operational
host/tenant separation already have owning modules. These are prerequisites,
not proof of confidential organization-subject indexes or department transfer.

The next design/implementation work must establish the organization-subject
enrollment contract, authoritative provider inheritance, departmental data
scope, grants and membership approval, protected search, write-only operations,
document reassignment and recovery. No endpoint or capability is created by
the names used in this document.

Common entry, sign-in, PIN protection, feedback and generic creation controls
belong to `antifraud-common-components-react`. Structure and host/tenant
administration belong to `antifraud-hosting-components-react`. Specialized
professional evidence presentation remains in its own component layer.
Host-owned configuration supplies fields, sectors, terminology and policy;
BFFs, SDKs and gateways enforce authority and persistence.

This proposal changes no existing care-portal subject, card, encounter, consent,
clinical-section or deployment behavior. Domain-specific fields and modules
must remain extensions; an absent domain concept is not simulated in another
subject profile.

## Acceptance requirements before any completion claim

1. Enroll a customer organization without obtaining provider or host authority.
2. Create the default unit and a second department through authorized normal UI;
   reload and obtain authoritative readback of the exact references.
3. Submit a document to one department; an unauthorized employee in another
   department cannot retrieve it or infer it from search, counts or errors.
4. A reviewed cross-department grant permits only its named scopes and expires
   or revokes on a fresh read without stale browser access.
5. A technical administrator cannot open documents or self-elevate through
   group, policy, membership or delegation changes.
6. A bounded write-only action succeeds without disclosing prior content;
   unauthorized field changes, overwrites and replay fail safely.
7. Inherited-only creation rejects provider tampering; a permitted override
   validates the current eligible provider and subject capabilities.
8. Department creation requires no personal birth/sex data and rejects such
   fields at the trusted boundary. Optional name defaults preserve parent legal
   identity and produce a usable display label.
9. Reassign a document with authorized source/destination handling, preserving
   issuer proof and original legal parties. Prove readback, retry, concurrent
   modification, failure recovery and the reviewed former-reader policy.
10. Unknown sectors, departments, purposes, roles and disabled capabilities
    fail closed; configuration never manufactures authority.
11. Reuse the same controlled screens across supported sector and subject
    profiles, with readable light/dark themes and feedback beside its action.
12. Prove the affected real UI to BFF to high-level SDK to gateway journey and
    its persistence boundary before the required environment promotions.

These requirements are pending. Unit tests, diagrams, menus, fixtures, HTTP
success or a simulated receipt alone do not satisfy them.

## Vocabulary and patent status

Schema.org [Organization](https://schema.org/Organization) and
[department](https://schema.org/department) provide a standard organizational
relationship. [Invoice](https://schema.org/Invoice) permits an organization as
the customer. These vocabulary definitions do not prescribe authorization,
storage isolation or the proposed enrollment and reassignment workflows.

Implementation must map reviewed concepts to existing governed flat claims and
versioned adapters before adding any extension. No native resource, claim
namespace, identifier format or ledger layout is invented here.

Patent coverage is not assessed. No filing has been reviewed for this proposal,
and this document makes no claim about coverage, novelty or legal protection.
