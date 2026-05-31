import pg from 'pg'

const { Pool } = pg

let pool: pg.Pool | null = null

export function getPool(): pg.Pool {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is required (attach Postgres on Railway)')
  }
  if (!pool) {
    pool = new Pool({
      connectionString: url,
      ssl: url.includes('railway') || url.includes('sslmode=require')
        ? { rejectUnauthorized: false }
        : undefined,
    })
  }
  return pool
}

export async function runMigrations(p: pg.Pool): Promise<void> {
  await p.query(`
    CREATE TABLE IF NOT EXISTS agents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      api_key_hash TEXT NOT NULL,
      api_key_prefix TEXT NOT NULL,
      metadata JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS idx_agents_api_key_prefix ON agents(api_key_prefix);
  `)
}

export interface AgentRow {
  id: string
  agent_id: string
  name: string
  description: string | null
  api_key_hash: string
  api_key_prefix: string
  metadata: Record<string, unknown>
  created_at: Date
  last_seen_at: Date | null
}
