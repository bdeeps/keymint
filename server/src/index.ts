import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPool, runMigrations } from './db.js'
import {
  listAgents,
  listPresetCatalog,
  publicBaseUrl,
  registerAgent,
  resolveAgent,
  generateSecrets,
} from './agents.js'
import { startMcpServer } from './mcp.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const DIST_DIR = join(__dirname, '../../dist')

const MIME: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks).toString('utf8')
}

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json')
  res.setHeader('access-control-allow-origin', '*')
  res.end(JSON.stringify(body))
}

async function serveStatic(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  let path = req.url?.split('?')[0] ?? '/'
  if (path === '/') path = '/index.html'
  const filePath = join(DIST_DIR, path)
  try {
    const info = await stat(filePath)
    if (!info.isFile()) return false
    const data = await readFile(filePath)
    res.statusCode = 200
    res.setHeader('content-type', MIME[extname(filePath)] ?? 'application/octet-stream')
    res.end(data)
    return true
  } catch {
    if (path !== '/index.html') {
      try {
        const data = await readFile(join(DIST_DIR, 'index.html'))
        res.statusCode = 200
        res.setHeader('content-type', 'text/html')
        res.end(data)
        return true
      } catch {
        return false
      }
    }
    return false
  }
}

async function handleApi(
  req: IncomingMessage,
  res: ServerResponse,
  pool: ReturnType<typeof getPool>,
): Promise<boolean> {
  const url = req.url?.split('?')[0] ?? ''

  if (url === '/health' && req.method === 'GET') {
    json(res, 200, {
      ok: true,
      service: 'keymint',
      mcp: `${publicBaseUrl()}/mcp`,
      database: Boolean(process.env.DATABASE_URL),
    })
    return true
  }

  if (url === '/api/agents/register' && req.method === 'POST') {
    try {
      const body = JSON.parse((await readBody(req)) || '{}') as {
        name?: string
        description?: string
      }
      if (!body.name?.trim()) {
        json(res, 400, { error: 'name is required' })
        return true
      }
      const agent = await registerAgent(pool, {
        name: body.name,
        description: body.description,
      })
      json(res, 201, {
        ...agent,
        message: 'Store apiKey securely — it cannot be retrieved again.',
        cursorConfig: {
          mcpServers: {
            keymint: {
              url: agent.mcpEndpoint,
              headers: { Authorization: `Bearer ${agent.apiKey}` },
            },
          },
        },
      })
      return true
    } catch (err) {
      json(res, 400, { error: err instanceof Error ? err.message : String(err) })
      return true
    }
  }

  if (url === '/api/agents' && req.method === 'GET') {
    const agents = await listAgents(pool)
    json(res, 200, { agents, mcpEndpoint: `${publicBaseUrl()}/mcp` })
    return true
  }

  if (url === '/api/agents/me' && req.method === 'GET') {
    const token = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '')
    const agent = await resolveAgent(pool, token)
    if (!agent) {
      json(res, 401, { error: 'Invalid or missing API key' })
      return true
    }
    json(res, 200, { agent })
    return true
  }

  if (url === '/api/presets' && req.method === 'GET') {
    json(res, 200, { presets: listPresetCatalog() })
    return true
  }

  if (url === '/api/secrets/generate' && req.method === 'POST') {
    const token = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '')
    const agent = await resolveAgent(pool, token)
    if (!agent) {
      json(res, 401, { error: 'Invalid or missing API key' })
      return true
    }
    try {
      const body = JSON.parse((await readBody(req)) || '{}') as {
        presetId?: string
        count?: number
      }
      if (!body.presetId) {
        json(res, 400, { error: 'presetId is required' })
        return true
      }
      const values = generateSecrets(body.presetId, body.count ?? 3)
      json(res, 200, { presetId: body.presetId, values, agentId: agent.agentId })
      return true
    } catch (err) {
      json(res, 400, { error: err instanceof Error ? err.message : String(err) })
      return true
    }
  }

  return false
}

async function main() {
  const pool = getPool()
  await runMigrations(pool)

  const getAuth = (token: string) => resolveAgent(pool, token)

  const httpServer = createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET, POST, OPTIONS',
        'access-control-allow-headers': 'content-type, authorization, mcp-session-id',
      })
      res.end()
      return
    }

    if (req.url?.startsWith('/mcp')) return

    if (await handleApi(req, res, pool)) return

    if (req.method === 'GET' && (await serveStatic(req, res))) return

    res.statusCode = 404
    res.end('Not found')
  })

  startMcpServer(httpServer, '/mcp', { pool, getAuth })

  const port = Number(process.env.PORT ?? 3000)
  httpServer.listen(port, () => {
    console.log(`KeyMint server on :${port}`)
    console.log(`  Web UI:  ${publicBaseUrl()}/`)
    console.log(`  MCP:     ${publicBaseUrl()}/mcp`)
    console.log(`  REST:    ${publicBaseUrl()}/api/agents/register`)
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
