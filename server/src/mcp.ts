import type { IncomingMessage, Server, ServerResponse } from 'node:http'
import { randomUUID } from 'node:crypto'
import { Server as McpServer } from '@modelcontextprotocol/sdk/server/index.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import type pg from 'pg'
import {
  generateSecrets,
  listPresetCatalog,
  registerAgent,
  type AgentContext,
} from './agents.js'

const registerSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
})

const generateSchema = z.object({
  preset_id: z.string(),
  count: z.number().int().min(1).max(5).optional(),
})

const tools = {
  register_agent: {
    description:
      'Self-register an agent with KeyMint. Returns agentId and apiKey (shown once). Use apiKey as Bearer token for other tools.',
    schema: registerSchema,
    public: true,
  },
  list_presets: {
    description: 'List all cryptographic secret presets available for generation.',
    schema: z.object({}),
    public: true,
  },
  generate_secret: {
    description:
      'Generate cryptographically secure secrets for a preset (requires Bearer apiKey from register_agent).',
    schema: generateSchema,
    public: false,
  },
  agent_whoami: {
    description: 'Return the authenticated agent profile (requires Bearer apiKey).',
    schema: z.object({}),
    public: false,
  },
} as const

type ToolName = keyof typeof tools

export interface McpDeps {
  pool: pg.Pool
  getAuth: (token: string) => Promise<AgentContext | null>
}

interface SessionState {
  transport: StreamableHTTPServerTransport
  server: McpServer
  auth: AgentContext | null
}

export function startMcpServer(httpServer: Server, path: string, deps: McpDeps) {
  const sessions = new Map<string, SessionState>()

  httpServer.on('request', async (req: IncomingMessage, res: ServerResponse) => {
    if (!req.url?.startsWith(path)) return
    if (req.method === 'OPTIONS') {
      res.writeHead(204, corsHeaders())
      res.end()
      return
    }

    try {
      const bearer = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '').trim()
      const sessionHeader = req.headers['mcp-session-id'] ?? req.headers['Mcp-Session-Id']
      const sessionId = Array.isArray(sessionHeader) ? sessionHeader[0] : sessionHeader
      let session = sessionId ? sessions.get(sessionId) : undefined

      if (!session) {
        const auth = bearer ? await deps.getAuth(bearer) : null
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (newSessionId: string) => {
            sessions.set(newSessionId, { transport, server, auth })
          },
        })
        const server = buildServer(deps, auth)
        transport.onclose = () => {
          if (transport.sessionId) sessions.delete(transport.sessionId)
        }
        await server.connect(transport)
        session = { transport, server, auth }
      } else if (bearer && !session.auth) {
        session.auth = await deps.getAuth(bearer)
      }

      await session.transport.handleRequest(req, res)
    } catch (err) {
      writeError(res, err)
    }
  })
}

function buildServer(deps: McpDeps, sessionAuth: AgentContext | null) {
  const server = new McpServer(
    { name: 'keymint', version: '0.1.0' },
    { capabilities: { tools: { listChanged: false } } },
  )

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: Object.entries(tools).map(([name, def]) => ({
      name,
      description: def.description,
      inputSchema: zodToJsonSchema(def.schema, name) as Record<string, unknown>,
    })),
  }))

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const name = req.params.name as ToolName
    const def = tools[name]
    if (!def) {
      return { isError: true, content: [{ type: 'text', text: `Unknown tool: ${name}` }] }
    }

    if (!def.public && !sessionAuth) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Unauthorized',
              hint: 'Pass Authorization: Bearer <apiKey> when opening the MCP session, or call register_agent first.',
            }),
          },
        ],
      }
    }

    try {
      const result = await executeTool(deps, name, req.params.arguments ?? {}, sessionAuth)
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { isError: true, content: [{ type: 'text', text: JSON.stringify({ error: message }) }] }
    }
  })

  return server
}

async function executeTool(
  deps: McpDeps,
  name: ToolName,
  args: unknown,
  auth: AgentContext | null,
) {
  if (name === 'register_agent') {
    const parsed = registerSchema.parse(args)
    return registerAgent(deps.pool, parsed)
  }
  if (name === 'list_presets') {
    return { presets: listPresetCatalog() }
  }
  if (name === 'generate_secret') {
    if (!auth) throw new Error('Authentication required')
    const parsed = generateSchema.parse(args)
    const values = generateSecrets(parsed.preset_id, parsed.count ?? 3)
    return { presetId: parsed.preset_id, count: values.length, values, agentId: auth.agentId }
  }
  if (name === 'agent_whoami') {
    if (!auth) throw new Error('Authentication required')
    return {
      agentId: auth.agentId,
      name: auth.name,
      description: auth.description,
    }
  }
  throw new Error(`Unhandled tool: ${name}`)
}

function corsHeaders(): Record<string, string> {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'POST, GET, OPTIONS, DELETE',
    'access-control-allow-headers':
      'content-type, authorization, mcp-session-id, Mcp-Session-Id',
  }
}

function writeError(res: ServerResponse, err: unknown) {
  const message = err instanceof Error ? err.message : String(err)
  res.statusCode = 500
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify({ error: message }))
}
