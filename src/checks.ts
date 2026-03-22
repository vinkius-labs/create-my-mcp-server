/**
 * Pre-flight checks — Node.js version, directory existence.
 * These run before the interactive wizard to fail fast on bad environments.
 * @module
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { printNodeVersionError } from './messages.js';

// ─── Node version ─────────────────────────────────────────────────

const MIN_MAJOR = 18;

/** Returns true if the runtime satisfies the minimum Node.js version. */
export function checkNodeVersion(): boolean {
    const [major] = process.versions.node.split('.').map(Number);
    if ((major ?? 0) < MIN_MAJOR) {
        printNodeVersionError(process.versions.node);
        return false;
    }
    return true;
}

// ─── Target directory ────────────────────────────────────────────

/**
 * Returns true if `name` can safely be used as a directory.
 * Emits a user-friendly error and returns false otherwise.
 */
export function checkTargetDirectory(name: string, cwd: string): boolean {
    const targetDir = resolve(cwd, name);
    if (existsSync(targetDir)) {
        process.stderr.write(
            `\n  ✗ Directory "${name}" already exists in this folder.\n` +
            `    Choose a different name or remove the existing directory.\n\n`,
        );
        return false;
    }
    return true;
}

// ─── Name validation ─────────────────────────────────────────────

const NAME_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

/**
 * Validates a project name for use as an npm package name / directory.
 * Returns an error message string, or undefined when valid.
 */
export function validateProjectName(name: string): string | undefined {
    if (!name || name.trim().length === 0) {
        return 'Project name cannot be empty.';
    }
    if (name.length > 214) {
        return 'Project name must be 214 characters or fewer.';
    }
    if (!NAME_RE.test(name)) {
        return (
            'Invalid name: use lowercase letters, numbers, and hyphens only. ' +
            'Must start and end with a letter or number.'
        );
    }
    return undefined;
}
