import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { installSessionInterceptor } from './lib/session'
import { installViewAsInterceptor } from './lib/viewAs'
import { installUiZoom } from './lib/uiZoom'
import './styles/index.css'

// Any /api/* 401 while signed in = the aiva_session cookie is gone → clear + /login?expired=1.
installSessionInterceptor()
// v5.10: SA "view as" adds X-View-As to /api/* (outer wrapper; the session guard below still sees every 401)
installViewAsInterceptor()

// v5.10.2: fit the whole app to the window (auto zoom) before the first paint
installUiZoom()

const rootEl = document.getElementById('root')
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}
