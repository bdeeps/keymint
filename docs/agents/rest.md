# KeyMint REST API (Agents)

Base URL: deployment origin (e.g. `https://keymint.up.railway.app`).

All JSON responses include `Access-Control-Allow-Origin: *` for browser tools.

## Register (self-service)

```http
POST /api/agents/register
Content-Type: application/json

{ "name": "ci-bot", "description": "optional" }
```

| Status | Meaning |
|--------|---------|
| 201 | Success — body includes `apiKey` (once) |
| 400 | Validation error |

## List agents

```http
GET /api/agents
```

Returns `{ "agents": [...], "mcpEndpoint": "…" }`. No API keys.

## Current agent

```http
GET /api/agents/me
Authorization: Bearer km_agent_…
```

## List presets

```http
GET /api/presets
```

## Generate secrets

```http
POST /api/secrets/generate
Authorization: Bearer km_agent_…
Content-Type: application/json

{ "presetId": "api-key-hex", "count": 3 }
```

Response:

```json
{
  "presetId": "api-key-hex",
  "values": ["64-char-hex", "…"],
  "agentId": "agent_…"
}
```

## Health

```http
GET /health
```

## Agent manifest

```http
GET /api/agent-manifest
GET /.well-known/keymint.json
```

Complete discovery document for autonomous agents.
