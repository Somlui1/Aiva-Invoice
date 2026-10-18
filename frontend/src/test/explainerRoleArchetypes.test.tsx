// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { RoleScene } from '@/features/login/explainer/RoleScene'

describe('RoleScene Business Archetypes', () => {
  it('displays business role descriptions without referencing fake personal employees', () => {
    render(<RoleScene ri={0} onRole={() => {}} />)
    
    // Check for standard role archetype titles
    expect(screen.getByText(/ผู้ใช้งาน \(Receiver\)/i)).toBeDefined()
    expect(screen.getByText(/เจ้าหน้าที่บัญชี/i)).toBeDefined()
    
    // Ensure no fake employee name is rendered
    expect(screen.queryByText(/กิตติศักดิ์ ซัพพอร์ต/i)).toBeNull()
    expect(screen.queryByText(/somchai/i)).toBeNull()
  })
})
