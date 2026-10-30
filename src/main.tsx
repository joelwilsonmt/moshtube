import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/saira-semi-condensed/latin-500.css'
import '@fontsource/saira-semi-condensed/latin-600.css'
import '@fontsource/saira-semi-condensed/latin-700.css'
import './styles/app.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
