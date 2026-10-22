'use client'

import { useState, type FormEvent } from 'react'
import type { OrganizationDepartment } from './OrganizationStructureAdministration'

export type OrganizationPlace = Readonly<{
  id: string
  name: string
  departmentId: string
  containedInPlaceId?: string
  geo?: Readonly<{ latitude: number; longitude: number; elevation?: number }>
  publishInCatalog: boolean
}>

export type OrganizationClientService = Readonly<{
  id: string
  name: string
  description?: string
  serviceType: string
  departmentId: string
  placeIds: readonly string[]
  publishInCatalog: boolean
}>

export function PlaceAdministration({ departments, places, onCreate, onPublicationChange }: Readonly<{
  departments: readonly OrganizationDepartment[]
  places: readonly OrganizationPlace[]
  onCreate(input: Readonly<{ name: string; departmentReference: string; geo?: Readonly<{ latitude: number; longitude: number }> }>): void
  onPublicationChange(placeReference: string, publishInCatalog: boolean): void
}>) {
  const [name, setName] = useState('')
  const [departmentReference, setDepartmentReference] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (!name.trim() || !departmentReference) return
    const hasCoordinates = latitude.trim() || longitude.trim()
    if (hasCoordinates && (!latitude.trim() || !longitude.trim())) return
    onCreate({
      name: name.trim(),
      departmentReference,
      ...(hasCoordinates ? { geo: { latitude: Number(latitude), longitude: Number(longitude) } } : {}),
    })
    setName(''); setLatitude(''); setLongitude('')
  }

  return <section className="organization-structure" aria-labelledby="places-title">
    <header className="structure-heading"><div><h2 id="places-title">Places</h2><p>Manage Schema.org Places independently from any sector projection.</p></div></header>
    <p className="authority-boundary">Only Places explicitly marked public are included in the organization service catalog.</p>
    <div className="structure-create-grid"><form onSubmit={submit}><h3>Create a Place</h3><label><span>Name</span><input value={name} onChange={event => setName(event.currentTarget.value)} required /></label><label><span>Department</span><select value={departmentReference} onChange={event => setDepartmentReference(event.currentTarget.value)} required><option value="">Select a department</option>{departments.map(department => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label><label><span>Latitude (optional)</span><input inputMode="decimal" value={latitude} onChange={event => setLatitude(event.currentTarget.value)} /></label><label><span>Longitude (optional)</span><input inputMode="decimal" value={longitude} onChange={event => setLongitude(event.currentTarget.value)} /></label><button type="submit">Create Place</button></form></div>
    <section className="structure-section"><h3>Registered Places</h3><div className="structure-card-grid">{places.map(place => <article key={place.id}><header><div><h4>{place.name}</h4><p>{departments.find(item => item.id === place.departmentId)?.name ?? place.departmentId}</p></div><span>{place.publishInCatalog ? 'Public' : 'Private'}</span></header><label><input type="checkbox" checked={place.publishInCatalog} onChange={event => onPublicationChange(place.id, event.currentTarget.checked)} /> Publish in service catalog</label></article>)}</div>{places.length === 0 ? <p className="structure-empty">No Places have been created.</p> : null}</section>
  </section>
}

export function ClientServiceAdministration({ departments, places, services, onCreate, onPublicationChange }: Readonly<{
  departments: readonly OrganizationDepartment[]
  places: readonly OrganizationPlace[]
  services: readonly OrganizationClientService[]
  onCreate(input: Readonly<{ name: string; description?: string; serviceType: string; departmentReference: string; placeReferences: readonly string[] }>): void
  onPublicationChange(serviceReference: string, publishInCatalog: boolean): void
}>) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [departmentReference, setDepartmentReference] = useState('')
  const [placeReferences, setPlaceReferences] = useState<readonly string[]>([])
  const eligiblePlaces = places.filter(place => place.departmentId === departmentReference)

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (!name.trim() || !serviceType.trim() || !departmentReference || placeReferences.length === 0) return
    onCreate({
      name: name.trim(),
      ...(description.trim() ? { description: description.trim() } : {}),
      serviceType: serviceType.trim(),
      departmentReference,
      placeReferences,
    })
    setName(''); setDescription(''); setServiceType(''); setPlaceReferences([])
  }

  return <section className="organization-structure" aria-labelledby="client-services-title">
    <header className="structure-heading"><div><h2 id="client-services-title">Client services</h2><p>Define the Schema.org Services offered by each department and the Places where they are available.</p></div></header>
    <p className="authority-boundary">Schedules, Slots and Appointments are managed by authorized service operations, not in this controller.</p>
    <div className="structure-create-grid"><form onSubmit={submit}><h3>Create a client service</h3><label><span>Name</span><input value={name} onChange={event => setName(event.currentTarget.value)} required /></label><label><span>Service type</span><input value={serviceType} onChange={event => setServiceType(event.currentTarget.value)} required /></label><label><span>Description (optional)</span><textarea value={description} onChange={event => setDescription(event.currentTarget.value)} /></label><label><span>Department</span><select value={departmentReference} onChange={event => { setDepartmentReference(event.currentTarget.value); setPlaceReferences([]) }} required><option value="">Select a department</option>{departments.map(department => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label><fieldset><legend>Places</legend>{eligiblePlaces.map(place => <label key={place.id}><input type="checkbox" checked={placeReferences.includes(place.id)} onChange={event => setPlaceReferences(changeSet(placeReferences, place.id, event.currentTarget.checked))} /> {place.name}{place.publishInCatalog ? ' — public' : ' — private'}</label>)}</fieldset><button type="submit">Create client service</button></form></div>
    <section className="structure-section"><h3>Registered client services</h3><div className="structure-card-grid">{services.map(service => <article key={service.id}><header><div><h4>{service.name}</h4><p>{service.serviceType}</p></div><span>{service.publishInCatalog ? 'Public' : 'Private'}</span></header><p>{service.placeIds.map(id => places.find(place => place.id === id)?.name ?? id).join(', ')}</p><label><input type="checkbox" checked={service.publishInCatalog} onChange={event => onPublicationChange(service.id, event.currentTarget.checked)} /> Publish in service catalog</label></article>)}</div>{services.length === 0 ? <p className="structure-empty">No client services have been created.</p> : null}</section>
  </section>
}

function changeSet(values: readonly string[], value: string, enabled: boolean): readonly string[] {
  return enabled ? [...new Set([...values, value])] : values.filter(item => item !== value)
}
