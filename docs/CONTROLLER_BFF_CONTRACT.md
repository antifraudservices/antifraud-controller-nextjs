# Controller BFF contract

Bind each operation to the signed-in controller's registered profile. The
BFF resolves the tenant, jurisdiction, sector, provider DID and registered
device from that profile. Use the existing SDK transport to submit the signed
DIDComm request and poll its matching result. Confirm the result and project
only the fields needed by the screen.

## Existing resource operations

| Interaction | Existing BFF or SDK contract | Operations and readback |
| --- | --- | --- |
| Organization identity and status | `POST /api/organizations/resolve` and `POST /api/organizations/lifecycle` | Resolve the public DID for navigation. Read private organization status with the enrolled tenant controller. Verify disable, enable and purge for the exact organization in the host registry. |
| Controller profile and wallet | `POST /api/profiles/activation` and registered profile unlock | Exchange the activation credential through `Token/_exchange` and register the client through `Device/_dcr`. Verify the controller, tenant, device and signing identity when reopening the profile. |
| Employee directory | `POST /api/employees/lifecycle` with the `list` action | Submit tenant `Employee/_search` and poll `_search-response`. Preserve independent searches by email or occupation and the unfiltered list for that tenant. |
| Employee invitation and activation | `POST /api/employees/invitations` and `POST /api/employees/activation` | Create the invitation using an available seat through `Employee/_batch` and `License/_issue` as applicable. The recipient completes exchange and DCR. Confirm the employee and the seat assignment. |
| Employee lifecycle and recovery | `POST /api/employees/lifecycle` and `POST /api/profiles/employee-recovery` | Disable, reactivate or purge the selected employee. Purge requires inactive state. Confirm the resulting status and seat state. Recovery verifies a fresh OTP and updates the employee's wallet and session binding. |
| Licences | `POST /api/licenses` and the SDK licence search | Read seats and assignments using `License/_search`. Keep the request for additional seats, the confirmed order and authoritative seat readback as separate operations. |
| Devices | Device actions in `POST /api/employees/lifecycle` | Load the relevant seat and device assignments. Revoke one exact registered device through `Device/_revoke` and check the device and seat readback. |
| Departments | Department management and organization directory | Load and update the selected department. Keep its employee assignments independently addressable. |
| Groups and memberships | Group management and membership operations for the registered controller | Submit `organization/org.hl7.fhir.r5/Group/_search` and poll the response where the gateway advertises that operation. For writes, resolve approved group templates on the server. Confirm the selected group and any affected membership. |
| Notifications | Gateway-owned invitation, acceptance and lifecycle notifications | Read the authorized inbox on demand and verify that actionable references still resolve to the correct resource. |
| Identity and qualifications | Existing identity and qualification evidence actions | Preserve identity, age-over and employer evidence, including authorized attachment readback, within the exact organization boundary. An employer attestation retains its distinct authority. |
| Clearing House | Existing addressed-reference and decision actions | Read only references addressed to the authorized organization. Confirm decisions through their own receipt and readback. |
| Host operator administration | Separate host-controller BFF | Verify host eligibility for registry and admission operations. Keep the host directory and admission policies separate from tenant workforce privileges. |

Organization data loads independently. Open each view to perform its own
queries with the filters supported by its resource. A membership edit
refreshes only the affected resources and preserves unrelated assignments.
A catalogue publication permission is a capability assignment for the
authorized publisher. The publishing portal owns the catalogue workflow.

## Permissions and acceptance

Resolve authority from the registered session and evaluate it independently
for the requested resource and action. Where an endpoint accepts a SMART
access token, request only the scope needed and reuse a valid token only
within its granted scope and audience. For routes that use the registered
controller DIDComm contract, preserve that transport and the gateway's
resource-level authorization. A workspace summary conveys no authority
to search employees, read licences or devices, or manage groups.

Exercise every row for the capabilities the connected gateway supports.
Include the entire employee, licence, and device lifecycle with exact
readback. Verify that an unavailable group operation leaves employee and
licence reads usable, and that another tenant's identifiers cannot select
its staff, memberships, or devices.

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
