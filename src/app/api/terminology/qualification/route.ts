import { NextResponse } from 'next/server'
import { localDemoAccess } from '../../../../security/demo-access'
import {
  resolveQualificationClassificationLabel,
  searchQualificationClassifications,
} from '../../../../server/qualification-terminology'

export const runtime = 'nodejs'

function language(value: string | null): 'en' | 'es' {
  return value === 'es' ? 'es' : 'en'
}

export async function GET(request: Request) {
  if (!localDemoAccess().authenticated) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })
  }
  try {
    const query = new URL(request.url).searchParams
    if (query.get('operation') === 'resolve') {
      const candidate = await resolveQualificationClassificationLabel({
        system: query.get('system') ?? '',
        code: query.get('code') ?? '',
        ...(query.get('version') ? { version: query.get('version')! } : {}),
        language: language(query.get('language')),
      })
      return NextResponse.json({ candidate })
    }
    const candidates = await searchQualificationClassifications({
      text: query.get('text') ?? '',
      language: language(query.get('language')),
    })
    return NextResponse.json({ candidates })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Terminology request failed.',
    }, { status: 400 })
  }
}
