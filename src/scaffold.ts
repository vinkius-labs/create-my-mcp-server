/**
 * Scaffold delegation — calls `@vurb/core` CLI to generate the project.
 *
 * This module contains zero file-generation logic. All scaffolding is owned by
 * `@vurb/core`. We simply invoke its binary with the flags collected by the wizard,
 * piggy-backing on all vectors, templates, and future updates automatically.
 * @module
 */
import * as p from '@clack/prompts';
import { execa, ExecaError } from 'execa';
import type { WizardConfig } from './prompts.js';

// ─── Result ───────────────────────────────────────────────────────

export interface ScaffoldResult {
    /** Project was scaffolded successfully. */
    readonly ok: boolean;
    /** Dependencies were installed successfully. */
    readonly installed: boolean;
    /** Install was skipped by the user. */
    readonly installSkipped: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────

/**
 * Resolves the `npx` command appropriate for the current platform.
 * On Windows, `npx.cmd` must be used when spawning via `execa`.
 */
function npxCmd(): string {
    return process.platform === 'win32' ? 'npx.cmd' : 'npx';
}

// ─── Core delegation ─────────────────────────────────────────────

/**
 * Delegates scaffolding to `@vurb/core` via `npx @vurb/core create`.
 *
 * Constructs the equivalent of:
 *   npx @vurb/core@latest create <name> --vector <v> --transport <t> --target <g> --yes
 *
 * The `--yes` flag suppresses the internal `@vurb/core` wizard so only our
 * wizard runs — providing a single, coherent UX.
 */
export async function delegateScaffold(config: WizardConfig): Promise<ScaffoldResult> {
    const args = [
        '@vurb/core@latest',
        'create',
        config.projectName,
        '--vector',    config.vector,
        '--transport', config.transport,
        '--target',    config.target,
        '--yes',
    ];

    if (!config.installDeps) {
        args.push('--no-testing');
    }

    // ── Scaffold ──────────────────────────────────────────────────
    const scaffoldSpinner = p.spinner();
    scaffoldSpinner.start('Scaffolding project with vurb.ts');

    try {
        await execa(npxCmd(), args, {
            stdio:   'pipe',
            reject:  true,
            timeout: 30_000,
        });
        scaffoldSpinner.stop('Project scaffolded');
    } catch (err) {
        const message = err instanceof ExecaError ? err.stderr ?? err.message : String(err);
        scaffoldSpinner.stop('Scaffolding failed');
        p.log.error('Could not scaffold the project:\n' + message);
        return { ok: false, installed: false, installSkipped: false };
    }

    // ── Install ───────────────────────────────────────────────────
    if (!config.installDeps) {
        return { ok: true, installed: false, installSkipped: true };
    }

    const installSpinner = p.spinner();
    installSpinner.start('Installing dependencies');

    try {
        await execa('npm', ['install'], {
            cwd:     config.projectName,
            stdio:   'pipe',
            reject:  true,
            timeout: 120_000,
        });
        installSpinner.stop('Dependencies installed');
        return { ok: true, installed: true, installSkipped: false };
    } catch (err) {
        const message = err instanceof ExecaError ? err.stderr ?? err.message : String(err);
        installSpinner.stop('Dependency installation failed');
        p.log.warn('Run `npm install` manually inside the project directory.\n' + message);
        return { ok: true, installed: false, installSkipped: false };
    }
}
