import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { App } from '../App'
import { USERS } from '../mock/users'

describe('App Shell Production Root', () => {
  it('renders PortalShell inside all core providers even when initialUser is undefined', () => {
    // In server environment without window, should render redirect guard cleanly
    const html = renderToString(<App initialPage="queue" />)
    expect(html).toContain('auth-redirect-guard')
  })

  it('renders PortalShell with authenticated user content when user is provided', () => {
    const accUser = USERS.find(u => u.role === 'ACC') || USERS[3]
    const html = renderToString(<App initialUser={accUser} initialPage="queue" />)
    expect(html).toContain('AIVA')
    expect(html).toContain('shell')
    expect(html).not.toContain('auth-redirect-guard')
  })
})
