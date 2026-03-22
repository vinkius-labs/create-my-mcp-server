import { describe, it, expect } from 'vitest';
import { buildConfigFromFlags } from '../src/prompts.js';
import type { CliFlags } from '../src/prompts.js';

// ─────────────────────────────────────────────────────────────────────────────
// buildConfigFromFlags
// ─────────────────────────────────────────────────────────────────────────────

describe('buildConfigFromFlags', () => {
    describe('defaults (empty flags)', () => {
        it('uses my-mcp-server as default project name', () => {
            const config = buildConfigFromFlags({});
            expect(config.projectName).toBe('my-mcp-server');
        });

        it('defaults vector to vanilla', () => {
            expect(buildConfigFromFlags({}).vector).toBe('vanilla');
        });

        it('defaults transport to stdio', () => {
            expect(buildConfigFromFlags({}).transport).toBe('stdio');
        });

        it('defaults target to vinkius', () => {
            expect(buildConfigFromFlags({}).target).toBe('vinkius');
        });

        it('defaults installDeps to true', () => {
            expect(buildConfigFromFlags({}).installDeps).toBe(true);
        });
    });

    describe('projectName', () => {
        it('uses the provided project name', () => {
            const config = buildConfigFromFlags({ projectName: 'my-api' });
            expect(config.projectName).toBe('my-api');
        });
    });

    describe('vector coercion', () => {
        it.each(['vanilla', 'prisma', 'n8n', 'openapi', 'oauth'] as const)(
            'accepts valid vector "%s"',
            (vector) => {
                const config = buildConfigFromFlags({ vector });
                expect(config.vector).toBe(vector);
            },
        );

        it('falls back to vanilla for an unknown vector', () => {
            const config = buildConfigFromFlags({ vector: 'unknown-vector' });
            expect(config.vector).toBe('vanilla');
        });

        it('falls back to vanilla for undefined vector', () => {
            const config = buildConfigFromFlags({ vector: undefined });
            expect(config.vector).toBe('vanilla');
        });
    });

    describe('transport coercion', () => {
        it('accepts stdio transport', () => {
            const config = buildConfigFromFlags({ transport: 'stdio' });
            expect(config.transport).toBe('stdio');
        });

        it('accepts sse transport', () => {
            const config = buildConfigFromFlags({ transport: 'sse' });
            expect(config.transport).toBe('sse');
        });

        it('falls back to stdio for unknown transport', () => {
            const config = buildConfigFromFlags({ transport: 'websocket' });
            expect(config.transport).toBe('stdio');
        });
    });

    describe('target coercion', () => {
        it.each(['vinkius', 'vercel', 'cloudflare'] as const)(
            'accepts valid target "%s"',
            (target) => {
                const config = buildConfigFromFlags({ target });
                expect(config.target).toBe(target);
            },
        );

        it('falls back to vinkius for unknown target', () => {
            const config = buildConfigFromFlags({ target: 'aws-lambda' });
            expect(config.target).toBe('vinkius');
        });
    });

    describe('SSE auto-lock for edge targets', () => {
        it('overrides transport to sse when target is vercel', () => {
            const config = buildConfigFromFlags({ target: 'vercel', transport: 'stdio' });
            expect(config.transport).toBe('sse');
            expect(config.target).toBe('vercel');
        });

        it('overrides transport to sse when target is cloudflare', () => {
            const config = buildConfigFromFlags({ target: 'cloudflare', transport: 'stdio' });
            expect(config.transport).toBe('sse');
            expect(config.target).toBe('cloudflare');
        });

        it('does NOT override transport for vinkius target', () => {
            const config = buildConfigFromFlags({ target: 'vinkius', transport: 'stdio' });
            expect(config.transport).toBe('stdio');
        });

        it('preserves sse transport when target is vinkius', () => {
            const config = buildConfigFromFlags({ target: 'vinkius', transport: 'sse' });
            expect(config.transport).toBe('sse');
        });
    });

    describe('installDeps flag', () => {
        it('sets installDeps=false when skipInstall=true', () => {
            const config = buildConfigFromFlags({ skipInstall: true });
            expect(config.installDeps).toBe(false);
        });

        it('sets installDeps=true when skipInstall=false', () => {
            const config = buildConfigFromFlags({ skipInstall: false });
            expect(config.installDeps).toBe(true);
        });

        it('sets installDeps=true when skipInstall is undefined', () => {
            const config = buildConfigFromFlags({});
            expect(config.installDeps).toBe(true);
        });
    });

    describe('complete flag combinations', () => {
        it('handles a full prisma + vercel combination', () => {
            const flags: CliFlags = {
                projectName:  'finance-api',
                vector:       'prisma',
                transport:    'stdio',  // should be auto-overridden
                target:       'vercel',
                skipInstall:  false,
            };
            const config = buildConfigFromFlags(flags);
            expect(config.projectName).toBe('finance-api');
            expect(config.vector).toBe('prisma');
            expect(config.transport).toBe('sse');   // auto-locked
            expect(config.target).toBe('vercel');
            expect(config.installDeps).toBe(true);
        });

        it('handles openapi + cloudflare combination', () => {
            const config = buildConfigFromFlags({
                projectName:  'petstore',
                vector:       'openapi',
                target:       'cloudflare',
                skipInstall:  true,
            });
            expect(config.projectName).toBe('petstore');
            expect(config.vector).toBe('openapi');
            expect(config.transport).toBe('sse');   // auto-locked
            expect(config.target).toBe('cloudflare');
            expect(config.installDeps).toBe(false);
        });
    });
});
