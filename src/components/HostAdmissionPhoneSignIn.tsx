'use client'

import { useState } from 'react'
import { HostAdmissionPolicyEditor } from './HostAdmissionPolicyEditor'
import { HostAdmissionReview } from './HostAdmissionReview'
import { HostOrganizationAdministration } from './HostOrganizationAdministration'
import { FirebasePhoneSignIn, type FirebaseWebConfig } from './FirebasePhoneSignIn'

export function HostAdmissionPhoneSignIn({ firebase, sectors, jurisdictions, showCataloguePublication, directoryPortalName }: {
  firebase: FirebaseWebConfig; sectors: readonly string[]; jurisdictions: readonly string[]; showCataloguePublication?: boolean; directoryPortalName?: string
}) {
  return <FirebasePhoneSignIn firebase={firebase} name="host-admission" title="Host controller sign-in" phoneLabel="Test phone number">
    {getToken => <HostAdmissionNavigation sectors={sectors} jurisdictions={jurisdictions} getToken={getToken}
      showCataloguePublication={showCataloguePublication} directoryPortalName={directoryPortalName}/>}
  </FirebasePhoneSignIn>
}

function HostAdmissionNavigation({ sectors, jurisdictions, getToken, showCataloguePublication, directoryPortalName }: {
  sectors: readonly string[]; jurisdictions: readonly string[]; getToken: () => Promise<string>
  showCataloguePublication?: boolean; directoryPortalName?: string
}) {
  const [view, setView] = useState<'policy' | 'review' | 'directory'>('policy')
  return <>
    <nav aria-label="Host admissions">
      <button type="button" aria-pressed={view === 'policy'} onClick={() => setView('policy')}>Admission policy</button>
      <button type="button" aria-pressed={view === 'review'} onClick={() => setView('review')}>Review queue</button>
      {directoryPortalName ? <button type="button" aria-pressed={view === 'directory'} onClick={() => setView('directory')}>Organization registry</button> : null}
    </nav>
    {view === 'policy'
      ? <HostAdmissionPolicyEditor sectors={sectors} getToken={getToken} showCataloguePublication={showCataloguePublication}/>
      : view === 'review' ? <HostAdmissionReview sectors={sectors} jurisdictions={jurisdictions} getToken={getToken}/>
        : directoryPortalName ? <HostOrganizationAdministration portalName={directoryPortalName} allowedSectors={sectors} getToken={getToken}/> : null}
  </>
}
