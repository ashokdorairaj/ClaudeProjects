import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { setTheme } from '@ui5/webcomponents-base/dist/config/Theme.js'
import App from './App.tsx'

// Listen for theme switch messages from the parent DemoPageShell
window.addEventListener('message', (e) => {
  if (e.data?.type === 'ui5-theme' && typeof e.data.theme === 'string') {
    setTheme(e.data.theme);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
