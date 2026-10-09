/**
 * Pre-renders public marketing routes into dist/index.html after `vite build`.
 * Runs the SSR bundle produced by `vite build --ssr src/entry-server.jsx`.
 */
import { readFile, writeFile, rm } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ssrEntry = pathToFileURL(path.join(root, 'dist-ssr', 'entry-server.js')).href
const { render } = await import(ssrEntry)

const url = '/'
const html = await render(url)
const indexPath = path.join(root, 'dist', 'index.html')
const template = await readFile(indexPath, 'utf8')
if (!template.includes('<div id="root"></div>')) throw new Error('Root placeholder not found in dist/index.html')

// If the SPA fallback serves this file for another path, drop the landing markup
// before first paint so that route renders from scratch.
/*
 * Paint first, hydrate second: the entry module is imported right after the first
 * frame instead of being preloaded/executed before it. On slow phones the
 * pre-rendered landing page becomes visible without waiting for ~400 kB of JS.
 */
function deferEntry(htmlDoc) {
  const entry = htmlDoc.match(/<script type="module" crossorigin src="([^"]+)"><\/script>\s*/)
  if (!entry) throw new Error('Entry script not found in dist/index.html')
  const loader = `<script type="module">requestAnimationFrame(()=>setTimeout(()=>import(${JSON.stringify(entry[1])})))</script>`
  return htmlDoc
    .replace(entry[0], '')
    .replace(/<link rel="modulepreload" crossorigin href="[^"]+">\s*/g, '')
    .replace('</body>', `${loader}
  </body>`)
}

const guard = `<script>if(location.pathname!==${JSON.stringify(url)}){var r=document.getElementById('root');r.innerHTML='';delete r.dataset.prerendered}</script>`
await writeFile(
  indexPath,
  deferEntry(template.replace('<div id="root"></div>', `<div id="root" data-prerendered="${url}">${html}</div>${guard}`)),
)
await rm(path.join(root, 'dist-ssr'), { recursive: true, force: true })
console.log(`pre-rendered ${url} (${(html.length / 1024).toFixed(1)} kB of HTML)`)
