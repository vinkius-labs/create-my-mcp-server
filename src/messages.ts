/**
 * Pre- and post-wizard branding messages.
 *
 * Keeps all user-visible copy in one place for easy iteration.
 * Colors are handled via `picocolors` — zero runtime overhead.
 * @module
 */
import pc from 'picocolors';

// ─── Intro ───────────────────────────────────────────────────────

export function printIntro(): void {
    process.stdout.write('\n');
    process.stdout.write(
        pc.bold(pc.cyan('  ╔══════════════════════════════════════════════════════╗')) + '\n',
    );
    process.stdout.write(
        pc.bold(pc.cyan('  ║')) +
        pc.bold('  Create My MCP Server                                ') +
        pc.bold(pc.cyan('║')) + '\n',
    );
    process.stdout.write(
        pc.bold(pc.cyan('  ╚══════════════════════════════════════════════════════╝')) + '\n',
    );
    process.stdout.write('\n');
    process.stdout.write(
        '  ' + pc.dim('Build production-ready MCP servers in minutes.') + '\n',
    );
    process.stdout.write(
        '  ' + pc.dim('Powered by ') + pc.bold('vurb.ts') + pc.dim(' — The Express.js for MCP Servers.') + '\n',
    );
    process.stdout.write('\n');
    process.stdout.write(
        '  ' +
        pc.green('→') + ' ' + pc.dim('Type-safe tools') +
        '  ' + pc.green('→') + ' ' + pc.dim('PII redaction') +
        '  ' + pc.green('→') + ' ' + pc.dim('Deploy anywhere') + '\n',
    );
    process.stdout.write('\n');
}

// ─── Outro ───────────────────────────────────────────────────────

export interface OutroOptions {
    projectName: string;
    target: string;
    transport: string;
    installSkipped: boolean;
    installFailed: boolean;
}

export function printOutro(opts: OutroOptions): void {
    const { projectName, target, installSkipped, installFailed } = opts;

    const deployCmd = target === 'vercel'
        ? 'npx vercel deploy'
        : target === 'cloudflare'
            ? 'npm run deploy'
            : 'vurb deploy';

    process.stdout.write('\n');
    process.stdout.write(
        pc.bold(pc.green('  ✦')) + '  ' + pc.bold('Your MCP server is ready.') + '\n',
    );
    process.stdout.write('\n');

    process.stdout.write('  ' + pc.dim('Next steps:') + '\n\n');
    process.stdout.write('    ' + pc.cyan('$') + ' ' + pc.bold(`cd ${projectName}`) + '\n');

    if (installSkipped || installFailed) {
        process.stdout.write(
            '    ' + pc.cyan('$') + ' ' + pc.bold('npm install') +
            (installFailed ? '  ' + pc.yellow('# (install failed — run this manually)') : '') + '\n',
        );
    }

    process.stdout.write('    ' + pc.cyan('$') + ' ' + pc.bold('npm run dev') + '\n');
    process.stdout.write('\n');

    process.stdout.write(
        '  ' + pc.dim('Deploy  ') + pc.cyan('$') + ' ' + pc.dim(deployCmd) + '\n',
    );
    process.stdout.write(
        '  ' + pc.dim('Docs    ') + pc.cyan('→') + ' ' + pc.dim('https://vurb.vinkius.com') + '\n',
    );
    process.stdout.write('\n');
    process.stdout.write(
        '  ' + pc.dim('Built with ') + pc.bold('vurb.ts') + pc.dim(' · Apache-2.0') + '\n',
    );
    process.stdout.write('\n');
}

// ─── Node version warning ─────────────────────────────────────────

export function printNodeVersionError(current: string): void {
    process.stderr.write('\n');
    process.stderr.write(
        '  ' + pc.red('✗') + ' ' + pc.bold('Node.js 18 or higher is required.') + '\n',
    );
    process.stderr.write(
        '  ' + pc.dim(`You are running Node.js ${current}.`) + '\n',
    );
    process.stderr.write(
        '  ' + pc.dim('Download the latest LTS at ') + pc.cyan('https://nodejs.org') + '\n',
    );
    process.stderr.write('\n');
}
