import type { Metadata } from 'next'
import type { CSSProperties, ReactNode } from 'react'
import { readPortalConfig } from '../config/portal-config'
import 'antifraud-portal-components-react/styles.css'
import './styles.css'

export function generateMetadata(): Metadata {
  const config = readPortalConfig()
  return {
    title: config.name,
    description: 'Brand-neutral organization controller administration.',
  }
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const config = readPortalConfig()
  return (
    <html lang="en" style={{ '--portal-accent': config.accentColor } as CSSProperties}>
      <body>{children}</body>
    </html>
  )
}
