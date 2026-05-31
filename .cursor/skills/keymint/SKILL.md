---
name: keymint
description: >-
  Register and use the KeyMint MCP server to generate cryptographically secure
  API keys, JWT secrets, webhook keys, UUIDs, and .env bundles. Use when the
  user or task needs production secrets, KeyMint agent registration, km_agent
  API keys, or connecting to a KeyMint deployment.
---
# KeyMint Agent Skill

KeyMint provides **CSPRNG secrets** and **agent self-registration** via MCP and REST.

## Before generating secrets

1. Fetch **`GET {KEYMINT_ORIGIN}/api/agent-manifest`** (or read repo `AGENTS.md`).
2. If you lack `km_agent_…` credentials, **self-register** (once per agent identity).
3. Use returned **`apiKey`** only via Bearer header — never log or commit it.

Replace `{KEYMINT_ORIGIN}` with the user's deployed URL (e.g. Railway) or `http://localhost:3000` when the server runs locally.

## Self-register (choose one)

### REST

```http
POST {KEYMINT_ORIGIN}/api/agents/register
Content-Type: application/json

{ "name": "<agent-name>", "description": "<optional>" }
```

Save `apiKey`, `agentId`, `mcpEndpoint`, and `cursorConfig` from the JSON response.

### MCP

1. Connect to `{KEYMINT_ORIGIN}/mcp` (Streamable HTTP).
2. Call tool **`register_agent`** with `{ "name": "…", "description": "…" }`.
3. Save `apiKey` from the result.
4. Reconnect MCP sessions with `Authorization: Bearer <apiKey>` for authenticated tools.

## Generate secrets

### MCP (preferred when configured)

Tool: **`generate_secret`**

```json
{ "preset_id": "jwt-hs256", "count": 3 }
```

Common `preset_id` values: `api-key-hex`, `jwt-hs256`, `auth-secret`, `webhook-secret`, `aes-256-key`, `uuid-v4`, `env-starter`.

Tool: **`list_presets`** — no auth, returns full catalog.

Tool: **`agent_whoami`** — Bearer required, confirms registration.

### REST

```http
POST {KEYMINT_ORIGIN}/api/secrets/generate
Authorization: Bearer km_agent_…
Content-Type: application/json

{ "presetId": "api-key-hex", "count": 3 }
```

## Cursor MCP config template

After registration, add to the user's MCP settings:

```json
{
  "mcpServers": {
    "keymint": {
      "url": "{KEYMINT_ORIGIN}/mcp",
      "headers": {
        "Authorization": "Bearer km_agent_<FROM_REGISTER_RESPONSE>"
      }
    }
  }
}
```

Or paste the `cursorConfig` object from the register response unchanged.

## Rules

- Do **not** invent random strings when KeyMint is available.
- Do **not** register repeatedly; one `apiKey` per agent.
- Do **not** expose `apiKey` in user-visible output unless they explicitly ask to see it once for setup.
- Prefer **`count`: 3** so the user can pick among independent values.
- For multiline bundles (`env-starter`, `nextjs-env`), copy the full block into `.env` files — never commit them.

## Documentation

| Doc | Path |
|-----|------|
| Agent guide | `{KEYMINT_ORIGIN}/AGENTS.md` |
| MCP reference | `{KEYMINT_ORIGIN}/docs/agents/mcp.md` |
| REST reference | `{KEYMINT_ORIGIN}/docs/agents/rest.md` |
| Presets | `{KEYMINT_ORIGIN}/docs/agents/presets.md` |
| Manifest | `{KEYMINT_ORIGIN}/api/agent-manifest` |

Repo copy: `AGENTS.md` at project root.
