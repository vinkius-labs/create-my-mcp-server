import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { validateProjectName, checkNodeVersion, checkTargetDirectory } from '../src/checks.js';

// ─────────────────────────────────────────────────────────────────────────────
// validateProjectName
// ─────────────────────────────────────────────────────────────────────────────

describe('validateProjectName', () => {
    describe('valid names', () => {
        it.each([
            'my-server',
            'myserver',
            'my-mcp-server',
            'a',
            'z9',
            'server123',
            '123-api',
            'a1b2c3',
            'vurb',
            'my-super-cool-mcp-server',
        ])('accepts "%s"', (name) => {
            expect(validateProjectName(name)).toBeUndefined();
        });
    });

    describe('invalid names', () => {
        it('rejects empty string', () => {
            expect(validateProjectName('')).toMatch(/empty/i);
        });

        it('rejects whitespace-only string', () => {
            expect(validateProjectName('   ')).toMatch(/empty/i);
        });

        it('rejects names longer than 214 characters', () => {
            const longName = 'a'.repeat(215);
            expect(validateProjectName(longName)).toMatch(/214/);
        });

        it('accepts a name of exactly 214 characters', () => {
            // 214 chars starting and ending with a letter — valid
            const name = 'a' + 'b'.repeat(212) + 'c';
            expect(validateProjectName(name)).toBeUndefined();
        });

        it('rejects uppercase letters', () => {
            expect(validateProjectName('MyServer')).toMatch(/invalid/i);
        });

        it('rejects names with spaces', () => {
            expect(validateProjectName('my server')).toMatch(/invalid/i);
        });

        it('rejects names starting with a hyphen', () => {
            expect(validateProjectName('-my-server')).toMatch(/invalid/i);
        });

        it('rejects names ending with a hyphen', () => {
            expect(validateProjectName('my-server-')).toMatch(/invalid/i);
        });

        it('rejects underscore characters', () => {
            expect(validateProjectName('my_server')).toMatch(/invalid/i);
        });

        it('rejects names with special characters', () => {
            expect(validateProjectName('my@server')).toMatch(/invalid/i);
        });

        it('rejects names with dots', () => {
            expect(validateProjectName('my.server')).toMatch(/invalid/i);
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// checkNodeVersion
// ─────────────────────────────────────────────────────────────────────────────

describe('checkNodeVersion', () => {
    const originalVersion = process.versions.node;
    let stderrOutput = '';

    beforeEach(() => {
        stderrOutput = '';
        vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
            stderrOutput += chunk;
            return true;
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        // Restore original node version
        Object.defineProperty(process.versions, 'node', {
            value:       originalVersion,
            configurable: true,
        });
    });

    it('returns true for the current Node.js version (≥ 18)', () => {
        // The test runner itself must be ≥ 18
        expect(checkNodeVersion()).toBe(true);
        expect(stderrOutput).toBe('');
    });

    it('returns false and writes an error for Node.js 16', () => {
        Object.defineProperty(process.versions, 'node', {
            value:       '16.20.0',
            configurable: true,
        });
        const result = checkNodeVersion();
        expect(result).toBe(false);
        expect(stderrOutput).toContain('16.20.0');
        expect(stderrOutput).toContain('18');
    });

    it('returns false for Node.js 17 (minor < 18)', () => {
        Object.defineProperty(process.versions, 'node', {
            value:       '17.0.0',
            configurable: true,
        });
        expect(checkNodeVersion()).toBe(false);
    });

    it('returns true for exactly Node.js 18.0.0', () => {
        Object.defineProperty(process.versions, 'node', {
            value:       '18.0.0',
            configurable: true,
        });
        expect(checkNodeVersion()).toBe(true);
    });

    it('returns true for Node.js 22', () => {
        Object.defineProperty(process.versions, 'node', {
            value:       '22.0.0',
            configurable: true,
        });
        expect(checkNodeVersion()).toBe(true);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// checkTargetDirectory
// ─────────────────────────────────────────────────────────────────────────────

describe('checkTargetDirectory', () => {
    const tmp = tmpdir();
    let stderrOutput = '';

    beforeEach(() => {
        stderrOutput = '';
        vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
            stderrOutput += chunk;
            return true;
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns true when the directory does not exist', () => {
        const name = `create-my-mcp-server-test-nonexistent-${Date.now()}`;
        expect(checkTargetDirectory(name, tmp)).toBe(true);
        expect(stderrOutput).toBe('');
    });

    it('returns false when the directory already exists', () => {
        const name = `create-my-mcp-server-test-exists-${Date.now()}`;
        const dir  = join(tmp, name);
        mkdirSync(dir);

        try {
            const result = checkTargetDirectory(name, tmp);
            expect(result).toBe(false);
            expect(stderrOutput).toContain(name);
        } finally {
            rmdirSync(dir);
        }
    });

    it('writes a helpful message when directory exists', () => {
        const name = `create-my-mcp-test-msg-${Date.now()}`;
        const dir  = join(tmp, name);
        mkdirSync(dir);

        try {
            checkTargetDirectory(name, tmp);
            expect(stderrOutput).toContain('already exists');
        } finally {
            rmdirSync(dir);
        }
    });

    it('resolves path relative to cwd correctly', () => {
        // A path that should not exist under the real cwd
        const name = `create-my-mcp-test-relative-${Date.now()}`;
        expect(checkTargetDirectory(name, process.cwd())).toBe(true);
    });
});
