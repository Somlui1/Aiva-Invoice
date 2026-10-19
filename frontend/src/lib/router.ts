/**
 * Lightweight client router hook for Vite SPA mode.
 */
export function useRouter() {
  return {
    replace: (url: string) => {
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', url)
        window.dispatchEvent(new PopStateEvent('popstate'))
      }
    },
    refresh: () => {
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
    },
    push: (url: string) => {
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', url)
        window.dispatchEvent(new PopStateEvent('popstate'))
      }
    },
  }
}
