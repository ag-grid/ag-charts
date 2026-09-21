import { DEMO_APPS } from '../../src/registry';

// What the parity run compares: the React reference against one or more targets, each a demo
// served from a base URL. Configuration is by environment so CI and the Phase 4 sync agent can
// point the same harness at whatever seeds exist.

/** One port under comparison: `demo` as served by `framework` at `baseURL`. */
export interface ParityTarget {
    demo: string;
    framework: string;
    baseURL: string;
}

/** Ports the config serves itself when the run is self-parity (no `PARITY_TARGETS`). */
export const SELF_PARITY_PORTS = { reference: 4701, port: 4702 } as const;

export const DEMO_IDS: readonly string[] = DEMO_APPS.map((app) => app.id);

/**
 * Where the React reference is served. Defaults to the preview the config starts; set
 * `PARITY_REFERENCE_URL` to compare against a reference served elsewhere.
 */
export const REFERENCE_URL = process.env.PARITY_REFERENCE_URL ?? `http://localhost:${SELF_PARITY_PORTS.reference}`;

/**
 * True when nothing else is under test: the React app is served twice and compared with
 * itself, which proves the demos and the harness are deterministic before any port exists.
 */
export const SELF_PARITY = !process.env.PARITY_TARGETS;

/**
 * The targets, from the `PARITY_TARGETS` JSON array of `{ demo, framework, baseURL }`.
 * Without it, every registered demo is compared against the second React preview.
 */
export function parityTargets(): ParityTarget[] {
    const raw = process.env.PARITY_TARGETS;
    if (!raw) {
        return DEMO_IDS.map((demo) => ({
            demo,
            framework: 'react',
            baseURL: `http://localhost:${SELF_PARITY_PORTS.port}`,
        }));
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch (error) {
        throw new Error(`PARITY_TARGETS is not valid JSON: ${(error as Error).message}`);
    }
    if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('PARITY_TARGETS must be a non-empty JSON array of { demo, framework, baseURL }');
    }
    return parsed.map((entry, index) => {
        const target = entry as Partial<ParityTarget>;
        for (const key of ['demo', 'framework', 'baseURL'] as const) {
            if (typeof target[key] !== 'string' || target[key] === '') {
                throw new Error(`PARITY_TARGETS[${index}] is missing "${key}"`);
            }
        }
        if (!DEMO_IDS.includes(target.demo!)) {
            throw new Error(
                `PARITY_TARGETS[${index}] names unknown demo "${target.demo}" (known: ${DEMO_IDS.join(', ')})`
            );
        }
        return { demo: target.demo!, framework: target.framework!, baseURL: target.baseURL!.replace(/\/+$/, '') };
    });
}

/**
 * The page to load for `demo` at `baseURL`, in deterministic mode. The hash selects the demo in
 * the multi-demo React app and is ignored by a standalone seed, so every target gets the same URL.
 */
export function demoPageUrl(baseURL: string, demo: string): string {
    return `${baseURL.replace(/\/+$/, '')}/?deterministic=1#${demo}`;
}
