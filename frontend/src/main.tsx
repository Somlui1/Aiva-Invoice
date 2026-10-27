import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { installSessionInterceptor } from './lib/session'
import { installViewAsInterceptor } from './lib/viewAs'
import './styles/index.css'

// Any /api/* 401 while signed in = the aiva_session cookie is gone → clear + /login?expired=1.
installSessionInterceptor()
// v5.10: SA "view as" adds X-View-As to /api/* (outer wrapper; the session guard below still sees every 401)
installViewAsInterceptor()

const rootEl = document.getElementById('root')
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}
