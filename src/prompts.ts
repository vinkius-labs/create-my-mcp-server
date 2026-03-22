/**
 * Interactive wizard — collects project configuration via `@clack/prompts`.
 *
 * This module is the sole UX layer. It never generates files itself;
 * that responsibility belongs entirely to `@vurb/core`.
 * @module
 */
import * as p from '@clack/prompts';
import pc from 'picocolors';
import {
    VALID_VECTORS,
    VALID_TRANSPORTS,
    VALID_TARGETS,
    VECTOR_HINTS,
    TRANSPORT_HINTS,
    TARGET_HINTS,
    type IngestionVector,
    type TransportLayer,
    type DeployTarget,
} from './constants.js';
import { validateProjectName } from './checks.js';

// ─── Collected config ─────────────────────────────────────────────

export interface WizardConfig {
    readonly projectName: string;
    readonly vector: IngestionVector;
    readonly transport: TransportLayer;
    readonly target: DeployTarget;
    readonly installDeps: boolean;
}

// ─── Flag-based fast path ─────────────────────────────────────────

export interface CliFlags {
    projectName?: string;
    vector?: string;
    transport?: string;
    target?: string;
    yes?: boolean;
    skipInstall?: boolean;
}

function coerceVector(v: string | undefined): IngestionVector {
    return VALID_VECTORS.includes(v as IngestionVector) ? (v as IngestionVector) : 'vanilla';
}

function coerceTransport(t: string | undefined): TransportLayer {
    return VALID_TRANSPORTS.includes(t as TransportLayer) ? (t as TransportLayer) : 'stdio';
}

function coerceTarget(t: string | undefined): DeployTarget {
    return VALID_TARGETS.includes(t as DeployTarget) ? (t as DeployTarget) : 'vinkius';
}

/** Builds config from flags only — used when `--yes` is passed. */
export function buildConfigFromFlags(flags: CliFlags): WizardConfig {
    const name = flags.projectName ?? 'my-mcp-server';
    const target = coerceTarget(flags.target);

    // Vercel and Cloudflare always require SSE transport.
    const transport = (target === 'vercel' || target === 'cloudflare')
        ? 'sse'
        : coerceTransport(flags.transport);

    return {
        projectName:  name,
        vector:       coerceVector(flags.vector),
        transport,
        target,
        installDeps:  !flags.skipInstall,
    };
}

// ─── Interactive wizard ───────────────────────────────────────────

/**
 * Runs the `@clack/prompts` interactive wizard.
 * Returns `null` if the user cancels at any step.
 */
export async function runWizard(flags: CliFlags): Promise<WizardConfig | null> {
    p.intro(
        pc.bold('Create My MCP Server') +
        pc.dim('  ·  powered by vurb.ts'),
    );

    // ── Project name ──────────────────────────────────────────────
    const projectName = await p.text({
        message:     'Project name',
        placeholder: flags.projectName ?? 'my-mcp-server',
        initialValue: flags.projectName,
        validate(value) {
            return validateProjectName(value || (flags.projectName ?? 'my-mcp-server'));
        },
    });
    if (p.isCancel(projectName)) return null;

    const resolvedName = ((projectName as string).trim() || flags.projectName || 'my-mcp-server');

    // ── Vector ────────────────────────────────────────────────────
    const vector = await p.select<IngestionVector>({
        message: 'Choose a vector  ' + pc.dim('(what kind of server?)'),
        options: VALID_VECTORS.map((v) => ({
            value: v,
            label: pc.bold(v.padEnd(10)) + pc.dim(VECTOR_HINTS[v]),
            hint:  v === 'vanilla' ? 'recommended' : undefined,
        })),
        initialValue: flags.vector as IngestionVector ?? 'vanilla',
    });
    if (p.isCancel(vector)) return null;

    // ── Target ────────────────────────────────────────────────────
    const target = await p.select<DeployTarget>({
        message: 'Deploy target',
        options: VALID_TARGETS.map((t) => ({
            value: t,
            label: pc.bold(t.padEnd(12)) + pc.dim(TARGET_HINTS[t]),
            hint:  t === 'vinkius' ? 'default' : undefined,
        })),
        initialValue: flags.target as DeployTarget ?? 'vinkius',
    });
    if (p.isCancel(target)) return null;

    // ── Transport — auto-set for Vercel / Cloudflare ──────────────
    let transport: TransportLayer;
    if (target === 'vercel' || target === 'cloudflare') {
        transport = 'sse';
        p.note(
            pc.dim(`Transport locked to ${pc.bold('sse')} (required for ${target})`),
            'Transport',
        );
    } else {
        const chosen = await p.select<TransportLayer>({
            message: 'Transport',
            options: VALID_TRANSPORTS.map((t) => ({
                value: t,
                label: pc.bold(t.padEnd(8)) + pc.dim(TRANSPORT_HINTS[t]),
                hint:  t === 'stdio' ? 'recommended' : undefined,
            })),
            initialValue: flags.transport as TransportLayer ?? 'stdio',
        });
        if (p.isCancel(chosen)) return null;
        transport = chosen as TransportLayer;
    }

    // ── Install dependencies ──────────────────────────────────────
    const installDeps = await p.confirm({
        message: 'Install dependencies now?',
        initialValue: true,
    });
    if (p.isCancel(installDeps)) return null;

    return {
        projectName: resolvedName,
        vector:      vector as IngestionVector,
        transport,
        target:      target as DeployTarget,
        installDeps: installDeps as boolean,
    };
}
