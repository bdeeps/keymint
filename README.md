# KeyMint

**Generate production-grade cryptographic secrets in your browser — instantly, privately, and correctly.**

KeyMint is a free, open-source secret generator built for developers, DevOps engineers, and security teams who need **cryptographically secure random strings** without signing up, without sending data to a server, and without guessing byte lengths or formats. One screen. Three independent options per secret type. Copy and ship.

If you have ever searched for *“JWT secret generator”*, *“API key generator online”*, *“AUTH_SECRET for Next.js”*, *“webhook signing secret”*, *“generate AES-256 key hex”*, or *“secure random string for .env”* — KeyMint is built for exactly that workflow.

🔗 **Live:** deploy `dist/` or run locally (see [Quick start](#quick-start))  
📦 **Repo:** [github.com/bdeeps/keymint](https://github.com/bdeeps/keymint)

---

## Why KeyMint exists

Most “random string generators” on the web use `Math.random()`, wrong charset, or short lengths. Production apps need **CSPRNG output** (cryptographically secure pseudo-random), correct sizes per spec, and the right encoding (hex, Base64, Base64url, prefixed keys, UUID layouts).

KeyMint uses the browser’s **`crypto.getRandomValues`** (Web Crypto API) — the same primitive behind TLS, Node’s `crypto`, and modern auth libraries. Every value is generated **locally on your machine**. Nothing is logged, stored, or transmitted.

---

## What you can generate

### API keys & authentication

| Secret type | Typical use |
|-------------|-------------|
| **API Key (hex)** | REST APIs, microservices, internal service tokens (256-bit) |
| **Bearer Token (Base64url)** | `Authorization: Bearer` headers, URL-safe tokens |
| **JWT Secret (HS256 / HS512)** | Signing keys for JSON Web Tokens per RFC 7518 |
| **Session Secret** | Express, Fastify, signed cookies (384+ bits) |
| **AUTH_SECRET** | Next.js, Auth.js, NextAuth environment variables |
| **OAuth Client Secret** | OIDC / OAuth 2.0 confidential clients |
| **Webhook Signing Secret** | Stripe-style `whsec_`, GitHub, Svix HMAC verification |
| **HMAC Signing Key** | Request signatures, API gateways, inter-service auth |
| **CSRF Token** | Double-submit cookie / synchronizer tokens |
| **Cookie Signing Key** | Signed or encrypted HTTP-only session cookies |

### Encryption & hashing

| Secret type | Typical use |
|-------------|-------------|
| **AES-256 Key** | Symmetric encryption at rest (AES-256-GCM) |
| **AES-GCM Nonce (IV)** | 96-bit nonce — unique per encryption with same key |
| **Password Hash Salt** | Per-user salt for Argon2id, scrypt, bcrypt |
| **Application Pepper** | Server-side secret combined before hashing (env-only) |
| **Encryption Key (Base64)** | Libsodium / Node `crypto` key import format |

### Tokens & identifiers

| Secret type | Typical use |
|-------------|-------------|
| **Opaque Refresh Token** | OAuth 2.0 refresh tokens (store hashed server-side) |
| **Opaque Access Token** | Random bearer tokens validated in your database |
| **Prefixed API Key** | `km_live_` style keys for log identification |
| **UUID v4** | RFC 4122 random UUIDs for IDs and correlation |
| **UUID v7** | Time-sortable UUIDs for databases and event streams |
| **Correlation ID** | Distributed tracing and request log correlation |

### Credentials

| Secret type | Typical use |
|-------------|-------------|
| **Database Password** | PostgreSQL, MySQL, Redis — mixed charset, 32 chars |
| **Service Account Password** | CI/CD and machine users (40 chars) |
| **Passphrase (6 / 8 words)** | Human-readable backup codes, recovery phrases |
| **Basic Auth Credentials** | Staging gates, `username:password` + encoded header |

### Ready-to-paste bundles

| Bundle | Typical use |
|--------|-------------|
| **`.env` Starter Pack** | `AUTH_SECRET`, `API_KEY`, `SESSION_SECRET`, `WEBHOOK_SECRET`, `ENCRYPTION_KEY`, `PEPPER`, sample `DATABASE_URL` |
| **Next.js Secrets** | `AUTH_SECRET`, `CRON_SECRET`, `NEXTAUTH_URL` |
| **Payment Keys (test format)** | `sk_test_` / `pk_test_` / `whsec_` scaffolding for local dev *(not real Stripe keys)* |

---

## How it works (UX)

1. **Pick a secret type** from the sidebar — filter by category (API & Auth, Encryption, Tokens & IDs, Credentials, Bundles) or search.
2. **Get 3 independent options** — each card is a fresh CSPRNG draw so you can compare and choose without regenerating one at a time.
3. **Regenerate all** — prominent action at the top (not buried at the bottom of the page).
4. **Select + copy** — click a card to select it, use **Copy #N**, or copy any option individually.

Designed for speed: keyboard shortcuts, monospace output, entropy badges, and format hints (hex, Base64url, prefixed, UUID, etc.) on every preset.

---

## Security model

| Property | KeyMint |
|----------|---------|
| Random source | `crypto.getRandomValues` (CSPRNG) |
| Network | **No server** — static SPA, secrets never leave the browser |
| Storage | **None** — refresh the page and values are gone |
| DB passwords | Rejection sampling + required character classes |
| Passphrases | Unbiased word selection from a fixed dictionary |

**Operational guidance:** treat generated values like any new credential — store in a secrets manager (1Password, Vault, AWS Secrets Manager, Doppler, etc.), rotate on schedule, and **never commit** `.env` files to git.

---

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `R` | Regenerate all 3 options |
| `C` | Copy selected option |
| `1` `2` `3` | Select option 1, 2, or 3 |
| `↑` `↓` | Move selection between options |
| `Shift` + `↑` `↓` | Previous / next secret type in the list |

---

## Agent registration & MCP server

KeyMint includes a **self-service agent registry** backed by **Postgres** (Railway). AI agents register once, receive an API key, and call the **MCP endpoint** to generate secrets programmatically.

### Documentation for AI agents

| Resource | Path |
|----------|------|
| **Start here** | [`AGENTS.md`](./AGENTS.md) |
| **JSON manifest** | `GET /api/agent-manifest` or `/.well-known/keymint.json` |
| MCP reference | [`docs/agents/mcp.md`](./docs/agents/mcp.md) |
| REST reference | [`docs/agents/rest.md`](./docs/agents/rest.md) |
| Preset catalog | [`docs/agents/presets.md`](./docs/agents/presets.md) |
| Cursor skill | [`.cursor/skills/keymint/SKILL.md`](./.cursor/skills/keymint/SKILL.md) (also served at `/docs/skill.md`) |

Agents should fetch the manifest first, then `POST /api/agents/register` or MCP `register_agent`.

### REST API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/agents/register` | — | Register agent (`name`, optional `description`) |
| `GET` | `/api/agents` | — | List registered agents (no secrets) |
| `GET` | `/api/agents/me` | Bearer | Current agent profile |
| `POST` | `/api/secrets/generate` | Bearer | Generate secrets (`presetId`, `count`) |
| `GET` | `/api/presets` | — | List preset catalog |
| `GET` | `/health` | — | Health check |

### MCP tools (`POST /mcp`)

Streamable HTTP transport (Cursor, Claude Desktop, SDK).

| Tool | Auth | Description |
|------|------|-------------|
| `register_agent` | Public | Self-register; returns `agentId` + `apiKey` (once) |
| `list_presets` | Public | All secret preset definitions |
| `generate_secret` | Bearer `km_agent_…` | Generate values for a `preset_id` |
| `agent_whoami` | Bearer | Authenticated agent metadata |

### Cursor MCP config

```json
{
  "mcpServers": {
    "keymint": {
      "url": "https://your-app.up.railway.app/mcp",
      "headers": {
        "Authorization": "Bearer km_agent_YOUR_KEY"
      }
    }
  }
}
```

### Deploy on Railway

1. Create a project and attach **PostgreSQL**.
2. Set variables from [`.env.example`](.env.example):
   - `DATABASE_URL` (from Postgres plugin)
   - `PUBLIC_URL` (your Railway public URL)
   - `KEYMINT_PEPPER` (long random string for API key hashing)
3. Deploy from this repo — `railway.toml` builds the UI and starts the Node server on `$PORT`.
4. Open the **Agents** tab in the UI to register agents or use MCP `register_agent`.

Local full stack:

```bash
# Terminal 1 — API + MCP (requires DATABASE_URL)
cd server && cp ../.env.example .env  # edit DATABASE_URL
npm run dev

# Terminal 2 — UI (proxies /api and /mcp to :3000)
npm run dev
```

---

## Quick start

```bash
git clone https://github.com/bdeeps/keymint.git
cd keymint
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Production build

```bash
npm run build
npm run preview
```

Deploy the `dist/` folder to any static host (Vercel, Netlify, Cloudflare Pages, S3, GitHub Pages).

---

## Tech stack

- **React 19** + **TypeScript** + **Vite** (browser UI)
- **Node** + **PostgreSQL** + **MCP SDK** (agent registry & API)
- **Tailwind CSS v4**

---

## Search keywords (what people look for)

KeyMint helps when you need any of the following:

`cryptographic random string generator` · `secure API key generator` · `JWT secret generator` · `HS256 secret` · `HS512 secret` · `session secret generator` · `AUTH_SECRET generator` · `NextAuth secret` · `OAuth client secret generator` · `webhook secret generator` · `Stripe webhook secret format` · `HMAC secret key` · `CSRF token generator` · `AES-256 key generator` · `encryption key hex` · `password salt generator` · `application pepper` · `UUID v4 generator` · `UUID v7 generator` · `opaque refresh token` · `database password generator` · `secure passphrase generator` · `env file secrets generator` · `dotenv secret generator` · `CSPRNG browser` · `crypto.getRandomValues example` · `developer secrets tool` · `local secret generator no signup`

---

## Comparison

| Approach | KeyMint | `openssl rand -hex 32` | Online “random string” sites |
|----------|---------|------------------------|------------------------------|
| CSPRNG | ✅ | ✅ | Often ❌ (`Math.random`) |
| Correct formats per use case | ✅ | Manual | Rare |
| No install | ✅ (browser) | CLI required | ✅ |
| Privacy (no upload) | ✅ | ✅ | Often ❌ |
| Multiple options + UI | ✅ | ❌ | Varies |

---

## Contributing

Issues and PRs welcome. Keep the app client-only: no analytics, no accounts, no secret telemetry.

---

## License

MIT — use freely in personal and commercial projects.

---

<p align="center">
  <strong>KeyMint</strong> — mint cryptographically correct secrets, locally, in seconds.
</p>
