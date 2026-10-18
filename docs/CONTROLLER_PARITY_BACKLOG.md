# Controller delivery status

Implemented and executable locally:

- authenticated organization context;
- gateway-owned employee, invitation, licence and device state;
- authoritative employee suspend, reactivate and inactive-only purge;
- persisted group and department creation and employee memberships;
- reusable group authorization with exact capabilities;
- Communication notification references for invitation, acceptance,
  membership and lifecycle changes;
- authoritative reload through the backend-for-frontend and public Node SDK;
- addressed Clearing House inbox and controller decision with receipt
  readback;
- employee identity and age-over evidence; and
- employer qualification evidence with PDF, PNG, JPEG or TIFF content hashed
  by the backend as CIDv1 raw with SHA3-384 before the gateway write.

Deployment gates still open:

- organization discovery, admission, controller activation and wallet
  recovery;
- authoritative organization legal details, public profile and locations;
- real licence purchase and inventory rather than the local five-seat profile;
- invitation acceptance by the recipient rather than the local fixture;
- employee one-time-password recovery;
- host-wide Clearing House retry, dead-letter and privacy-minimized
  observability; and
- durable restart proof, followed by the same journeys on the local Fabric
  network and Test Network.

The local in-memory result must not be described as deployed or production
ready until those gates have passed without skipped tests.
