# KeyMint Preset Catalog

Each preset uses a CSPRNG. Use `preset_id` in MCP `generate_secret` or REST `presetId`.

## API & Auth (`category: api`)

| preset_id | Format | Notes |
|-----------|--------|-------|
| `api-key-hex` | hex | 256-bit API key |
| `api-key-b64` | base64url | Bearer tokens |
| `jwt-hs256` | hex | 256-bit JWT secret |
| `jwt-hs512` | hex | 512-bit JWT secret |
| `session-secret` | base64 | Session signing |
| `auth-secret` | base64 | AUTH_SECRET / NextAuth |
| `oauth-client` | hex | OAuth client secret |
| `webhook-secret` | prefixed | `whsec_` + payload |
| `hmac-secret` | hex | HMAC signing |
| `csrf-token` | hex | CSRF tokens |
| `cookie-signing` | base64 | Cookie signing key |

## Encryption (`encryption`)

| preset_id | Format |
|-----------|--------|
| `aes-256-key` | hex |
| `aes-gcm-iv` | hex (12 bytes) |
| `salt` | hex |
| `pepper` | hex |
| `encryption-key-b64` | base64 |

## Tokens (`tokens`)

| preset_id | Format |
|-----------|--------|
| `refresh-token` | base64url |
| `access-token` | base64url |
| `api-key-prefixed` | `km_live_` + segment |
| `uuid-v4` | UUID |
| `uuid-v7` | UUID v7 |
| `correlation-id` | hex |

## Credentials (`credentials`)

| preset_id | Format |
|-----------|--------|
| `db-password` | password |
| `service-password` | password (40 chars) |
| `passphrase` | 6 words |
| `passphrase-long` | 8 words |
| `basic-auth` | user:pass + Basic header |

## Bundles (`bundles`)

| preset_id | Format |
|-----------|--------|
| `env-starter` | env multiline |
| `nextjs-env` | env multiline |
| `stripe-style` | env multiline (test format) |

Live catalog: `GET /api/presets` or MCP `list_presets`.
