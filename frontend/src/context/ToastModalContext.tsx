'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { IconName } from '../components/common/Icon'

export interface ToastItem {
  id: string
  message: string
  isError: boolean
}

export interface ModalConfig {
  title: string
  subtitle?: string
  icon?: IconName
  variant?: string
  body: React.ReactNode
  confirmText?: string
  confirmClass?: string
  onConfirm?: () => void
}

interface ToastModalContextType {
  toast: (message: string, isError?: boolean) => void
  openModal: (config: ModalConfig) => void
  closeModal: () => void
  currentModal: ModalConfig | null
  toasts: ToastItem[]
  removeToast: (id: string) => void
}

const ToastModalContext = createContext<ToastModalContextType | null>(null)

export function ToastModalProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [currentModal, setCurrentModal] = useState<ModalConfig | null>(null)

  const toast = useCallback((message: string, isError = false) => {
    const id = Math.random().toString(36).slice(2, 9)
    setToasts(prev => [...prev, { id, message, isError }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3200)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const openModal = useCallback((config: ModalConfig) => {
    setCurrentModal(config)
  }, [])

  const closeModal = useCallback(() => {
    setCurrentModal(null)
  }, [])

  return (
    <ToastModalContext.Provider
      value={{
        toast,
        openModal,
        closeModal,
        currentModal,
        toasts,
        removeToast
      }}
    >
      {children}
    </ToastModalContext.Provider>
  )
}

export function useToastModal() {
  const ctx = useContext(ToastModalContext)
  if (!ctx) throw new Error('useToastModal must be used within ToastModalProvider')
  return ctx
}
