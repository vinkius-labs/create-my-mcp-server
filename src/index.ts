#!/usr/bin/env node
/**
 * create-my-mcp-server — entry point
 *
 * Scaffold production-ready MCP servers powered by vurb.ts.
 *
 * Usage:
 *   npx create-my-mcp-server [name] [flags]
 *
 * @module
 */
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { parseArgs, HELP_TEXT } from './args.js';
import { checkNodeVersion, checkTargetDirectory } from './checks.js';
import { printIntro, printOutro } from './messages.js';
import { runWizard, buildConfigFromFlags } from './prompts.js';
import { delegateScaffold } from './scaffold.js';

// ─── Main ─────────────────────────────────────────────────────────

async function main(): Promise<void> {
    // ── Pre-flight ────────────────────────────────────────────────
    if (!checkNodeVersion()) {
        process.exit(1);
    }

    const flags = parseArgs(process.argv);

    if (flags.help) {
        process.stdout.write(HELP_TEXT);
        process.exit(0);
    }

    if (flags.version) {
        const { createRequire } = await import('node:module');
        const req = createRequire(import.meta.url);
        const pkg = req('../package.json') as { version: string };
        process.stdout.write(`create-my-mcp-server v${pkg.version}\n`);
        process.exit(0);
    }

    // ── Branding ──────────────────────────────────────────────────
    printIntro();

    // ── Config collection ─────────────────────────────────────────
    let config;

    if (flags.yes) {
        config = buildConfigFromFlags(flags);
        p.log.info(
            `Using: ${pc.bold(config.projectName)} · ` +
            `${pc.dim(config.vector)} · ` +
            `${pc.dim(config.transport)} · ` +
            `${pc.dim(config.target)}`,
        );
    } else {
        config = await runWizard(flags);
        if (!config) {
            p.cancel('Wizard cancelled. No files were created.');
            process.exit(0);
        }
    }

    // ── Directory check (after wizard so name is resolved) ────────
    if (!checkTargetDirectory(config.projectName, process.cwd())) {
        process.exit(1);
    }

    // ── Scaffold ──────────────────────────────────────────────────
    const result = await delegateScaffold(config);

    if (!result.ok) {
        p.outro(pc.red('Scaffold failed. See errors above.'));
        process.exit(1);
    }

    // ── Success ───────────────────────────────────────────────────
    printOutro({
        projectName:    config.projectName,
        target:         config.target,
        transport:      config.transport,
        installSkipped: result.installSkipped,
        installFailed:  !result.installed && !result.installSkipped,
    });
}

// ─── Entry ────────────────────────────────────────────────────────

main().catch((err: unknown) => {
    process.stderr.write(
        '\n  ' + pc.red('✗') + ' Unexpected error:\n' +
        '  ' + (err instanceof Error ? err.message : String(err)) + '\n\n',
    );
    process.exit(1);
});
