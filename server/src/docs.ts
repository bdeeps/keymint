import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ServerResponse } from 'node:http'

const REPO_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '../..')

const DOC_ROUTES: Record<string, string> = {
  '/AGENTS.md': 'AGENTS.md',
  '/docs/agents/mcp.md': 'docs/agents/mcp.md',
  '/docs/agents/rest.md': 'docs/agents/rest.md',
  '/docs/agents/presets.md': 'docs/agents/presets.md',
  '/docs/skill.md': '.cursor/skills/keymint/SKILL.md',
}

export async function serveAgentDoc(
  pathname: string,
  res: ServerResponse,
): Promise<boolean> {
  const rel = DOC_ROUTES[pathname]
  if (!rel) return false

  try {
    const body = await readFile(join(REPO_ROOT, rel), 'utf8')
    res.statusCode = 200
    res.setHeader('content-type', 'text/markdown; charset=utf-8')
    res.setHeader('access-control-allow-origin', '*')
    res.setHeader('cache-control', 'public, max-age=300')
    res.end(body)
    return true
  } catch {
    res.statusCode = 404
    res.setHeader('content-type', 'text/plain')
    res.end('Documentation not found')
    return true
  }
}
