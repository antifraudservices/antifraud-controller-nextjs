# Publish entries as an organization controller

Open the portal’s Test Network page and sign in with the phone number registered
for the organization. Under **Organization catalogue**, paste a JSON:API
document with a `data` array containing either products or services. Select
**Publish catalogue entries**. Use the same type and entry ID to update an
entry. The portal shows the latest public offerings after the gateway confirms
the update.

The host catalogue points to the tenant DCAT catalogue. Follow its
`dcat:service` entry to the public offerings feed to check what consumers
discover. This publication updates the catalogue. A service credential is
maintained through its separate issuance flow.

## Enable in a controlled deployment

Enable `CONTROLLER_CATALOGUE_ENABLED` on an organization-controller portal in
Test Network. Configure the Firebase web settings and set
`CONTROLLER_CATALOGUE_FIREBASE_PROJECT_ID` to the same project. Set
`CONTROLLER_CATALOGUE_GATEWAY_ORIGIN` and
`CONTROLLER_CATALOGUE_KMS_KEY` in the server deployment. Limit the portal
profile to the allowed jurisdictions and sectors.

The server uses the already registered controller profile held by authorized
operators in the server-only `registeredControllerCatalogueProfiles`
collection. The document ID and owner must match the Firebase account. Store
the registered profile ID, wallet derivation ID, operational controller and
provider DIDs, device client ID, tenant issuer, route context and registered
public keys. Seal the existing wallet seed with the configured KMS key and
authenticate the JSON array of owner ID, profile ID, provider DID, actor DID
and client ID as additional authenticated data. The portal never takes the
tenant route or signing material from a browser request. Use Firestore rules
that deny direct client access to this collection.

## Run the browser journey

Against a provisioned test portal and gateway, run
`npx playwright test --config playwright.catalogue.config.ts`. Set
`CONTROLLER_CATALOGUE_E2E_PORTAL_ORIGIN` and
`CONTROLLER_CATALOGUE_E2E_PUBLIC_FIXTURE` to the portal origin and the fixture
file. The fixture has the gateway origin in `gateway`, two DCAT paths in
`hostCataloguePath` and `tenantCataloguePath`, and one valid product JSON:API
entry in `offering`. Use the existing private virtual-phone configuration for
`E2E_CONTROLLER_FIREBASE_PHONE_NUMBER` and
`E2E_CONTROLLER_FIREBASE_PHONE_CODE`. Set
`E2E_OTHER_FIREBASE_PHONE_NUMBER` and `E2E_OTHER_FIREBASE_PHONE_CODE` for a
different account with no tenant profile.
