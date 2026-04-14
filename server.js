// Custom server that re-adds the /proxy/9002 prefix stripped by code-server.
// Mirrors the codeServerProxyPlugin used in webtile (Vite), but at the Node HTTP level.
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const port = 9002
const PROXY_BASE = '/proxy/9002'

const app = next({ dev, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      // code-server strips /proxy/9002 before forwarding — put it back
      // so Next.js basePath routing and static asset serving work correctly.
      if (req.url && !req.url.startsWith(PROXY_BASE)) {
        req.url = PROXY_BASE + req.url
      }
      await handle(req, res, parse(req.url, true))
    } catch (err) {
      console.error('Error handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
  .once('error', (err) => { console.error(err); process.exit(1) })
  .listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`)
  })
})
