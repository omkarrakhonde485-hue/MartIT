import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import '@fontsource-variable/bricolage-grotesque/opsz.css'
import '@fontsource-variable/geist/wght.css'
import './styles/globals.css'
import { router } from './app/router'

const container = document.getElementById('root')
const app = (
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)

// The landing page ships pre-rendered HTML (scripts/prerender.mjs); hydrate it.
// Every other route starts from an empty root and renders on the client.
if (container.dataset.prerendered === window.location.pathname) hydrateRoot(container, app)
else createRoot(container).render(app)
