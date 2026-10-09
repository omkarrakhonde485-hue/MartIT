import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { createStaticHandler, createStaticRouter, StaticRouterProvider } from 'react-router'
import { routes } from './app/routes'

/**
 * Build-time pre-render of public marketing pages (see scripts/prerender.mjs).
 * Signed-in areas are never pre-rendered — they depend on the user.
 */
export async function render(url) {
  const handler = createStaticHandler(routes)
  const context = await handler.query(new Request(new URL(url, 'http://localhost')))
  if (context instanceof Response) throw new Error(`Unexpected redirect while pre-rendering ${url}`)
  const router = createStaticRouter(handler.dataRoutes, context)
  return renderToString(
    <StrictMode>
      <StaticRouterProvider router={router} context={context} hydrate={false} />
    </StrictMode>,
  )
}
