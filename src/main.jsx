import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import '@fontsource-variable/bricolage-grotesque/opsz.css'
import '@fontsource-variable/geist/wght.css'
import './styles/globals.css'
import { router } from './app/router'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
