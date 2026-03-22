/**
 * CLI constants — vectors, transports, targets, URLs.
 * Mirrors the types accepted by `@vurb/core` CLI so we pass valid values.
 * @module
 */

export type IngestionVector = 'vanilla' | 'prisma' | 'n8n' | 'openapi' | 'oauth';
export type TransportLayer  = 'stdio' | 'sse';
export type DeployTarget    = 'vinkius' | 'vercel' | 'cloudflare';

// ─── Canonical value sets ─────────────────────────────────────────

export const VALID_VECTORS: IngestionVector[]    = ['vanilla', 'prisma', 'n8n', 'openapi', 'oauth'];
export const VALID_TRANSPORTS: TransportLayer[] = ['stdio', 'sse'];
export const VALID_TARGETS: DeployTarget[]       = ['vinkius', 'vercel', 'cloudflare'];

// ─── Descriptions shown in the interactive prompts ────────────────

export const VECTOR_HINTS: Record<IngestionVector, string> = {
    vanilla:  'File-based routing, zero external deps',
    prisma:   'Prisma schema + CRUD with field-level security',
    n8n:      'Bridge n8n workflows as MCP tools',
    openapi:  'OpenAPI 3.x / Swagger → full tool generation',
    oauth:    'RFC 8628 Device Flow authentication',
};

export const TRANSPORT_HINTS: Record<TransportLayer, string> = {
    stdio: 'Standard I/O — ideal for local / Cursor / Claude Desktop',
    sse:   'Streamable HTTP — required for Vercel & Cloudflare',
};

export const TARGET_HINTS: Record<DeployTarget, string> = {
    vinkius:    'Vinkius Edge   (vurb deploy)',
    vercel:     'Vercel Functions (vercel deploy)',
    cloudflare: 'Cloudflare Workers (wrangler deploy)',
};

// ─── URLs ────────────────────────────────────────────────────────

export const DOCS_URL       = 'https://vurb.vinkius.com';
export const QUICKSTART_URL = 'https://vurb.vinkius.com/quickstart-lightspeed';
export const NPM_URL        = 'https://www.npmjs.com/package/@vurb/core';
