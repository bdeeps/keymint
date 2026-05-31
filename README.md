# KeyMint

Cryptographic secret generator for production apps. One screen, zero signup — everything runs in your browser via the Web Crypto API.

## Features

- **API & Auth** — API keys, JWT secrets (HS256/HS512), session secrets, OAuth client secrets, webhook signing keys, CSRF tokens
- **Encryption** — AES-256 keys, GCM nonces, password salts, application peppers
- **Tokens & IDs** — UUID v4/v7, opaque refresh/access tokens, correlation IDs
- **Credentials** — database passwords, passphrases, Basic Auth pairs
- **Bundles** — `.env` starter packs, Next.js secrets, payment key scaffolding

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## Security

Secrets are generated with `crypto.getRandomValues` (CSPRNG). Nothing is sent to a server. Rotate and store in your secrets manager before production use.

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `R` | Regenerate |
| `C` | Copy |
| `↑` `↓` | Previous / next preset |
