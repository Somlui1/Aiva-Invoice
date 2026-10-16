'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { playChime } from '../../lib/soundEffects'
import type { AlertDocument } from './DocumentAlertToast'

const POLL_INTERVAL_MS = 8000 // 8 seconds

export function useDocumentAlerts() {
  const { currentUser } = useAuth()
  const [activeAlerts, setActiveAlerts] = useState<AlertDocument[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const lastPollTimeRef = useRef<string>(new Date().toISOString())
  const isPollingRef = useRef<boolean>(false)

  const dismissAlert = useCallback((id: string) => {
    setActiveAlerts((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const clearAllAlerts = useCallback(() => {
    setActiveAlerts([])
    setUnreadCount(0)
  }, [])

  useEffect(() => {
    if (!currentUser || !currentUser.id) {
      return
    }

    const checkNewDocuments = async () => {
      if (document.hidden || isPollingRef.current) return
      isPollingRef.current = true

      try {
        const params = new URLSearchParams({
          since: lastPollTimeRef.current,
          role: currentUser.role,
        })

        if (currentUser.co && currentUser.co.length > 0) {
          params.set('companies', currentUser.co.join(','))
        }

        const res = await fetch(`/api/notifications/poll?${params.toString()}`)
        if (!res.ok) return

        const data = await res.json()
        if (data.ok && Array.isArray(data.newDocuments) && data.newDocuments.length > 0) {
          // Play sound alert
          playChime()

          // Prepend new documents to alert stack (max 3 toasts at once)
          setActiveAlerts((prev) => {
            const existingIds = new Set(prev.map((d) => d.id))
            const incoming = data.newDocuments.filter((d: AlertDocument) => !existingIds.has(d.id))
            return [...incoming, ...prev].slice(0, 3)
          })

          setUnreadCount((c) => c + data.newDocuments.length)
        }

        if (data.serverTime) {
          lastPollTimeRef.current = data.serverTime
        }
      } catch {
        // Soft fail on network hiccup
      } finally {
        isPollingRef.current = false
      }
    }

    const timer = setInterval(checkNewDocuments, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [currentUser])

  return {
    activeAlerts,
    unreadCount,
    dismissAlert,
    clearAllAlerts,
  }
}
