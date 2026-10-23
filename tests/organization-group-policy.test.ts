// Flow contract: the trusted hostname exposes reviewed reusable Group templates, and the backend derives the exact capability set (including organization-scoped subject registration) without accepting capability arrays from the browser.
import { describe, expect, it } from 'vitest'
import { allowedGroupTemplateOptions, resolveGroupTemplateCapabilities } from '../src/server/organization-group-policy'

describe('organization group policy', () => {
  it('exposes Places and public Services management for every organization sector', () => {
    expect(allowedGroupTemplateOptions(['education'])).toEqual(expect.arrayContaining([
      { value: 'places-management', label: 'Places management' },
      { value: 'public-services-management', label: 'Public Services management' },
    ]))
  })

  it('keeps catalog publication explicit in the public Services template', () => {
    expect(resolveGroupTemplateCapabilities('places-management', 'Organization/example')).toEqual([
      'controller.structure.write',
    ])
    expect(resolveGroupTemplateCapabilities('public-services-management', 'Organization/example')).toEqual([
      'controller.structure.write',
      'controller.catalog.publish',
    ])
  })

  it('exposes clinical workflow templates only to antifraud-tech hosts', () => {
    expect(allowedGroupTemplateOptions(['antifraud-tech']).map(option => option.value)).toEqual(expect.arrayContaining([
      'scheduling-operations', 'encounter-operations', 'clinical-contribution', 'subject-registration', 'public-communication-request-publishing',
    ]))
    expect(allowedGroupTemplateOptions(['education']).map(option => option.value)).not.toContain('scheduling-operations')
  })

  it('derives exact canonical capabilities from a reviewed template', () => {
    expect(resolveGroupTemplateCapabilities('subject-registration', 'Organization/example')).toEqual([
      'organization/Subject.c?organization=Organization/example',
    ])
  })
})
