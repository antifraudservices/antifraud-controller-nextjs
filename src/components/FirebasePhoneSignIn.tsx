'use client'

import { getApps, initializeApp } from 'firebase/app'
import { getAuth, inMemoryPersistence, RecaptchaVerifier, setPersistence, signInWithPhoneNumber, signOut, type ConfirmationResult, type User } from 'firebase/auth'
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'

export type FirebaseWebConfig = Readonly<{ apiKey: string; authDomain: string; projectId: string; appId: string }>

export function FirebasePhoneSignIn({ firebase, name, title, phoneLabel = 'Phone number', virtualPhoneTest = false, children }: {
  firebase: FirebaseWebConfig
  name: string
  title: string
  phoneLabel?: string
  virtualPhoneTest?: boolean
  children: (getToken: () => Promise<string>) => ReactNode
}) {
  const captcha = useRef<HTMLDivElement>(null)
  const verifier = useRef<RecaptchaVerifier | null>(null)
  const [number, setNumber] = useState('')
  const [code, setCode] = useState('')
  const [confirmation, setConfirmation] = useState<ConfirmationResult>()
  const [user, setUser] = useState<User>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

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
      const appName = `${name}-${firebase.projectId}`
      const app = getApps().find(candidate => candidate.name === appName) || initializeApp(firebase, appName)
      const auth = getAuth(app)
      await setPersistence(auth, inMemoryPersistence)
      const loopback = ['localhost', '127.0.0.1'].includes(window.location.hostname)
      const useVirtualPhone = virtualPhoneTest && loopback
      const previousVerificationMode = auth.settings.appVerificationDisabledForTesting
      verifier.current?.clear()
      verifier.current = null
      try {
        if (useVirtualPhone) auth.settings.appVerificationDisabledForTesting = true
        verifier.current = new RecaptchaVerifier(auth, captcha.current, { size: 'invisible' })
        setConfirmation(await signInWithPhoneNumber(auth, number.trim(), verifier.current))
      } finally {
        auth.settings.appVerificationDisabledForTesting = previousVerificationMode
        verifier.current?.clear()
        verifier.current = null
      }
    } catch {
      setError(confirmation ? 'The verification code could not be confirmed.' : 'Phone verification could not start.')
    } finally {
      setBusy(false)
    }
  }

  async function endSession() {
    const app = getApps().find(candidate => candidate.name === `${name}-${firebase.projectId}`)
    if (app) await signOut(getAuth(app))
    setUser(undefined)
    setConfirmation(undefined)
    setNumber('')
  }

  if (user) return <div className="controller-main">
    <button type="button" onClick={() => { void endSession() }}>Sign out</button>
    {children(getToken)}
  </div>

  return <main className="controller-main">
    <h1>{title}</h1>
    <form onSubmit={submit}>
      {confirmation
        ? <label>Verification code <input value={code} autoComplete="one-time-code" inputMode="numeric" required onChange={event => setCode(event.target.value)}/></label>
        : <label>{virtualPhoneTest ? 'Test phone number' : phoneLabel} <input value={number} type="tel" autoComplete="tel" required onChange={event => setNumber(event.target.value)}/></label>}
      <div ref={captcha}/>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={busy}>{confirmation ? 'Verify code' : 'Send code'}</button>
    </form>
  </main>
}
