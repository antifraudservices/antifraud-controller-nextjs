# Beta Firebase authentication handoff

This portal uses the shared `Antifraud Beta` Firebase project
(`project-f70afb24-dd73-4fb4-be5`) and its separately registered web app:

- display name: `Antifraud Controller Beta`;
- Firebase app ID: `1:982931712028:web:38c7ae8e846d4ff65857d9`; and
- public portal origin: `https://controller-beta.antifraud.services`.

Firebase Authentication is common infrastructure for the four Beta portals,
but each portal has its own web-app registration and App Hosting backend. A
valid Firebase session authenticates the human only. It never grants
controller, employee, organization, subject, evidence, wallet or signing
authority.

## Console checklist

1. In **Authentication > Sign-in method**, enable Google and select
   `cto@antifraud.services` as the project support email.
2. In **Authentication > Settings > Authorized domains**, retain the generated
   `firebaseapp.com` and `web.app` domains and authorize `localhost`,
   `controller-beta.antifraud.services`,
   `professional-beta.antifraud.services`,
   `personal-beta.antifraud.services` and `social-demo.antifraud.services`.
   Firebase domains do not include ports. Use `http://localhost:<port>` for a
   live local Google login; `127.0.0.1` is a different hostname.
3. Associate this web app with the controller App Hosting backend and add its
   generated/custom hostname to Authorized domains before browser acceptance.
4. Keep Test Network and Production disabled. This Firebase project and these
   hostnames belong to the Beta environment, whose only executable MVP profile
   is Demo.

Projects created after 28 April 2025 do not authorize `localhost` by default,
so local Google login requires the explicit entry above.

## Runtime contract

The browser receives only Firebase's public web configuration:
`NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`,
`NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`,
`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` and
`NEXT_PUBLIC_FIREBASE_APP_ID`. These values identify the app; they are not a
service-account credential.

The BFF uses `FIREBASE_PROJECT_ID=project-f70afb24-dd73-4fb4-be5`, Application
Default Credentials where Admin/Firestore access requires them, and Firebase
Admin `verifyIdToken`. It accepts only the exact Firebase issuer
`https://securetoken.google.com/project-f70afb24-dd73-4fb4-be5` and audience
`project-f70afb24-dd73-4fb4-be5`. Downstream trusted-provider configuration
must use those exact values. Token validity never substitutes for the portal's
server-side controller and capability checks.

For local browser testing, either use the Auth Emulator with synthetic users
or use live Google login with the real public Firebase web configuration and
`localhost`; do not combine both paths. Local Admin/Firestore access uses
Application Default Credentials or its emulator, never a downloaded JSON key.
App Hosting supplies runtime identity automatically and secrets are referenced
through Secret Manager.

Google popup compatibility is part of acceptance: retain
`Cross-Origin-Opener-Policy: same-origin-allow-popups` where an opener policy is
needed, and do not apply global
`Cross-Origin-Embedder-Policy: require-corp`. The latter blocks Firebase's
cross-origin helper iframe and can surface as the misleading
`auth/popup-closed-by-user` failure.

## Service-domain boundary

The four `antifraud.services` names are portal origins. In Demo, Antifraud
Foundation is one bounded tenant of the gateway hosted at
`host-beta.antifraud.services`; host operation does not grant that tenant
authority over any other tenant. Its person-index services belong under
`antifraud.online` and publish their exact HTTPS or `did:web` service binding
separately. React, a login email and an App Hosting hostname never select or
confer authority over a person-index service.

## Acceptance evidence

Prove a real local Google popup login, BFF token verification, rejection of a
wrong issuer/audience and authoritative portal reload. Also verify the final
App Hosting/custom hostname in a browser. An enabled provider, HTTP 200,
fixture, emulator-only test or screenshot is not sufficient evidence.
