# Controller BFF contract

Bind each operation to the signed-in controller's registered profile. The
BFF resolves the tenant, jurisdiction, sector, provider DID and registered
device from that profile. Use the existing SDK transport to submit the signed
DIDComm request and poll its matching result. Confirm the result and project
only the fields needed by the screen.

## Existing resource operations

| Interaction | Existing BFF contract | Gateway operation |
| --- | --- | --- |
| Resolve an organization selected by the user | `POST /api/organizations/resolve` | Public tenant DID resolution. Use the result for navigation. |
| Read or change an enrolled organization's lifecycle | `POST /api/organizations/lifecycle` | Exact organization status or lifecycle command in the host registry, using the registered controller. |
| List or filter employees | `POST /api/employees/lifecycle` with the `list` action | Tenant `entity/org.schema/Employee/_search`, followed by `_search-response`. Send email or occupation filters using the employee search contract. Fetch seat data through the separate `License/_search` when the screen needs it. |
| Invite an employee | `POST /api/employees/invitations` | The SDK submits `Employee/_batch` and issues the employee activation credential using an available seat. |
| Change employee status | `POST /api/employees/lifecycle` | Submit the explicit employee action against the selected record, then read that resource back. |
| Read groups | Separate group operation using the registered controller | Use `organization/org.hl7.fhir.r5/Group/_search` and its polling endpoint where the gateway advertises that contract. |

Organization data loads independently. Open the employees or groups view to
perform its own read, with the filters supported by that resource. A mutation
refreshes the resources affected by that operation. The authorization for
the selected resource is evaluated at the BFF and gateway independently
of the visible portal tab.

## Migration status

The current controller Demo still loads `/api/controller/workspace`, which
calls the older gateway workspace endpoint and returns an aggregated
snapshot. It also reloads that snapshot after a mutation. Gateways that
implement the resource operations alone need the registered-controller BFF
adapter before the Demo workspace can use them.

Reuse the established tenant profile enrollment, wallet unlock and DCR
binding for that adapter. The host directory uses separate host authority.
Keep the independent resource errors visible. A missing aggregate endpoint
means the workspace could not be loaded. Only trusted feature configuration
or the targeted resource operation can determine that a capability is
unsupported.

The migration is verified when a normal controller session can read its
organization, search employees by email or occupation, and load groups where
supported. Exercise these requests through the real UI, BFF and gateway, and
verify that an unavailable group operation leaves employee reads usable.
Repeat on the local ledger network before a hosted rollout.
