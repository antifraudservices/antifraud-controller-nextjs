# Controller delivery status

Implemented and executable locally:

- authenticated organization context;
- gateway-owned employee, invitation, licence and device state;
- authoritative employee suspend, reactivate and inactive-only purge;
- persisted group and department creation and employee memberships;
- a trusted `antifraud-tech` hostname role catalog for synthetic cross-sector
  professional portal testing, with backend rejection of caller-invented roles;
- reusable group authorization with exact capabilities;
- Communication notification references for invitation, acceptance,
  membership and lifecycle changes;
- authoritative reload through the backend-for-frontend and public Node SDK;
- addressed Clearing House inbox and controller decision with receipt
  readback;
- employee identity and age-over evidence; and
- employer qualification evidence with PDF, PNG, JPEG or TIFF content hashed
  by the backend as CIDv1 raw with SHA3-384 before the gateway write.
- protected host-registry `Organization/_search` with DIDComm, paginated
  Bundle readback and `OperationOutcome` entries, plus the separate host-only
  organization directory and status/suspend/reactivate/purge controls. The
  organization-controller session does not gain host authority.

Deployment gates still open:

- Shared-service hostname profiles for the remaining personal, professional
  and host screens, with exact ingress hostname allowlisting and independently
  verified authority for each portal family. The controller profile resolver
  is implemented; the remaining portal families are not yet migrated.

- [Organization discovery, admission, controller activation and wallet
  recovery](https://github.com/antifraudservices/antifraud-controller-nextjs/issues/1).
- [Authoritative organization legal details, public profile and
  locations](https://github.com/antifraudservices/antifraud-controller-nextjs/issues/2).
- [Real licence purchase and inventory rather than the local five-seat
  profile](https://github.com/antifraudservices/antifraud-controller-nextjs/issues/3).
- [Invitation acceptance by the recipient rather than the local
  fixture](https://github.com/antifraudservices/antifraud-controller-nextjs/issues/4).
- [Employee one-time-password
  recovery](https://github.com/antifraudservices/antifraud-controller-nextjs/issues/5).
- [Host-wide Clearing House retry, dead-letter and privacy-minimized
  observability](https://github.com/antifraudservices/antifraud-controller-nextjs/issues/6).
- [Complete authoritative Demo journeys and environment-prefix isolation](https://github.com/antifraudservices/antifraud-controller-nextjs/issues/7).

The Demo result must not be described as Fabric, Test Network, deployed or
production evidence. Test Network requires owner-provided Kubernetes and
configuration and is outside this MVP.
