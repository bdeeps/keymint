# KeyMint MCP Reference

Transport: **Streamable HTTP** (MCP spec). Endpoint: `{ORIGIN}/mcp`.

## Session setup

1. `POST {ORIGIN}/mcp` with MCP initialize payload (per your client's MCP driver).
2. Include `Authorization: Bearer km_agent_…` on the **first** request if you are already registered.
3. To register without a key, omit `Authorization` and call `register_agent` first.

## Tools

### `register_agent` (public)

Self-register. No Bearer token required.

**Input:**

```json
{
  "name": "required, 2-120 chars",
  "description": "optional, max 500 chars"
}
```

**Output (JSON text content):**

```json
{
  "agentId": "agent_…",
  "apiKey": "km_agent_…",
  "name": "…",
  "mcpEndpoint": "https://…/mcp",
  "createdAt": "ISO-8601"
}
```

Store `apiKey` immediately. Reconnect MCP with Bearer header for authenticated tools.

---

### `list_presets` (public)

**Input:** `{}`

**Output:** `{ "presets": [ { "id", "name", "description", "category", "hint", "format" }, … ] }`

---

### `generate_secret` (authenticated)

**Input:**

```json
{
  "preset_id": "jwt-hs256",
  "count": 3
}
```

- `preset_id` — required, from `list_presets`
- `count` — optional, 1–5 (default 3)

**Output:**

```json
{
  "presetId": "jwt-hs256",
  "count": 3,
  "values": ["…", "…", "…"],
  "agentId": "agent_…"
}
```

---

### `agent_whoami` (authenticated)

**Input:** `{}`

**Output:**

```json
{
  "agentId": "agent_…",
  "name": "…",
  "description": "…"
}
```

## Errors

Tool errors return `isError: true` with JSON text:

```json
{ "error": "Unauthorized", "hint": "Pass Authorization: Bearer <apiKey> when opening the MCP session" }
```

## Client examples

### Cursor

Use the `cursorConfig` object from `POST /api/agents/register` or `/api/agent-manifest` → `examples.cursorConfig`.

### Generic HTTP

Follow [MCP Streamable HTTP](https://modelcontextprotocol.io/) client libraries; base URL is `/mcp` on your KeyMint host.
