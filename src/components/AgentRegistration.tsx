import { useCallback, useEffect, useState } from 'react'

interface RegisteredAgentResponse {
  agentId: string
  apiKey: string
  name: string
  description: string | null
  mcpEndpoint: string
  createdAt: string
  message: string
  cursorConfig: {
    mcpServers: {
      keymint: {
        url: string
        headers: { Authorization: string }
      }
    }
  }
}

interface AgentListItem {
  agentId: string
  name: string
  description: string | null
  createdAt: string
  lastSeenAt: string | null
}

function CopyIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

export default function AgentRegistration() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registered, setRegistered] = useState<RegisteredAgentResponse | null>(null)
  const [agents, setAgents] = useState<AgentListItem[]>([])
  const [mcpEndpoint, setMcpEndpoint] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const loadAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents')
      if (!res.ok) return
      const data = (await res.json()) as { agents: AgentListItem[]; mcpEndpoint: string }
      setAgents(data.agents)
      setMcpEndpoint(data.mcpEndpoint)
    } catch {
      /* API unavailable in static-only mode */
    }
  }, [])

  useEffect(() => {
    loadAgents()
  }, [loadAgents])

  const copy = async (label: string, text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setRegistered(null)
    try {
      const res = await fetch('/api/agents/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, description: description || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Registration failed')
      setRegistered(data as RegisteredAgentResponse)
      setName('')
      setDescription('')
      await loadAgents()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const cursorJson = registered
    ? JSON.stringify(registered.cursorConfig, null, 2)
    : ''

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-white">Agent registration</h2>
        <p className="mt-1 max-w-2xl text-sm text-[var(--color-muted)]">
          Register an agent to get an API key and MCP connection details.
        </p>
        <nav className="mt-3 flex flex-wrap gap-3 text-xs">
          <a
            href="/AGENTS.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            Agent guide
          </a>
          <a
            href="/api/agent-manifest"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            JSON manifest
          </a>
          <a
            href="/docs/agents/mcp.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            MCP docs
          </a>
          <a
            href="/docs/skill.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            Skill file
          </a>
        </nav>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={onRegister}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5"
        >
          <h3 className="text-sm font-semibold text-white">Register new agent</h3>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Choose a name and optional description for this agent.
          </p>

          <label className="mt-4 block text-xs font-medium text-slate-300">
            Agent name
            <input
              required
              minLength={2}
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. ci-deploy-bot"
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
            />
          </label>

          <label className="mt-3 block text-xs font-medium text-slate-300">
            Description (optional)
            <input
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this agent does"
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
            />
          </label>

          {error && (
            <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? 'Registering…' : 'Register agent'}
          </button>
        </form>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
          <h3 className="text-sm font-semibold text-white">MCP endpoint</h3>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Use this URL when connecting from Cursor or other MCP clients.
          </p>
          <code className="mt-3 block break-all rounded-lg bg-[var(--color-surface)] px-3 py-2 font-mono text-xs text-emerald-200/90">
            {mcpEndpoint || `${window.location.origin}/mcp`}
          </code>
        </div>
      </div>

      {registered && (
        <div className="mb-8 rounded-xl border-2 border-amber-500/40 bg-amber-500/5 p-5">
          <p className="text-sm font-semibold text-amber-200">Save these credentials now</p>
          <p className="mt-1 text-xs text-amber-200/70">{registered.message}</p>

          <div className="mt-4 space-y-3">
            {[
              ['Agent ID', registered.agentId],
              ['API Key', registered.apiKey],
              ['MCP URL', registered.mcpEndpoint],
            ].map(([label, val]) => (
              <div key={label} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-[var(--color-muted)]">{label}</span>
                  <button
                    type="button"
                    onClick={() => copy(label, val)}
                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white"
                  >
                    <CopyIcon />
                    {copied === label ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="mt-1 break-all font-mono text-sm text-emerald-50/95">{val}</p>
              </div>
            ))}

            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[var(--color-muted)]">
                  Cursor MCP config
                </span>
                <button
                  type="button"
                  onClick={() => copy('config', cursorJson)}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white"
                >
                  <CopyIcon />
                  {copied === 'config' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="mt-2 max-h-40 overflow-auto font-mono text-xs text-slate-300">
                {cursorJson}
              </pre>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)]">
        <div className="border-b border-[var(--color-border)] px-5 py-3">
          <h3 className="text-sm font-semibold text-white">Registered agents</h3>
        </div>
        {agents.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-[var(--color-muted)]">
            No agents yet. Register one above to get started.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {agents.map((a) => (
              <li key={a.agentId} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-white">{a.name}</p>
                    <p className="font-mono text-xs text-[var(--color-muted)]">{a.agentId}</p>
                    {a.description && (
                      <p className="mt-1 text-xs text-slate-400">{a.description}</p>
                    )}
                  </div>
                  <div className="text-right text-xs text-[var(--color-muted)]">
                    <p>Created {new Date(a.createdAt).toLocaleString()}</p>
                    {a.lastSeenAt && (
                      <p>Last seen {new Date(a.lastSeenAt).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
