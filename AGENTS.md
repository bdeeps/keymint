# KeyMint — Agent Guide

You are an AI agent connecting to **KeyMint**, a cryptographic secret generator with **self-service registration**. Read this file first, then register, then use MCP or REST to generate secrets.

## Quick start (60 seconds)

1. **Discover** — `GET /api/agent-manifest` (JSON: all URLs, tools, preset IDs)
2. **Register** — `POST /api/agents/register` with `{ "name": "your-agent-name", "description": "optional" }`
3. **Save** — `apiKey` and `agentId` from the response (shown **once** only)
4. **Connect MCP** — use `mcpEndpoint` + `Authorization: Bearer <apiKey>` (see manifest `cursorConfig` example)
5. **Generate** — call `generate_secret` (MCP) or `POST /api/secrets/generate` (REST)

## Machine-readable manifest

```http
GET /api/agent-manifest
```

Returns JSON with `selfRegistration`, `mcp`, `rest`, `presets`, `documentation` links, and a ready-to-paste Cursor MCP config template.

Also available at:

```http
GET /.well-known/keymint.json
```

## Self-registration (REST)

```http
POST /api/agents/register
Content-Type: application/json

{
  "name": "my-deployment-bot",
  "description": "Generates JWT and API keys for staging deploys"
}
```

**Response (201):**

```json
{
  "agentId": "agent_…",
  "apiKey": "km_agent_…",
  "mcpEndpoint": "https://YOUR_HOST/mcp",
  "cursorConfig": { "mcpServers": { "keymint": { "url": "…", "headers": { "Authorization": "Bearer km_agent_…" } } } },
  "message": "Store apiKey securely — it cannot be retrieved again."
}
```

## Self-registration (MCP)

Connect to Streamable HTTP MCP at `{origin}/mcp`, then call:

| Tool | Auth | Input |
|------|------|-------|
| `register_agent` | None | `{ "name": "string", "description?": "string" }` |

Returns the same `agentId`, `apiKey`, and `mcpEndpoint` as REST.

**Important:** For later MCP calls (`generate_secret`, `agent_whoami`), open the MCP session with header:

```http
Authorization: Bearer km_agent_YOUR_KEY
```

## Authenticated operations

### MCP tools

| Tool | Auth | Purpose |
|------|------|---------|
| `list_presets` | None | All `preset_id` values and metadata |
| `generate_secret` | Bearer | `{ "preset_id": "jwt-hs256", "count?": 3 }` → CSPRNG values |
| `agent_whoami` | Bearer | Your registered profile |

### REST

| Method | Path | Auth | Body |
|--------|------|------|------|
| `GET` | `/api/presets` | — | — |
| `POST` | `/api/secrets/generate` | Bearer | `{ "presetId": "api-key-hex", "count": 3 }` |
| `GET` | `/api/agents/me` | Bearer | — |
| `GET` | `/api/agents` | — | List agents (no secrets) |
| `GET` | `/health` | — | — |

## Preset IDs (common)

| `preset_id` | Use case |
|-------------|----------|
| `api-key-hex` | General API key (256-bit hex) |
| `api-key-b64` | Bearer token (Base64url) |
| `jwt-hs256` | JWT signing secret HS256 |
| `jwt-hs512` | JWT signing secret HS512 |
| `auth-secret` | Next.js / Auth.js `AUTH_SECRET` |
| `session-secret` | Express / cookie sessions |
| `webhook-secret` | Stripe-style `whsec_` signing |
| `aes-256-key` | AES-256-GCM encryption key |
| `uuid-v4` | Random UUID |
| `uuid-v7` | Time-sortable UUID |
| `db-password` | Database password |
| `env-starter` | Multi-line `.env` block |

Full list: `GET /api/presets` or MCP `list_presets`.

## Cursor MCP configuration

After registration, merge into the user's MCP settings (or use the `cursorConfig` object from the register response):

```json
{
  "mcpServers": {
    "keymint": {
      "url": "https://YOUR_DEPLOYED_HOST/mcp",
      "headers": {
        "Authorization": "Bearer km_agent_REPLACE_WITH_YOUR_KEY"
      }
    }
  }
}
```

## Security rules for agents

1. **Never** log or commit `apiKey` to git, issues, or chat transcripts.
2. **Never** re-request registration if you already have a key — register once per agent identity.
3. Store the key in the host's secret store or MCP headers only.
4. Generated secrets are CSPRNG (`crypto.getRandomValues` / Node equivalent); treat as production credentials.
5. Prefer `generate_secret` over inventing random strings.

## Documentation map

| Resource | URL (relative to deployment origin) |
|----------|-------------------------------------|
| This guide | `/AGENTS.md` |
| Full MCP reference | `/docs/agents/mcp.md` |
| REST reference | `/docs/agents/rest.md` |
| Preset catalog | `/docs/agents/presets.md` |
| Project skill (Cursor) | `/docs/skill.md` |
| JSON manifest | `/api/agent-manifest` |

## Human UI

Humans can register agents at `{origin}/` → **Agents** tab. Agents should use API/MCP directly.

## Repository

Source: https://github.com/bdeeps/keymint

When running locally: API on port `3000`, UI on `5173` (Vite proxies `/api` and `/mcp`).
