<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/86ae1b28-a938-4e12-af29-bfc60a55dbe8">
  <img src="https://github.com/user-attachments/assets/86ae1b28-a938-4e12-af29-bfc60a55dbe8" style="border-radius:8px;background:#000;padding:10px;border:1px solid #414141;" alt="create-my-mcp-server" width="600">
</picture>

# create-my-mcp-server

**The fastest way to build production-ready MCP servers.**<br>
An interactive CLI that scaffolds type-safe, secure MCP servers in seconds.

[![npm version](https://img.shields.io/npm/v/create-my-mcp-server.svg?color=0ea5e9&style=flat-square)](https://www.npmjs.com/package/create-my-mcp-server)
[![npm downloads](https://img.shields.io/npm/dw/create-my-mcp-server?color=0ea5e9&style=flat-square)](https://www.npmjs.com/package/create-my-mcp-server)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=flat-square)](https://nodejs.org)
[![MCP Standard](https://img.shields.io/badge/MCP-Standard-purple?style=flat-square)](https://modelcontextprotocol.io/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue?style=flat-square)](LICENSE)
[![Powered by vurb.ts](https://img.shields.io/badge/powered%20by-vurb.ts-0ea5e9?style=flat-square)](https://vurb.vinkius.com)

[Documentation](https://vurb.vinkius.com) · [Quick Start](https://vurb.vinkius.com/quickstart-lightspeed) · [API Reference](https://vurb.vinkius.com/api/)

</div>

---

## One Command. Your MCP Server is Ready.

```bash
npx create-my-mcp-server
```

> Also works with:
> ```bash
> npm create my-mcp-server@latest
> npm init my-mcp-server
> ```

No setup. No boilerplate. An interactive wizard guides you through every option and your server is scaffolded, configured, and ready to connect to **Cursor**, **Claude Desktop**, **Windsurf**, **Cline**, or **GitHub Copilot** in under a minute.

---

## What You Get (in ~60 seconds)

```
┌  Create My MCP Server  ·  powered by vurb.ts
│
◇  Project name
│  my-mcp-server
│
◇  Choose a vector  (what kind of server?)
│  ● vanilla    File-based routing, zero external deps
│  ○ prisma     Prisma schema + CRUD with field-level security
│  ○ openapi    OpenAPI 3.x / Swagger → full tool generation
│  ○ n8n        Bridge n8n workflows as MCP tools
│  ○ oauth      RFC 8628 Device Flow authentication
│
◇  Deploy target
│  ● vinkius    Vinkius Edge  (vurb deploy)
│  ○ vercel     Vercel Functions  (vercel deploy)
│  ○ cloudflare Cloudflare Workers  (wrangler deploy)
│
◇  Transport
│  ● stdio      Standard I/O — ideal for local / Cursor / Claude Desktop
│
◇  Install dependencies now?
│  ● Yes
│
◆  Scaffolding project with vurb.ts ...
│  ✔ Project scaffolded
│  ✔ Dependencies installed
│
  ✦  Your MCP server is ready.

  Next steps:

    $ cd my-mcp-server
    $ npm run dev

  Deploy  $ vurb deploy
  Docs    → https://vurb.vinkius.com
```

---

## The Problem with Raw MCP Servers

Every MCP tutorial teaches you this:

```typescript
// 🔴 What every tutorial shows — DON'T DO THIS
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const invoice = await db.invoices.findUnique(args.id);
    return { content: [{ type: 'text', text: JSON.stringify(invoice) }] };
    //                                          ^^^^^^^^^^^^^^^^^^^^^^^^
    //    Sends password_hash, internal_margin, customer_ssn to the LLM provider.
    //    One field = one GDPR violation.
});
```

**Three catastrophic consequences:**

| Problem | What happens |
|---|---|
| 🔴 **Data exfiltration** | `JSON.stringify(row)` sends every column to the LLM — including `password_hash`, `ssn`, `internal_margin` |
| 🔴 **Token explosion** | Unbounded `findMany()` dumps thousands of rows into context. Your API bill explodes. |
| 🔴 **Hallucination** | No guardrails = the LLM calls tools out of order, invents parameters, ignores business rules |

This CLI scaffolds servers using **[vurb.ts](https://vurb.vinkius.com)** — a framework that solves all three at the architectural level.

---

## The Solution — 15 Lines. Production-Ready.

```typescript
// 🟢 vurb.ts with MVA — type-safe, PII-free, anti-hallucination
const InvoicePresenter = createPresenter('Invoice')
    .schema({ id: t.string, amount: t.number, status: t.enum('paid', 'pending') })
    .redactPII(['*.customer_ssn'])      // [REDACTED] — LLM never sees it
    .rules(['amount is in cents — divide by 100 for display'])
    .suggest((inv) => inv.status === 'pending'
        ? [suggest('billing.pay', 'Invoice pending — process payment')]
        : []);

export default f.query('billing.get_invoice')
    .describe('Get an invoice by ID')
    .withString('id', 'Invoice ID')
    .returns(InvoicePresenter)          // ← schema is the egress firewall
    .handle(async (input, ctx) =>
        ctx.db.invoices.findUnique({ where: { id: input.id } }),
    );
```

**What the framework gives you for free:**
- ✅ Only declared fields reach the LLM — new DB columns are invisible by default
- ✅ `.redactPII()` guarantees zero-leak — PII is masked before the LLM sees it
- ✅ `.suggest()` computes next actions from data state — no hardcoded hints
- ✅ Validation errors come with self-healing prompts — the LLM corrects itself

---

## CLI Options

```bash
npx create-my-mcp-server [project-name] [options]
```

| Option | Description | Default |
|---|---|---|
| `--vector <type>` | `vanilla`, `prisma`, `n8n`, `openapi`, `oauth` | `vanilla` |
| `--transport <type>` | `stdio`, `sse` | `stdio` |
| `--target <platform>` | `vinkius`, `vercel`, `cloudflare` | `vinkius` |
| `--skip-install` | Skip `npm install` after scaffolding | — |
| `-y, --yes` | Skip wizard, use flags / defaults | — |
| `-h, --help` | Show help | — |

### Non-interactive (CI / scripts)

```bash
# Defaults — vanilla + stdio + vinkius
npx create-my-mcp-server my-server --yes

# Prisma + Vercel (SSE auto-configured)
npx create-my-mcp-server my-api --vector prisma --target vercel --yes

# OpenAPI proxy + Cloudflare Workers
npx create-my-mcp-server petstore --vector openapi --transport sse --target cloudflare --yes
```

---

## Vectors — Choose Your Starting Point

| Vector | What gets scaffolded |
|---|---|
| **`vanilla`** | File-based routing with `autoDiscover()`. Drop a `.ts` file in `src/tools/` — it's instantly a live MCP tool. Zero external deps. |
| **`prisma`** | Prisma schema + autogenerated CRUD tools with Presenters, field-level security (`@vurb.hide`), PII redaction, and tenant isolation middleware. |
| **`openapi`** | OpenAPI 3.x / Swagger 2.0 → working MCP tools in seconds. Generates typed Zod schemas, Presenters, and tool handlers from your spec. |
| **`n8n`** | Bridge your n8n workflows as MCP tools. Each webhook endpoint becomes a typed, discoverable tool automatically. |
| **`oauth`** | RFC 8628 Device Flow authentication, pre-wired and ready to connect to any OAuth 2.0 / OIDC provider. |

---

## Deploy Targets

| Target | Where it runs | How to deploy |
|---|---|---|
| **`vinkius`** | Vinkius Edge | `vurb deploy` |
| **`vercel`** | Vercel Functions | `vercel deploy` |
| **`cloudflare`** | Cloudflare Workers | `wrangler deploy` |

> ⚡ **Vercel and Cloudflare** automatically use SSE transport (required for edge runtimes). The CLI handles this for you.

---

## What Is vurb.ts?

[**vurb.ts**](https://vurb.vinkius.com) is **The Express.js for MCP Servers** — a production-grade TypeScript framework that provides the security and architectural guardrails that the raw MCP SDK leaves entirely up to you.

### Raw SDK vs. vurb.ts

| | Raw MCP SDK | vurb.ts |
|---|---|---|
| **Data leakage** | 🔴 `JSON.stringify()` — every column | 🟢 Presenter schema — allowlist only |
| **PII protection** | 🔴 Manual, error-prone | 🟢 `.redactPII()` — zero-leak guarantee |
| **Tool routing** | 🔴 Giant `if/else` chains | 🟢 File-based `autoDiscover()` |
| **Context bloat** | 🔴 Unbounded `findMany()` | 🟢 `.limit()` + TOON encoding |
| **Hallucination guard** | 🔴 None | 🟢 8 anti-hallucination mechanisms |
| **Temporal safety** | 🔴 LLM calls anything anytime | 🟢 FSM State Gate — tools disappear |
| **Governance** | 🔴 None | 🟢 Lockfile + SHA-256 attestation |
| **Multi-agent** | 🔴 Manual HTTP wiring | 🟢 `@vurb/swarm` — zero-trust B2BUA |
| **Lines per tool** | 🔴 ~200 | 🟢 ~15 |

### Key Features

**🛡️ Presenter Egress Firewall**
Only declared fields pass through. A database migration that adds `customer_ssn` doesn't affect the LLM view — the new column is invisible unless explicitly declared.

**🔒 Built-in PII Redaction**
`.redactPII()` compiles a V8-optimized redaction function. Wildcard paths (`'*.ssn'`, `'patients[*].diagnosis'`). GDPR / LGPD / HIPAA compliance baked in.

**🤖 FSM State Gate**
The LLM literally cannot call `cart.pay` with an empty cart — the tool doesn't appear in `tools/list` until the FSM reaches the `payment` state. Temporal hallucination made structurally impossible.

**⚡ File-Based Routing**
```
src/tools/
├── billing/
│   ├── get_invoice.ts  → billing.get_invoice
│   └── pay.ts          → billing.pay
└── users/
    └── list.ts         → users.list
```
Drop a file. It's a tool. No imports. No registration. No merge conflicts.

**🚀 Deploy Anywhere**
Same Fluent API and same Presenters work on Vinkius Edge, Vercel Functions, and Cloudflare Workers — only the transport adapter changes.

---

## Quick Start After Scaffolding

```bash
# 1. Navigate to your project
cd my-mcp-server

# 2. Start the dev server (with HMR)
npm run dev

# 3. Connect in Cursor / Claude Desktop
#    Add to your MCP config:
#    { "command": "node", "args": ["dist/server.js"] }

# 4. Add a tool — just create a file
touch src/tools/hello.ts

# 5. Deploy
vurb deploy
```

---

## Requirements

- **Node.js** ≥ 18.0.0
- **npm** ≥ 7 (or `npx`)

---

## More

- 📖 **Documentation** — [vurb.vinkius.com](https://vurb.vinkius.com)
- ⚡ **Quickstart** — [vurb.vinkius.com/quickstart-lightspeed](https://vurb.vinkius.com/quickstart-lightspeed)
- 📦 **Core package** — [@vurb/core on npm](https://www.npmjs.com/package/@vurb/core)
- 🐛 **Issues** — [github.com/vinkius-labs/create-my-mcp-server/issues](https://github.com/vinkius-labs/create-my-mcp-server/issues)

---

## License

Apache-2.0 © [Vinkius Labs](https://github.com/vinkius-labs)
