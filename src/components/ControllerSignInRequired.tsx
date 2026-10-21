'use client'

import { useState } from 'react'
import { PortalSignInPanel, type PortalSignInPanelCopy } from 'antifraud-common-components-react'

const COPY: PortalSignInPanelCopy = Object.freeze({ eyebrow: 'Controller access', title: 'Controller sign-in required', description: 'The trusted backend must verify controller authority for one exact organization.', provider: 'Continue with configured identity provider', separator: 'or', email: 'Email', sendEmailCode: 'Send code', emailCode: 'Verification code', verifyEmailCode: 'Verify code', changeEmail: 'Change email', emailCodeSent: 'Code sent to {email}', passkeyHint: 'Use an enrolled device when available.', passkey: 'Use passkey', demoEmail: 'Demo email', demoCode: 'Demo code', demoSubmit: 'Enter demo', demoHint: 'Only configured synthetic identities are accepted.', busy: 'Connecting' })

export function ControllerSignInRequired({ mode, supportUrl }: Readonly<{ mode: 'trusted' | 'demo'; supportUrl: string }>) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  return <main className="gate-shell"><section className="gate-panel"><PortalSignInPanel mode={mode} copy={COPY} email={email} emailCode={code} actionsEnabled={false} onEmailChange={setEmail} onEmailCodeChange={setCode}/><a href={supportUrl}>Deployment support</a></section></main>
}
