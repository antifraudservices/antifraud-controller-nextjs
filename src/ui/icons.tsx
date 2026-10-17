import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }

export function OverviewIcon(props: IconProps) { return <svg {...base} {...props}><path d="m3 11 9-7 9 7"/><path d="M5.5 10v10h13V10M9 20v-6h6v6"/></svg> }
export function OrganizationIcon(props: IconProps) { return <svg {...base} {...props}><path d="M4 21V8l5-3v16M9 21h11V11l-6-3v13M2 21h20"/><path d="M6.5 10h.01M6.5 14h.01M12 13h.01M16 13h.01M12 17h.01M16 17h.01"/></svg> }
export function MembersIcon(props: IconProps) { return <svg {...base} {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> }
export function ServicesIcon(props: IconProps) { return <svg {...base} {...props}><path d="m12 2 8 4.5v11L12 22l-8-4.5v-11L12 2Z"/><path d="m4.5 7 7.5 4 7.5-4M12 11v11"/></svg> }
export function DevicesIcon(props: IconProps) { return <svg {...base} {...props}><rect x="3" y="4" width="18" height="13" rx="1"/><path d="M8 21h8M12 17v4"/></svg> }
export function AuditIcon(props: IconProps) { return <svg {...base} {...props}><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></svg> }
export function ShieldIcon(props: IconProps) { return <svg {...base} {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg> }
export function ChevronIcon(props: IconProps) { return <svg {...base} {...props}><path d="m9 18 6-6-6-6"/></svg> }
export function UserIcon(props: IconProps) { return <svg {...base} {...props}><circle cx="12" cy="8" r="4"/><path d="M4 22a8 8 0 0 1 16 0"/></svg> }
export function MenuIcon(props: IconProps) { return <svg {...base} {...props}><path d="M4 6h16M4 12h16M4 18h16"/></svg> }
export function CheckIcon(props: IconProps) { return <svg {...base} {...props}><path d="m6 12 4 4 8-8"/></svg> }
export function ClockIcon(props: IconProps) { return <svg {...base} {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg> }
export function SettingsIcon(props: IconProps) { return <svg {...base} {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.14.38.35.72.6 1 .29.32.68.5 1.1.5h.1v4h-.09a1.7 1.7 0 0 0-1.71.5Z"/></svg> }
