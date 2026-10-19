'use client'

import { useState } from 'react'
import type { QualificationClassificationReference } from 'antifraud-data-utils-ts'
import {
  IdentityEvidenceEditor,
  QualificationEvidenceEditor,
  type IdentityEvidenceEditorSubmission,
  type QualificationEvidenceDelivery,
  type QualificationEvidenceIssuerResolution,
  type QualificationEvidenceSubmission,
} from 'antifraud-portal-components-react'
import { QualificationClassificationSelector } from './QualificationClassificationSelector'

type LocalAttachment = Readonly<{
  fileName: string
  mediaType: QualificationEvidenceSubmission['evidence']['mediaType']
  size: number
  storageReference: string
  contentId: string
}>

async function attachmentFromFile(file: File): Promise<LocalAttachment> {
  const form = new FormData()
  form.set('file', file)
  const response = await fetch('/api/demo/evidence-attachment', { method: 'POST', body: form })
  const payload = await response.json() as LocalAttachment & { error?: string }
  if (!response.ok) throw new Error(payload.error ?? 'Evidence attachment preparation failed.')
  return payload
}

export function EvidenceAdministration({ employees }: Readonly<{ employees: readonly Readonly<{ reference: string; email: string; status: 'active' | 'inactive' }>[] }>) {
  const [identityReceipt, setIdentityReceipt] = useState<{ submission: IdentityEvidenceEditorSubmission; transactionId: string }>()
  const [identityError, setIdentityError] = useState<string>()
  const [issuerResolution, setIssuerResolution] = useState<QualificationEvidenceIssuerResolution>({ phase: 'idle' })
  const [attachment, setAttachment] = useState<Awaited<ReturnType<typeof attachmentFromFile>>>()
  const [delivery, setDelivery] = useState<QualificationEvidenceDelivery>({ phase: 'not-requested' })
  const [attachmentError, setAttachmentError] = useState<string>()
  const [classification, setClassification] = useState<QualificationClassificationReference>()
  const [classificationError, setClassificationError] = useState<string>()

  return <section className="evidence-administration" aria-labelledby="evidence-administration-title">
    <header className="evidence-heading">
      <h2 id="evidence-administration-title">Identity and qualification evidence</h2>
      <p>Controller-authorized organization staff can prepare evidence about employees. The server must still verify the active assignment, group membership and exact capability before recording it.</p>
    </header>
    <div className="evidence-grid">
      <div className="evidence-panel">
        <IdentityEvidenceEditor
          subjects={employees.map(employee => ({ reference: employee.reference, label: employee.email, disabled: employee.status !== 'active' }))}
          onSubmit={submission => {
            setIdentityError(undefined)
            void fetch('/api/evidence/identity', {
              method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(submission),
            }).then(async response => {
              const payload = await response.json() as { transactionId?: string; error?: string }
              if (!response.ok || !payload.transactionId) throw new Error(payload.error ?? 'Identity evidence failed.')
              setIdentityReceipt({ submission, transactionId: payload.transactionId })
            }).catch(error => setIdentityError(error instanceof Error ? error.message : 'Identity evidence failed.'))
          }}
          submitAction="prepare-identity-evidence"
        />
        {identityReceipt ? <p className="evidence-receipt" role="status"><strong>Identity evidence recorded</strong><span>{identityReceipt.submission.subjectReference} · {identityReceipt.submission.target.kind} · {identityReceipt.submission.checkReference}</span><code>{identityReceipt.transactionId}</code><small>Gateway-authoritative receipt; the selected environment and its server-owned ledger adapter determine the evidence tier.</small></p> : null}
        {identityError ? <p role="alert">{identityError}</p> : null}
      </div>
      <div className="evidence-panel">
        <QualificationClassificationSelector value={classification} onChange={value => {
          setClassification(value)
          setClassificationError(undefined)
        }} />
        <QualificationEvidenceEditor
          employees={employees.map(employee => ({ id: employee.reference, label: employee.email, active: employee.status === 'active' }))}
          issuerResolution={issuerResolution}
          delivery={delivery}
          attachment={attachment}
          onResolveIssuer={({ legalIdentifier, jurisdiction }) => setIssuerResolution({
            phase: 'resolved',
            organizationReference: `urn:organization:${jurisdiction}:${legalIdentifier}`,
            displayName: 'Resolved issuer fixture',
            legalIdentifier,
            jurisdiction,
          })}
          onEvidenceFileSelected={file => {
            setAttachmentError(undefined)
            void attachmentFromFile(file).then(setAttachment).catch(error => {
              setAttachment(undefined)
              setAttachmentError(error instanceof Error ? error.message : 'Evidence attachment preparation failed.')
            })
          }}
          onSubmit={submission => {
            if (!classification) {
              setClassificationError('Select one governed qualification classification before recording evidence.')
              return
            }
            setDelivery({ phase: 'not-requested' })
            void fetch('/api/evidence/qualification', {
              method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
                ...submission,
                qualification: { ...submission.qualification, classification },
              }),
            }).then(async response => {
              const payload = await response.json() as { transactionId?: string; error?: string }
              if (!response.ok || !payload.transactionId) throw new Error(payload.error ?? 'Qualification evidence failed.')
              setDelivery({ phase: 'queued', messageReference: payload.transactionId })
            }).catch(error => setDelivery({ phase: 'delivery-failed', messageReference: error instanceof Error ? error.message : 'Qualification evidence failed.' }))
          }}
        />
        {classificationError ? <p role="alert">{classificationError}</p> : null}
        {attachmentError ? <p role="alert">{attachmentError}</p> : null}
      </div>
    </div>
  </section>
}
