# Source Provenance

The initial controller shell was migrated from the local
`sos-gw-controller-nextjs` implementation. Product and deployment identifiers
were removed; the resulting application is owned by Antifraud Services Inc.

The controlled workforce UI is consumed from
`antifraud-portal-components-react`. That package records the migration of
`OrganizationWorkforceAdministration` and its required styles from the public
Apache-2.0 `uhc-portal-components-react` source at commit `33d9a8d`.

No external-product, tenant, gateway host, personal data, credential or
internal prompt is copied into this public repository.
