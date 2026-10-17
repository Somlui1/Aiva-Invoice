/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ThemeProvider, useTheme } from '../context/ThemeContext'

function TestComponent() {
  const { theme, toggleTheme, setTheme } = useTheme()
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button data-testid="toggle-btn" onClick={() => toggleTheme()}>
        Toggle
      </button>
      <button data-testid="set-light-btn" onClick={() => setTheme('light')}>
        Set Light
      </button>
      <button data-testid="set-dark-btn" onClick={() => setTheme('dark')}>
        Set Dark
      </button>
    </div>
  )
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('defaults to dark theme when no localStorage value exists', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('current-theme').textContent).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('toggles theme between dark and light', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('current-theme').textContent).toBe('dark')

    act(() => {
      fireEvent.click(screen.getByTestId('toggle-btn'))
    })

    expect(screen.getByTestId('current-theme').textContent).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(localStorage.getItem('aiva.theme')).toBe('light')

    act(() => {
      fireEvent.click(screen.getByTestId('toggle-btn'))
    })

    expect(screen.getByTestId('current-theme').textContent).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem('aiva.theme')).toBe('dark')
  })

  it('restores theme from localStorage on initial render', () => {
    localStorage.setItem('aiva.theme', 'light')

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('current-theme').textContent).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('explicitly sets theme with setTheme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    act(() => {
      fireEvent.click(screen.getByTestId('set-light-btn'))
    })
    expect(screen.getByTestId('current-theme').textContent).toBe('light')

    act(() => {
      fireEvent.click(screen.getByTestId('set-dark-btn'))
    })
    expect(screen.getByTestId('current-theme').textContent).toBe('dark')
  })
})
