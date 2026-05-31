import {
  entropyBits,
  randomBase64,
  randomBase64Url,
  randomDbPassword,
  randomHex,
  randomPassphrase,
  randomUsername,
  uuidV4,
  uuidV7,
} from './crypto'

export type Category =
  | 'api'
  | 'encryption'
  | 'tokens'
  | 'credentials'
  | 'bundles'

export interface Preset {
  id: string
  name: string
  description: string
  category: Category
  bytes: number
  hint: string
  generate: () => string
  format?: string
}

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'api', label: 'API & Auth' },
  { id: 'encryption', label: 'Encryption' },
  { id: 'tokens', label: 'Tokens & IDs' },
  { id: 'credentials', label: 'Credentials' },
  { id: 'bundles', label: 'Bundles' },
]

export const PRESETS: Preset[] = [
  {
    id: 'api-key-hex',
    name: 'API Key',
    description: 'General-purpose secret for REST APIs and microservices.',
    category: 'api',
    bytes: 32,
    hint: '64-char hex · 256-bit',
    format: 'hex',
    generate: () => randomHex(32),
  },
  {
    id: 'api-key-b64',
    name: 'Bearer Token',
    description: 'URL-safe token for Authorization headers.',
    category: 'api',
    bytes: 32,
    hint: 'Base64url · no padding',
    format: 'base64url',
    generate: () => randomBase64Url(32),
  },
  {
    id: 'jwt-hs256',
    name: 'JWT Secret (HS256)',
    description: 'Signing key for JSON Web Tokens with HMAC-SHA256.',
    category: 'api',
    bytes: 32,
    hint: '256-bit minimum per RFC 7518',
    format: 'hex',
    generate: () => randomHex(32),
  },
  {
    id: 'jwt-hs512',
    name: 'JWT Secret (HS512)',
    description: 'Stronger signing key for HMAC-SHA512.',
    category: 'api',
    bytes: 64,
    hint: '512-bit · high-security workloads',
    format: 'hex',
    generate: () => randomHex(64),
  },
  {
    id: 'session-secret',
    name: 'Session Secret',
    description: 'Express, Fastify, or custom signed session cookies.',
    category: 'api',
    bytes: 48,
    hint: 'Base64 · ≥384-bit recommended',
    format: 'base64',
    generate: () => randomBase64(48),
  },
  {
    id: 'auth-secret',
    name: 'AUTH_SECRET',
    description: 'Next.js, Auth.js, and similar framework env vars.',
    category: 'api',
    bytes: 32,
    hint: 'Base64 · framework-standard length',
    format: 'base64',
    generate: () => randomBase64(32),
  },
  {
    id: 'oauth-client',
    name: 'OAuth Client Secret',
    description: 'Confidential client credentials for OIDC/OAuth 2.0.',
    category: 'api',
    bytes: 32,
    hint: 'Hex · store in secrets manager',
    format: 'hex',
    generate: () => randomHex(32),
  },
  {
    id: 'webhook-secret',
    name: 'Webhook Signing Secret',
    description: 'HMAC verification for Stripe, GitHub, Svix-style webhooks.',
    category: 'api',
    bytes: 32,
    hint: 'whsec_ prefix + base64url payload',
    format: 'prefixed',
    generate: () => `whsec_${randomBase64Url(32)}`,
  },
  {
    id: 'hmac-secret',
    name: 'HMAC Signing Key',
    description: 'Request signatures, inter-service auth, API gateways.',
    category: 'api',
    bytes: 32,
    hint: 'Hex · pair with timestamp + nonce',
    format: 'hex',
    generate: () => randomHex(32),
  },
  {
    id: 'csrf-token',
    name: 'CSRF Token',
    description: 'Double-submit cookie or synchronizer token pattern.',
    category: 'api',
    bytes: 32,
    hint: 'Hex · rotate per session',
    format: 'hex',
    generate: () => randomHex(32),
  },
  {
    id: 'cookie-signing',
    name: 'Cookie Signing Key',
    description: 'Signed/encrypted HTTP-only session cookies.',
    category: 'api',
    bytes: 32,
    hint: 'Base64 · separate from session ID',
    format: 'base64',
    generate: () => randomBase64(32),
  },
  {
    id: 'aes-256-key',
    name: 'AES-256 Key',
    description: 'Symmetric encryption at rest (AES-256-GCM).',
    category: 'encryption',
    bytes: 32,
    hint: 'Hex · never reuse with same IV',
    format: 'hex',
    generate: () => randomHex(32),
  },
  {
    id: 'aes-gcm-iv',
    name: 'AES-GCM Nonce (IV)',
    description: '12-byte nonce — unique per encryption with same key.',
    category: 'encryption',
    bytes: 12,
    hint: 'Hex · 96-bit nonce for GCM',
    format: 'hex',
    generate: () => randomHex(12),
  },
  {
    id: 'salt',
    name: 'Password Hash Salt',
    description: 'Per-user salt for Argon2id, scrypt, or bcrypt.',
    category: 'encryption',
    bytes: 16,
    hint: 'Hex · 128-bit · unique per user',
    format: 'hex',
    generate: () => randomHex(16),
  },
  {
    id: 'pepper',
    name: 'Application Pepper',
    description: 'Server-side secret combined before password hashing.',
    category: 'encryption',
    bytes: 32,
    hint: 'Hex · env-only · never in DB',
    format: 'hex',
    generate: () => randomHex(32),
  },
  {
    id: 'encryption-key-b64',
    name: 'Encryption Key (Base64)',
    description: 'Libsodium / Node crypto key import format.',
    category: 'encryption',
    bytes: 32,
    hint: 'Base64 · 256-bit',
    format: 'base64',
    generate: () => randomBase64(32),
  },
  {
    id: 'refresh-token',
    name: 'Opaque Refresh Token',
    description: 'OAuth 2.0 refresh tokens stored hashed server-side.',
    category: 'tokens',
    bytes: 48,
    hint: 'Base64url · high entropy opaque',
    format: 'base64url',
    generate: () => randomBase64Url(48),
  },
  {
    id: 'access-token',
    name: 'Opaque Access Token',
    description: 'Random bearer tokens validated server-side.',
    category: 'tokens',
    bytes: 32,
    hint: 'Base64url',
    format: 'base64url',
    generate: () => randomBase64Url(32),
  },
  {
    id: 'api-key-prefixed',
    name: 'Prefixed API Key',
    description: 'Live/test key format for quick identification in logs.',
    category: 'tokens',
    bytes: 24,
    hint: 'km_live_ + random segment',
    format: 'prefixed',
    generate: () => `km_live_${randomBase64Url(24)}`,
  },
  {
    id: 'uuid-v4',
    name: 'UUID v4',
    description: 'RFC 4122 random UUID for IDs and correlation.',
    category: 'tokens',
    bytes: 16,
    hint: '122 bits randomness',
    format: 'uuid',
    generate: () => uuidV4(),
  },
  {
    id: 'uuid-v7',
    name: 'UUID v7',
    description: 'Time-sortable UUID for databases and event streams.',
    category: 'tokens',
    bytes: 16,
    hint: 'Timestamp + random · index-friendly',
    format: 'uuid',
    generate: () => uuidV7(),
  },
  {
    id: 'correlation-id',
    name: 'Correlation ID',
    description: 'Distributed tracing and request log correlation.',
    category: 'tokens',
    bytes: 16,
    hint: '32-char hex',
    format: 'hex',
    generate: () => randomHex(16),
  },
  {
    id: 'db-password',
    name: 'Database Password',
    description: 'PostgreSQL, MySQL, Redis — mixed charset, 32 chars.',
    category: 'credentials',
    bytes: 32,
    hint: 'Upper + lower + digit + symbol',
    format: 'password',
    generate: () => randomDbPassword(32),
  },
  {
    id: 'service-password',
    name: 'Service Account Password',
    description: 'Machine users and CI/CD secrets — 40 characters.',
    category: 'credentials',
    bytes: 40,
    hint: 'High complexity · rotate quarterly',
    format: 'password',
    generate: () => randomDbPassword(40),
  },
  {
    id: 'passphrase',
    name: 'Passphrase',
    description: 'Human-readable backup codes and emergency access.',
    category: 'credentials',
    bytes: 48,
    hint: '6 words · ~77 bits entropy',
    format: 'words',
    generate: () => randomPassphrase(6),
  },
  {
    id: 'passphrase-long',
    name: 'Long Passphrase',
    description: 'Encryption recovery phrases and vault master hints.',
    category: 'credentials',
    bytes: 64,
    hint: '8 words · ~103 bits entropy',
    format: 'words',
    generate: () => randomPassphrase(8),
  },
  {
    id: 'basic-auth',
    name: 'Basic Auth Credentials',
    description: 'username:password pair for HTTP Basic or staging gates.',
    category: 'credentials',
    bytes: 36,
    hint: 'Copy as Authorization header value',
    format: 'basic',
    generate: () => {
      const user = randomUsername()
      const pass = randomDbPassword(24)
      const encoded = btoa(`${user}:${pass}`)
      return `${user}:${pass}\n\nBasic ${encoded}`
    },
  },
  {
    id: 'env-starter',
    name: '.env Starter Pack',
    description: 'Common secrets block ready to paste into .env.local.',
    category: 'bundles',
    bytes: 128,
    hint: 'AUTH_SECRET, API_KEY, SESSION, PEPPER',
    format: 'env',
    generate: () => {
      const lines = [
        `# Generated by KeyMint — rotate before production`,
        `AUTH_SECRET=${randomBase64(32)}`,
        `API_KEY=${randomHex(32)}`,
        `SESSION_SECRET=${randomBase64(48)}`,
        `WEBHOOK_SECRET=whsec_${randomBase64Url(32)}`,
        `ENCRYPTION_KEY=${randomHex(32)}`,
        `PEPPER=${randomHex(32)}`,
        `DATABASE_URL=postgres://user:${encodeURIComponent(randomDbPassword(24))}@localhost:5432/app`,
      ]
      return lines.join('\n')
    },
  },
  {
    id: 'nextjs-env',
    name: 'Next.js Secrets',
    description: 'AUTH_SECRET and CRON_SECRET style variables.',
    category: 'bundles',
    bytes: 64,
    hint: 'Auth.js / Next.js App Router',
    format: 'env',
    generate: () =>
      [
        `AUTH_SECRET=${randomBase64(32)}`,
        `CRON_SECRET=${randomHex(16)}`,
        `NEXTAUTH_URL=http://localhost:3000`,
      ].join('\n'),
  },
  {
    id: 'stripe-style',
    name: 'Payment Keys (Test Format)',
    description: 'Placeholder test key shapes for local dev scaffolding.',
    category: 'bundles',
    bytes: 48,
    hint: 'sk_test_ / pk_test_ — not real Stripe keys',
    format: 'env',
    generate: () =>
      [
        `STRIPE_SECRET_KEY=sk_test_${randomBase64Url(24)}`,
        `STRIPE_PUBLISHABLE_KEY=pk_test_${randomBase64Url(24)}`,
        `STRIPE_WEBHOOK_SECRET=whsec_${randomBase64Url(32)}`,
      ].join('\n'),
  },
]

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id)
}

export function effectiveEntropy(preset: Preset): number {
  if (preset.id === 'passphrase') return 77
  if (preset.id === 'passphrase-long') return 103
  if (preset.id === 'uuid-v4') return 122
  if (preset.id === 'basic-auth') return 288
  if (preset.id.startsWith('env') || preset.category === 'bundles') {
    return entropyBits(preset.bytes)
  }
  return entropyBits(preset.bytes)
}
