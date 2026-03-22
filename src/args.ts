/**
 * CLI argument parser — lightweight, zero-dependency.
 *
 * Supports:
 *   npx create-my-mcp-server [name] [flags]
 *
 * Examples:
 *   npx create-my-mcp-server
 *   npx create-my-mcp-server my-server
 *   npx create-my-mcp-server my-server --vector prisma --target vercel --yes
 * @module
 */

export interface ParsedArgs {
    /** Positional project name (first non-flag argument). */
    projectName?: string;
    /** --vector <vanilla|prisma|n8n|openapi|oauth> */
    vector?: string;
    /** --transport <stdio|sse> */
    transport?: string;
    /** --target <vinkius|vercel|cloudflare> */
    target?: string;
    /** -y / --yes — skip wizard, use defaults / flags */
    yes: boolean;
    /** --skip-install — do not run npm install after scaffold */
    skipInstall: boolean;
    /** -h / --help — print usage and exit */
    help: boolean;
    /** --version — print package version and exit */
    version: boolean;
}

// ─── Parser ───────────────────────────────────────────────────────

function consumeValue(argv: string[], i: number, flag: string): string {
    const next = argv[i + 1];
    if (!next || next.startsWith('-')) {
        throw new Error(`Missing value for ${flag}`);
    }
    return next;
}

export function parseArgs(argv: string[]): ParsedArgs {
    const args = argv.slice(2); // strip node + script path
    const result: ParsedArgs = {
        yes:         false,
        skipInstall: false,
        help:        false,
        version:     false,
    };

    let seenPositional = false;

    for (let i = 0; i < args.length; i++) {
        const arg = args[i]!;
        switch (arg) {
            case '-h':
            case '--help':
                result.help = true;
                break;
            case '--version':
            case '-v':
                result.version = true;
                break;
            case '-y':
            case '--yes':
                result.yes = true;
                break;
            case '--skip-install':
                result.skipInstall = true;
                break;
            case '--vector':
                result.vector = consumeValue(args, i, arg);
                i++;
                break;
            case '--transport':
                result.transport = consumeValue(args, i, arg);
                i++;
                break;
            case '--target':
                result.target = consumeValue(args, i, arg);
                i++;
                break;
            default:
                if (!arg.startsWith('-') && !seenPositional) {
                    result.projectName = arg;
                    seenPositional = true;
                }
        }
    }

    return result;
}

// ─── Help text ────────────────────────────────────────────────────

export const HELP_TEXT = `
  create-my-mcp-server — Scaffold production-ready MCP servers

  USAGE
    npx create-my-mcp-server [name] [options]

  OPTIONS
    --vector    <type>      vanilla (default), prisma, n8n, openapi, oauth
    --transport <type>      stdio (default), sse
    --target    <platform>  vinkius (default), vercel, cloudflare
    --skip-install          Skip npm install after scaffolding
    -y, --yes               Skip wizard, use flags / defaults
    -h, --help              Show this help
    --version               Show version

  EXAMPLES
    npx create-my-mcp-server
    npx create-my-mcp-server my-server
    npx create-my-mcp-server my-server --vector prisma --target vercel --yes
    npx create-my-mcp-server my-server --vector openapi --transport sse

  MORE
    Docs         →  https://vurb.vinkius.com
    Quickstart   →  https://vurb.vinkius.com/quickstart-lightspeed
`.trimStart();
