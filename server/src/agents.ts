import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import type pg from 'pg'
import { getPreset, PRESETS } from '../../shared/presets.js'

const API_KEY_PREFIX = 'km_agent_'
const AGENT_ID_PREFIX = 'agent_'

export interface RegisteredAgent {
  agentId: string
  apiKey: string
  name: string
  description: string | null
  mcpEndpoint: string
  createdAt: string
}

export interface AgentContext {
  id: string
  agentId: string
  name: string
  description: string | null
}

function hashApiKey(apiKey: string): string {
  const pepper = process.env.KEYMINT_PEPPER ?? 'keymint-dev-pepper-change-in-production'
  return scryptSync(apiKey, pepper, 64).toString('hex')
}

function apiKeyPrefix(apiKey: string): string {
  return apiKey.slice(0, 16)
}

export function generateApiKey(): string {
  const raw = randomBytes(32).toString('base64url')
  return `${API_KEY_PREFIX}${raw}`
}

export function generateAgentId(): string {
  return `${AGENT_ID_PREFIX}${randomBytes(12).toString('hex')}`
}

export function publicBaseUrl(): string {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/$/, '')
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`.replace(/\/$/, '')
  }
  return `http://localhost:${process.env.PORT ?? 3000}`
}

export async function registerAgent(
  pool: pg.Pool,
  input: { name: string; description?: string; metadata?: Record<string, unknown> },
): Promise<RegisteredAgent> {
  const name = input.name.trim()
  if (name.length < 2 || name.length > 120) {
    throw new Error('Agent name must be 2–120 characters')
  }

  const agentId = generateAgentId()
  const apiKey = generateApiKey()
  const hash = hashApiKey(apiKey)
  const prefix = apiKeyPrefix(apiKey)

  const result = await pool.query(
    `INSERT INTO agents (agent_id, name, description, api_key_hash, api_key_prefix, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING agent_id, name, description, created_at`,
    [
      agentId,
      name,
      input.description?.trim() || null,
      hash,
      prefix,
      JSON.stringify(input.metadata ?? {}),
    ],
  )

  const row = result.rows[0] as {
    agent_id: string
    name: string
    description: string | null
    created_at: Date
  }

  return {
    agentId: row.agent_id,
    apiKey,
    name: row.name,
    description: row.description,
    mcpEndpoint: `${publicBaseUrl()}/mcp`,
    createdAt: row.created_at.toISOString(),
  }
}

export async function resolveAgent(pool: pg.Pool, apiKey: string): Promise<AgentContext | null> {
  if (!apiKey.startsWith(API_KEY_PREFIX)) return null
  const prefix = apiKeyPrefix(apiKey)
  const hash = hashApiKey(apiKey)

  const result = await pool.query(
    `SELECT id, agent_id, name, description, api_key_hash
     FROM agents WHERE api_key_prefix = $1
     ORDER BY created_at DESC
     LIMIT 5`,
    [prefix],
  )

  for (const row of result.rows) {
    const stored = row.api_key_hash as string
    const a = Buffer.from(stored, 'hex')
    const b = Buffer.from(hash, 'hex')
    if (a.length === b.length && timingSafeEqual(a, b)) {
      await pool.query(`UPDATE agents SET last_seen_at = NOW() WHERE id = $1`, [row.id])
      return {
        id: row.id as string,
        agentId: row.agent_id as string,
        name: row.name as string,
        description: row.description as string | null,
      }
    }
  }
  return null
}

export async function listAgents(pool: pg.Pool, limit = 50) {
  const result = await pool.query(
    `SELECT agent_id, name, description, created_at, last_seen_at
     FROM agents ORDER BY created_at DESC LIMIT $1`,
    [limit],
  )
  return result.rows.map((r) => ({
    agentId: r.agent_id,
    name: r.name,
    description: r.description,
    createdAt: (r.created_at as Date).toISOString(),
    lastSeenAt: r.last_seen_at ? (r.last_seen_at as Date).toISOString() : null,
  }))
}

export function generateSecrets(presetId: string, count = 3): string[] {
  const preset = getPreset(presetId)
  if (!preset) throw new Error(`Unknown preset: ${presetId}`)
  const n = Math.min(Math.max(count, 1), 5)
  return Array.from({ length: n }, () => preset.generate())
}

export function listPresetCatalog() {
  return PRESETS.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    category: p.category,
    hint: p.hint,
    format: p.format,
  }))
}

export function fingerprintToken(token: string): string {
  return createHash('sha256').update(token).digest('hex').slice(0, 12)
}
