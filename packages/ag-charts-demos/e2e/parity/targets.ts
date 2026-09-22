import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { DEMO_APPS } from '../../src/registry';

// What the parity run compares: the React reference against one or more targets, each a demo
// served from a base URL. Configuration is by environment so CI and the Phase 4 sync agent can
// point the same harness at whatever seeds exist: `PARITY_TARGETS` names served ports explicitly,
// `PARITY_DISCOVER=1` finds the committed ports by their manifests and has the config serve them.

/** One port under comparison: `demo` as served by `framework` at `baseURL`. */
export interface ParityTarget {
    demo: string;
    framework: string;
    baseURL: string;
}

/** Ports the config serves itself when the run is self-parity (no `PARITY_TARGETS`). */
export const SELF_PARITY_PORTS = { reference: 4701, port: 4702 } as const;

/** Discovered ports are served from here upwards, one port each, in manifest order. */
export const DISCOVERED_PORT_BASE = 4710;

/** `packages/ag-charts-demos/seeds`, where every port lives as `<demo>/<framework>/`. */
export const SEEDS_DIR = resolve(__dirname, '..', '..', 'seeds');

/** The generated React seed is the reference's own source, not a port of it. */
const REFERENCE_FRAMEWORK = 'react';

export const DEMO_IDS: readonly string[] = DEMO_APPS.map((app) => app.id);

/**
 * Where the React reference is served. Defaults to the preview the config starts; set
 * `PARITY_REFERENCE_URL` to compare against a reference served elsewhere.
 */
export const REFERENCE_URL = process.env.PARITY_REFERENCE_URL ?? `http://localhost:${SELF_PARITY_PORTS.reference}`;

/** True when the run finds the ports itself (`PARITY_DISCOVER=1`) rather than being told them. */
export const DISCOVER = !process.env.PARITY_TARGETS && ['1', 'true'].includes(process.env.PARITY_DISCOVER ?? '');

/**
 * True when nothing else is under test: the React app is served twice and compared with
 * itself, which proves the demos and the harness are deterministic before any port exists.
 */
export const SELF_PARITY = !process.env.PARITY_TARGETS && !DISCOVER;

/** A committed port found by its manifest: where its source is and where its build lands. */
export interface DiscoveredPort {
    demo: string;
    framework: string;
    /** `seeds/<demo>/<framework>`, absolute. */
    seedDir: string;
    /** The port's static output, absolute: the manifest's `dist` under `seedDir`. */
    distDir: string;
    /** The local port the config serves `distDir` on. */
    port: number;
}

/**
 * Every non-React port under `seeds/`, found by its `.seed-manifest.json`, in sorted
 * `<demo>/<framework>` order so port numbers are stable between runs. A new port is picked up by
 * committing its manifest; nothing here has to change. A port whose `dist` is missing is
 * reported, since the run would otherwise fail inside the web server with less to go on.
 */
export function discoverPorts(): DiscoveredPort[] {
    if (!existsSync(SEEDS_DIR)) return [];
    const ports: DiscoveredPort[] = [];
    for (const demo of readdirSync(SEEDS_DIR, { withFileTypes: true })) {
        if (!demo.isDirectory()) continue;
        for (const framework of readdirSync(join(SEEDS_DIR, demo.name), { withFileTypes: true })) {
            if (!framework.isDirectory()) continue;
            const seedDir = join(SEEDS_DIR, demo.name, framework.name);
            const manifestPath = join(seedDir, '.seed-manifest.json');
            if (!existsSync(manifestPath)) continue;
            const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Partial<{
                demo: string;
                framework: string;
                dist: string;
            }>;
            if (manifest.framework === REFERENCE_FRAMEWORK) continue;
            if (manifest.demo !== demo.name || manifest.framework !== framework.name) {
                throw new Error(
                    `${manifestPath} names ${manifest.demo}/${manifest.framework} but lives at ${demo.name}/${framework.name}`
                );
            }
            if (!DEMO_IDS.includes(manifest.demo)) {
                throw new Error(
                    `${manifestPath} names unknown demo "${manifest.demo}" (known: ${DEMO_IDS.join(', ')})`
                );
            }
            if (typeof manifest.dist !== 'string' || manifest.dist === '') {
                throw new Error(`${manifestPath} has no "dist": the parity run cannot serve this port`);
            }
            ports.push({
                demo: manifest.demo,
                framework: manifest.framework,
                seedDir,
                distDir: resolve(seedDir, manifest.dist),
                port: 0,
            });
        }
    }
    ports.sort((a, b) => `${a.demo}/${a.framework}`.localeCompare(`${b.demo}/${b.framework}`));
    ports.forEach((port, index) => (port.port = DISCOVERED_PORT_BASE + index));

    const unbuilt = ports.filter((port) => !existsSync(join(port.distDir, 'index.html')));
    if (unbuilt.length > 0) {
        const names = unbuilt.map((port) => `${port.demo}/${port.framework}`).join(', ');
        throw new Error(
            `No built dist for ${names}; run \`yarn nx run ag-charts-demos-seeds:build\` before a PARITY_DISCOVER run`
        );
    }
    return ports;
}

/**
 * The targets: from the `PARITY_TARGETS` JSON array of `{ demo, framework, baseURL }`; or, with
 * `PARITY_DISCOVER=1`, one per discovered port at the local port the config serves it on. With
 * neither, every registered demo is compared against the second React preview.
 */
export function parityTargets(): ParityTarget[] {
    const raw = process.env.PARITY_TARGETS;
    if (!raw && DISCOVER) {
        return discoverPorts().map(({ demo, framework, port }) => ({
            demo,
            framework,
            baseURL: `http://localhost:${port}`,
        }));
    }
    if (!raw) {
        return DEMO_IDS.map((demo) => ({
            demo,
            framework: REFERENCE_FRAMEWORK,
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
