import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// Mock execa and @clack/prompts BEFORE importing the module under test.
// Vitest hoists vi.mock() calls, so module-level mocks are safe here.
// ─────────────────────────────────────────────────────────────────────────────

vi.mock('execa', () => ({
    execa:      vi.fn(),
    ExecaError: class ExecaError extends Error {
        stderr: string;
        constructor(message: string, stderr = '') {
            super(message);
            this.name   = 'ExecaError';
            this.stderr = stderr;
        }
    },
}));

vi.mock('@clack/prompts', () => ({
    spinner: vi.fn(() => ({
        start: vi.fn(),
        stop:  vi.fn(),
    })),
    log: {
        error: vi.fn(),
        warn:  vi.fn(),
    },
}));

import { execa, ExecaError } from 'execa';
import * as p from '@clack/prompts';
import { delegateScaffold } from '../src/scaffold.js';
import type { WizardConfig } from '../src/prompts.js';

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const baseConfig: WizardConfig = {
    projectName:  'test-server',
    vector:       'vanilla',
    transport:    'stdio',
    target:       'vinkius',
    installDeps:  true,
};

const execaMock   = vi.mocked(execa);
const spinnerMock = vi.mocked(p.spinner);

// ─────────────────────────────────────────────────────────────────────────────
// delegateScaffold
// ─────────────────────────────────────────────────────────────────────────────

describe('delegateScaffold', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Each call to p.spinner() returns a fresh mock object
        spinnerMock.mockReturnValue({ start: vi.fn(), stop: vi.fn() } as ReturnType<typeof p.spinner>);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // ── Success path ──────────────────────────────────────────────────────────

    describe('success path', () => {
        beforeEach(() => {
            // Both npx and npm install succeed
            execaMock.mockResolvedValue({} as Awaited<ReturnType<typeof execa>>);
        });

        it('returns ok=true and installed=true on full success', async () => {
            const result = await delegateScaffold(baseConfig);
            expect(result.ok).toBe(true);
            expect(result.installed).toBe(true);
            expect(result.installSkipped).toBe(false);
        });

        it('calls npx with the correct core arguments', async () => {
            await delegateScaffold(baseConfig);

            const firstCall = execaMock.mock.calls[0]!;
            const args      = firstCall[1] as string[];

            expect(args).toContain('@vurb/core@latest');
            expect(args).toContain('create');
            expect(args).toContain('test-server');
            expect(args).toContain('--vector');
            expect(args).toContain('vanilla');
            expect(args).toContain('--transport');
            expect(args).toContain('stdio');
            expect(args).toContain('--target');
            expect(args).toContain('vinkius');
            // --yes suppresses @vurb/core's internal wizard
            expect(args).toContain('--yes');
        });

        it('calls npm install after successful scaffold', async () => {
            await delegateScaffold(baseConfig);
            // Second execa call is npm install
            expect(execaMock).toHaveBeenCalledTimes(2);
            const secondCall = execaMock.mock.calls[1]!;
            expect(secondCall[0]).toBe('npm');
            expect(secondCall[1]).toContain('install');
        });

        it('passes cwd=projectName to npm install', async () => {
            await delegateScaffold(baseConfig);
            const secondCall  = execaMock.mock.calls[1]!;
            const secondOpts  = secondCall[2] as { cwd?: string };
            expect(secondOpts?.cwd).toBe('test-server');
        });

        it('passes correct args for each vector', async () => {
            for (const vector of ['vanilla', 'prisma', 'n8n', 'openapi', 'oauth'] as const) {
                vi.clearAllMocks();
                execaMock.mockResolvedValue({} as Awaited<ReturnType<typeof execa>>);
                spinnerMock.mockReturnValue({ start: vi.fn(), stop: vi.fn() } as ReturnType<typeof p.spinner>);

                await delegateScaffold({ ...baseConfig, vector });
                const args = execaMock.mock.calls[0]![1] as string[];
                const idx  = args.indexOf('--vector');
                expect(args[idx + 1]).toBe(vector);
            }
        });
    });

    // ── Skip install ──────────────────────────────────────────────────────────

    describe('when installDeps=false', () => {
        beforeEach(() => {
            execaMock.mockResolvedValue({} as Awaited<ReturnType<typeof execa>>);
        });

        it('returns installSkipped=true', async () => {
            const result = await delegateScaffold({ ...baseConfig, installDeps: false });
            expect(result.ok).toBe(true);
            expect(result.installed).toBe(false);
            expect(result.installSkipped).toBe(true);
        });

        it('does NOT call npm install', async () => {
            await delegateScaffold({ ...baseConfig, installDeps: false });
            // Only one execa call (the npx scaffold)
            expect(execaMock).toHaveBeenCalledTimes(1);
        });

        it('adds --no-testing to the npx args when install is skipped', async () => {
            await delegateScaffold({ ...baseConfig, installDeps: false });
            const args = execaMock.mock.calls[0]![1] as string[];
            expect(args).toContain('--no-testing');
        });
    });

    // ── Scaffold failure ──────────────────────────────────────────────────────

    describe('when npx scaffold fails', () => {
        beforeEach(() => {
            execaMock.mockRejectedValueOnce(
                new (ExecaError as unknown as new (msg: string, stderr: string) => Error)(
                    'Process exited with non-zero code',
                    'npx: command not found',
                ),
            );
        });

        it('returns ok=false', async () => {
            const result = await delegateScaffold(baseConfig);
            expect(result.ok).toBe(false);
            expect(result.installed).toBe(false);
            expect(result.installSkipped).toBe(false);
        });

        it('does NOT attempt npm install after scaffold failure', async () => {
            await delegateScaffold(baseConfig);
            expect(execaMock).toHaveBeenCalledTimes(1);
        });

        it('calls p.log.error with the failure message', async () => {
            await delegateScaffold(baseConfig);
            expect(vi.mocked(p.log.error)).toHaveBeenCalled();
        });
    });

    // ── Install failure ───────────────────────────────────────────────────────

    describe('when npm install fails after scaffold succeeds', () => {
        beforeEach(() => {
            // npx succeeds, npm install fails
            execaMock
                .mockResolvedValueOnce({} as Awaited<ReturnType<typeof execa>>)
                .mockRejectedValueOnce(new Error('ENOENT: npm not found'));
        });

        it('returns ok=true but installed=false', async () => {
            const result = await delegateScaffold(baseConfig);
            expect(result.ok).toBe(true);
            expect(result.installed).toBe(false);
            expect(result.installSkipped).toBe(false);
        });

        it('emits a warning via p.log.warn', async () => {
            await delegateScaffold(baseConfig);
            expect(vi.mocked(p.log.warn)).toHaveBeenCalled();
        });
    });
});
