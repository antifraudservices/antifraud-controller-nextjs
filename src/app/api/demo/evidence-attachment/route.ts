import { NextResponse } from 'next/server'
import { localDemoAccess } from '../../../../security/demo-access'
import { createLocalEvidenceAttachment } from '../../../../server/evidence-attachment'
import { localGatewayClient } from '../../../../server/antifraud-gateway'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (!localDemoAccess().authenticated) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })
  try {
    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) return NextResponse.json({ error: 'One evidence file is required.' }, { status: 400 })
    const attachment = await createLocalEvidenceAttachment({
      bytes: new Uint8Array(await file.arrayBuffer()),
      fileName: file.name,
      mediaType: file.type,
    }, localGatewayClient())
    return NextResponse.json(attachment, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid evidence attachment.' }, { status: 400 })
  }
}
