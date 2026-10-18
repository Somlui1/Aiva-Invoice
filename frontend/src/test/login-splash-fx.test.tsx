// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { LoginPage } from '@/features/login/LoginPage'
import { ThemeProvider } from '@/context/ThemeContext'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}))

describe('LoginPage Splash Screen & FX Animations', () => {
  it('renders SplashScreen on initial visit and transitions with .lg-enter, .lg-orb, and .lg-grid', async () => {
    const { container } = render(
      <ThemeProvider>
        <LoginPage showExplainer={false} />
      </ThemeProvider>
    )

    // Contains ambient elements
    expect(container.querySelector('.lg-orb')).toBeTruthy()
    expect(container.querySelector('.lg-grid')).toBeTruthy()

    // Contains SplashScreen initially
    const splash = container.querySelector('#splash')
    expect(splash).toBeTruthy()

    // Dismiss splash by clicking it
    fireEvent.click(splash!)

    // After dismiss, container receives .lg-enter class
    const loginRoot = container.querySelector('.aiva-login')
    expect(loginRoot?.classList.contains('lg-enter')).toBe(true)
  })
})
