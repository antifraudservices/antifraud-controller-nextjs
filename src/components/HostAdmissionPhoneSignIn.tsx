'use client'

import { getApps, initializeApp } from 'firebase/app'
import { getAuth, inMemoryPersistence, RecaptchaVerifier, setPersistence, signInWithPhoneNumber, signOut, type ConfirmationResult, type User } from 'firebase/auth'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { HostAdmissionPolicyEditor } from './HostAdmissionPolicyEditor'
import { HostAdmissionReview } from './HostAdmissionReview'
import { HostOrganizationAdministration } from './HostOrganizationAdministration'

type FirebaseWebConfig = Readonly<{ apiKey: string; authDomain: string; projectId: string; appId: string }>

export function HostAdmissionPhoneSignIn({ firebase, sectors, jurisdictions, showCataloguePublication, directoryPortalName }: {
  firebase: FirebaseWebConfig; sectors: readonly string[]; jurisdictions: readonly string[]; showCataloguePublication?: boolean; directoryPortalName?: string
}) {
  const captcha = useRef<HTMLDivElement>(null)
  const verifier = useRef<RecaptchaVerifier | null>(null)
  const [number, setNumber] = useState('')
  const [code, setCode] = useState('')
  const [confirmation, setConfirmation] = useState<ConfirmationResult>()
  const [user, setUser] = useState<User>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [view, setView] = useState<'policy' | 'review' | 'directory'>('policy')

  useEffect(() => () => verifier.current?.clear(), [])

  const getToken = useCallback(async () => {
    if (!user) throw new Error('Phone sign-in required.')
    return user.getIdToken()
  }, [user])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (confirmation) {
        const credential = await confirmation.confirm(code.trim())
        setUser(credential.user)
        setCode('')
        return
      }
      if (!captcha.current) return
      const name = `host-admission-${firebase.projectId}`
      const app = getApps().find(candidate => candidate.name === name) || initializeApp(firebase, name)
      const auth = getAuth(app)
      await setPersistence(auth, inMemoryPersistence)
      verifier.current?.clear()
      verifier.current = new RecaptchaVerifier(auth, captcha.current, { size: 'invisible' })
      const session = await signInWithPhoneNumber(auth, number.trim(), verifier.current)
      verifier.current.clear()
      verifier.current = null
      setConfirmation(session)
    } catch {
      setError(confirmation ? 'The verification code could not be confirmed.' : 'Phone verification could not start.')
    } finally {
      setBusy(false)
    }
  }

  async function endSession() {
    const app = getApps().find(candidate => candidate.name === `host-admission-${firebase.projectId}`)
    if (app) await signOut(getAuth(app))
    setUser(undefined)
    setConfirmation(undefined)
    setNumber('')
    setView('policy')
  }

  if (user) return <div className="controller-main">
    <button type="button" onClick={() => { void endSession() }}>Sign out</button>
    <nav aria-label="Host admissions">
      <button type="button" aria-pressed={view === 'policy'} onClick={() => setView('policy')}>Admission policy</button>
      <button type="button" aria-pressed={view === 'review'} onClick={() => setView('review')}>Review queue</button>
      {directoryPortalName ? <button type="button" aria-pressed={view === 'directory'} onClick={() => setView('directory')}>Organization registry</button> : null}
    </nav>
    {view === 'policy'
      ? <HostAdmissionPolicyEditor sectors={sectors} getToken={getToken} showCataloguePublication={showCataloguePublication}/>
      : view === 'review' ? <HostAdmissionReview sectors={sectors} jurisdictions={jurisdictions} getToken={getToken}/>
        : directoryPortalName ? <HostOrganizationAdministration portalName={directoryPortalName} allowedSectors={sectors} getToken={getToken}/> : null}
  </div>

  return <main className="controller-main">
    <h1>Host controller sign-in</h1>
    <form onSubmit={submit}>
      {confirmation
        ? <label>Verification code <input value={code} autoComplete="one-time-code" inputMode="numeric" required onChange={event => setCode(event.target.value)}/></label>
        : <label>Test phone number <input value={number} type="tel" autoComplete="tel" required onChange={event => setNumber(event.target.value)}/></label>}
      <div ref={captcha}/>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={busy}>{confirmation ? 'Verify code' : 'Send code'}</button>
    </form>
  </main>
}
