import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

/* Design System & Styles */
import './styles/tokens.css'
import './styles/base.css'
import './styles/layout.css'
import './styles/queue.css'
import './styles/evidence.css'
import './styles/components.css'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Failed to find root element with id "root"')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
)
