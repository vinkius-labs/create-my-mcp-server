import { describe, it, expect } from 'vitest';
import {
    VALID_VECTORS,
    VALID_TRANSPORTS,
    VALID_TARGETS,
    VECTOR_HINTS,
    TRANSPORT_HINTS,
    TARGET_HINTS,
    DOCS_URL,
    QUICKSTART_URL,
    NPM_URL,
} from '../src/constants.js';

describe('constants', () => {
    describe('VALID_VECTORS', () => {
        it('contains all five expected vectors', () => {
            expect(VALID_VECTORS).toEqual(['vanilla', 'prisma', 'n8n', 'openapi', 'oauth']);
        });

        it('has a non-empty hint for every vector', () => {
            for (const v of VALID_VECTORS) {
                expect(VECTOR_HINTS[v]).toBeTruthy();
                expect(typeof VECTOR_HINTS[v]).toBe('string');
            }
        });
    });

    describe('VALID_TRANSPORTS', () => {
        it('contains stdio and sse', () => {
            expect(VALID_TRANSPORTS).toEqual(['stdio', 'sse']);
        });

        it('has a non-empty hint for every transport', () => {
            for (const t of VALID_TRANSPORTS) {
                expect(TRANSPORT_HINTS[t]).toBeTruthy();
                expect(typeof TRANSPORT_HINTS[t]).toBe('string');
            }
        });
    });

    describe('VALID_TARGETS', () => {
        it('contains vinkius, vercel, and cloudflare', () => {
            expect(VALID_TARGETS).toEqual(['vinkius', 'vercel', 'cloudflare']);
        });

        it('has a non-empty hint for every target', () => {
            for (const t of VALID_TARGETS) {
                expect(TARGET_HINTS[t]).toBeTruthy();
                expect(typeof TARGET_HINTS[t]).toBe('string');
            }
        });
    });

    describe('URLs', () => {
        it('DOCS_URL points to the correct domain', () => {
            expect(DOCS_URL).toBe('https://vurb.vinkius.com');
        });

        it('QUICKSTART_URL is a sub-path of the docs domain', () => {
            expect(QUICKSTART_URL).toContain('vurb.vinkius.com');
            expect(QUICKSTART_URL).toContain('quickstart');
        });

        it('NPM_URL points to @vurb/core package', () => {
            expect(NPM_URL).toContain('@vurb/core');
            expect(NPM_URL).toContain('npmjs.com');
        });
    });
});
