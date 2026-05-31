import { listPresetCatalog, publicBaseUrl } from './agents.js'

const MCP_TOOLS = [
  {
    name: 'register_agent',
    public: true,
    description: 'Self-register; returns agentId and apiKey (once).',
    input: { name: 'string (2-120)', description: 'optional string (max 500)' },
  },
  {
    name: 'list_presets',
    public: true,
    description: 'List all secret preset definitions.',
    input: {},
  },
  {
    name: 'generate_secret',
    public: false,
    description: 'Generate CSPRNG secrets for a preset_id.',
    input: { preset_id: 'string', count: 'optional 1-5, default 3' },
  },
  {
    name: 'agent_whoami',
    public: false,
    description: 'Return authenticated agent profile.',
    input: {},
  },
] as const

export function buildAgentManifest() {
  const origin = publicBaseUrl()
  const presets = listPresetCatalog()

  return {
    name: 'keymint',
    version: '0.1.0',
    description:
      'Cryptographic secret generator with agent self-registration. CSPRNG via Web Crypto / Node crypto.',
    origin,
    documentation: {
      agentsGuide: `${origin}/AGENTS.md`,
      mcp: `${origin}/docs/agents/mcp.md`,
      rest: `${origin}/docs/agents/rest.md`,
      presets: `${origin}/docs/agents/presets.md`,
      skill: `${origin}/docs/skill.md`,
      repository: 'https://github.com/bdeeps/keymint',
    },
    selfRegistration: {
      summary: 'Call register_agent (MCP) or POST /api/agents/register (REST). apiKey is returned once.',
      rest: {
        method: 'POST',
        path: '/api/agents/register',
        url: `${origin}/api/agents/register`,
        body: { name: 'string (required)', description: 'string (optional)' },
      },
      mcp: {
        transport: 'streamable-http',
        url: `${origin}/mcp`,
        tool: 'register_agent',
        authRequired: false,
      },
    },
    authentication: {
      type: 'bearer',
      header: 'Authorization',
      format: 'Bearer km_agent_<secret>',
      note: 'Obtain token from self-registration. Required for generate_secret and agent_whoami.',
    },
    mcp: {
      endpoint: `${origin}/mcp`,
      transport: 'streamable-http',
      tools: MCP_TOOLS,
    },
    rest: {
      endpoints: [
        { method: 'GET', path: '/api/agent-manifest', auth: false },
        { method: 'GET', path: '/.well-known/keymint.json', auth: false },
        { method: 'GET', path: '/AGENTS.md', auth: false },
        { method: 'POST', path: '/api/agents/register', auth: false },
        { method: 'GET', path: '/api/agents', auth: false },
        { method: 'GET', path: '/api/agents/me', auth: 'bearer' },
        { method: 'GET', path: '/api/presets', auth: false },
        { method: 'POST', path: '/api/secrets/generate', auth: 'bearer' },
        { method: 'GET', path: '/health', auth: false },
      ],
    },
    presets: presets.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      format: p.format,
      hint: p.hint,
    })),
    examples: {
      register: {
        curl: `curl -sS -X POST '${origin}/api/agents/register' -H 'content-type: application/json' -d '{"name":"my-agent","description":"Optional"}'`,
      },
      generate: {
        curl: `curl -sS -X POST '${origin}/api/secrets/generate' -H 'Authorization: Bearer km_agent_YOUR_KEY' -H 'content-type: application/json' -d '{"presetId":"jwt-hs256","count":3}'`,
      },
      cursorConfig: {
        mcpServers: {
          keymint: {
            url: `${origin}/mcp`,
            headers: {
              Authorization: 'Bearer km_agent_REPLACE_AFTER_REGISTER',
            },
          },
        },
      },
    },
    ui: {
      humanRegistration: `${origin}/`,
      agentsTab: `${origin}/ (select Agents tab)`,
    },
  }
}
