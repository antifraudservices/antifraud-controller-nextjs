import type { Metadata } from 'next'
import { headers } from 'next/headers'
import type { CSSProperties, ReactNode } from 'react'
import { resolvePortalDeployment } from '../config/portal-config'
import 'antifraud-portal-components-react/styles.css'
import './styles.css'

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers()
  const config = resolvePortalDeployment(requestHeaders.get('host') || 'localhost')
  return {
    title: config.name,
    description: 'Brand-neutral organization controller administration.',
  }
}

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const requestHeaders = await headers()
  const config = resolvePortalDeployment(requestHeaders.get('host') || 'localhost')
  return (
    <html lang="en" style={{ '--portal-accent': config.accentColor } as CSSProperties}>
      <body>{children}</body>
    </html>
  )
}
