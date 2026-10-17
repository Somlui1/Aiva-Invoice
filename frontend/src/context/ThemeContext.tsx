'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

export type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  isDark: boolean
  setTheme: (theme: Theme) => void
  toggleTheme: (triggerEl?: HTMLElement | null) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const STORAGE_KEY = 'aiva.theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY) as Theme
        if (saved === 'dark' || saved === 'light') {
          return saved
        }
      } catch {}
    }
    return 'dark'
  })

  // Synchronize with DOM attributes and meta tags
  const applyThemeToDom = useCallback((t: Theme) => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    root.setAttribute('data-theme', t)
    
    // Update theme-color meta tag if present
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', t === 'light' ? '#f3f5f9' : '#0b0b0e')
    }
  }, [])

  useEffect(() => {
    applyThemeToDom(theme)
  }, [theme, applyThemeToDom])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, newTheme)
      }
    } catch {}
    applyThemeToDom(newTheme)
  }, [applyThemeToDom])

  const toggleTheme = useCallback((triggerEl?: HTMLElement | null) => {
    // Check for View Transitions API support and reduced motion safely
    const doc = typeof document !== 'undefined' ? (document as any) : null
    const prefersReducedMotion = typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    setThemeState(prev => {
      const nextTheme: Theme = prev === 'dark' ? 'light' : 'dark'

      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEY, nextTheme)
        }
      } catch {}

      if (doc?.startViewTransition && !prefersReducedMotion && triggerEl && typeof window !== 'undefined') {
        const rect = triggerEl.getBoundingClientRect()
        const x = rect.left + rect.width / 2
        const y = rect.top + rect.height / 2
        const endRadius = Math.hypot(
          Math.max(x, window.innerWidth - x),
          Math.max(y, window.innerHeight - y)
        ) + 40

        try {
          const transition = doc.startViewTransition(() => {
            applyThemeToDom(nextTheme)
          })

          transition.ready.then(() => {
            document.documentElement.animate(
              {
                clipPath: [
                  `circle(0px at ${x}px ${y}px)`,
                  `circle(${endRadius}px at ${x}px ${y}px)`,
                ],
              },
              {
                duration: 450,
                easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
                pseudoElement: '::view-transition-new(root)',
              }
            )
          }).catch(() => {})
        } catch {
          applyThemeToDom(nextTheme)
        }
      } else {
        applyThemeToDom(nextTheme)
      }

      return nextTheme
    })
  }, [applyThemeToDom])

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (!context) {
    return {
      theme: 'dark',
      isDark: true,
      toggleTheme: () => {},
      setTheme: () => {},
    }
  }
  return context
}
