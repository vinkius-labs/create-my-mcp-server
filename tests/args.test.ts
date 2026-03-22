import { describe, it, expect } from 'vitest';
import { parseArgs, HELP_TEXT } from '../src/args.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Simulates `process.argv` as if the user typed `create-my-mcp-server <...tokens>` */
function argv(...tokens: string[]): string[] {
    return ['node', 'create-my-mcp-server', ...tokens];
}

// ─────────────────────────────────────────────────────────────────────────────
// parseArgs
// ─────────────────────────────────────────────────────────────────────────────

describe('parseArgs', () => {
    describe('defaults', () => {
        it('returns all boolean flags as false with no input', () => {
            const result = parseArgs(argv());
            expect(result.yes).toBe(false);
            expect(result.skipInstall).toBe(false);
            expect(result.help).toBe(false);
            expect(result.version).toBe(false);
        });

        it('returns undefined for all optional string fields with no input', () => {
            const result = parseArgs(argv());
            expect(result.projectName).toBeUndefined();
            expect(result.vector).toBeUndefined();
            expect(result.transport).toBeUndefined();
            expect(result.target).toBeUndefined();
        });
    });

    describe('positional argument (project name)', () => {
        it('captures the first non-flag argument as projectName', () => {
            const result = parseArgs(argv('my-server'));
            expect(result.projectName).toBe('my-server');
        });

        it('captures projectName before any flags', () => {
            const result = parseArgs(argv('api-server', '--vector', 'prisma'));
            expect(result.projectName).toBe('api-server');
            expect(result.vector).toBe('prisma');
        });

        it('captures projectName after flags as well', () => {
            const result = parseArgs(argv('--vector', 'prisma', 'my-api'));
            expect(result.projectName).toBe('my-api');
        });

        it('ignores a second positional argument beyond the project name', () => {
            const result = parseArgs(argv('first', 'second'));
            expect(result.projectName).toBe('first');
        });
    });

    describe('--vector flag', () => {
        it.each(['vanilla', 'prisma', 'n8n', 'openapi', 'oauth'] as const)(
            'correctly parses --vector %s',
            (vector) => {
                const result = parseArgs(argv('--vector', vector));
                expect(result.vector).toBe(vector);
            },
        );

        it('throws when --vector has no value', () => {
            expect(() => parseArgs(argv('--vector'))).toThrow('Missing value for --vector');
        });

        it('throws when --vector is followed by another flag', () => {
            expect(() => parseArgs(argv('--vector', '--yes'))).toThrow('Missing value for --vector');
        });
    });

    describe('--transport flag', () => {
        it.each(['stdio', 'sse'] as const)('correctly parses --transport %s', (t) => {
            const result = parseArgs(argv('--transport', t));
            expect(result.transport).toBe(t);
        });

        it('throws when --transport has no value', () => {
            expect(() => parseArgs(argv('--transport'))).toThrow('Missing value for --transport');
        });
    });

    describe('--target flag', () => {
        it.each(['vinkius', 'vercel', 'cloudflare'] as const)('correctly parses --target %s', (t) => {
            const result = parseArgs(argv('--target', t));
            expect(result.target).toBe(t);
        });

        it('throws when --target has no value', () => {
            expect(() => parseArgs(argv('--target'))).toThrow('Missing value for --target');
        });
    });

    describe('boolean flags', () => {
        it('sets yes=true with --yes', () => {
            expect(parseArgs(argv('--yes')).yes).toBe(true);
        });

        it('sets yes=true with -y', () => {
            expect(parseArgs(argv('-y')).yes).toBe(true);
        });

        it('sets skipInstall=true with --skip-install', () => {
            expect(parseArgs(argv('--skip-install')).skipInstall).toBe(true);
        });

        it('sets help=true with --help', () => {
            expect(parseArgs(argv('--help')).help).toBe(true);
        });

        it('sets help=true with -h', () => {
            expect(parseArgs(argv('-h')).help).toBe(true);
        });

        it('sets version=true with --version', () => {
            expect(parseArgs(argv('--version')).version).toBe(true);
        });

        it('sets version=true with -v', () => {
            expect(parseArgs(argv('-v')).version).toBe(true);
        });
    });

    describe('combined flags', () => {
        it('parses a realistic non-interactive command correctly', () => {
            const result = parseArgs(
                argv('my-server', '--vector', 'prisma', '--target', 'vercel', '--yes'),
            );
            expect(result.projectName).toBe('my-server');
            expect(result.vector).toBe('prisma');
            expect(result.target).toBe('vercel');
            expect(result.yes).toBe(true);
        });

        it('parses --skip-install together with --yes', () => {
            const result = parseArgs(argv('my-api', '--skip-install', '--yes'));
            expect(result.projectName).toBe('my-api');
            expect(result.skipInstall).toBe(true);
            expect(result.yes).toBe(true);
        });

        it('parses all flags together', () => {
            const result = parseArgs(
                argv('srv', '--vector', 'oauth', '--transport', 'sse', '--target', 'cloudflare', '--yes', '--skip-install'),
            );
            expect(result.projectName).toBe('srv');
            expect(result.vector).toBe('oauth');
            expect(result.transport).toBe('sse');
            expect(result.target).toBe('cloudflare');
            expect(result.yes).toBe(true);
            expect(result.skipInstall).toBe(true);
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// HELP_TEXT
// ─────────────────────────────────────────────────────────────────────────────

describe('HELP_TEXT', () => {
    it('mentions the package name', () => {
        expect(HELP_TEXT).toContain('create-my-mcp-server');
    });

    it('lists all vectors', () => {
        for (const v of ['vanilla', 'prisma', 'n8n', 'openapi', 'oauth']) {
            expect(HELP_TEXT).toContain(v);
        }
    });

    it('lists all transports', () => {
        expect(HELP_TEXT).toContain('stdio');
        expect(HELP_TEXT).toContain('sse');
    });

    it('lists all targets', () => {
        for (const t of ['vinkius', 'vercel', 'cloudflare']) {
            expect(HELP_TEXT).toContain(t);
        }
    });

    it('contains the docs URL', () => {
        expect(HELP_TEXT).toContain('https://vurb.vinkius.com');
    });
});
