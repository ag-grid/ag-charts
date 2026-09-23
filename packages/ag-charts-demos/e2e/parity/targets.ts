import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { DEMO_APPS } from '../../src/registry';
import { type ComparisonGate, PORT_GATE, SELF_PARITY_GATE } from './compare';

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

/** A local port from the environment variable `name`, or `fallback` when it is unset. */
function envPort(name: string, fallback: number): number {
    const raw = process.env[name];
    if (raw == null || raw === '') return fallback;
    const port = Number(raw);
    if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
        throw new Error(`${name} must be a port number, not "${raw}"`);
    }
    return port;
}

/**
 * Ports the config serves the React app on: the reference always (unless `PARITY_REFERENCE_URL`
 * names one served elsewhere), and the second copy a self-parity run compares it with.
 * `PARITY_REFERENCE_PORT` and `PARITY_SELF_PORT` move them, so runs in two checkouts can coexist.
 */
export const SELF_PARITY_PORTS = {
    reference: envPort('PARITY_REFERENCE_PORT', 4701),
    port: envPort('PARITY_SELF_PORT', 4702),
} as const;

/** Discovered ports are served from here upwards, one port each, in manifest order. `PARITY_PORT_BASE` moves them. */
export const DISCOVERED_PORT_BASE = envPort('PARITY_PORT_BASE', 4710);

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

/**
 * Which kind of run this is. It names the results folder, the JUnit report and Playwright's output
 * folder, so a self-parity run and a run against the ports can follow each other (as in CI)
 * without the second deleting what the first left.
 */
export const RUN_KIND: 'self-parity' | 'ports' = SELF_PARITY ? 'self-parity' : 'ports';

/** The gate every comparison in this run must pass. */
export const GATE: ComparisonGate = SELF_PARITY ? SELF_PARITY_GATE : PORT_GATE;

/**
 * True when a discovery run compares stale ports too (`PARITY_INCLUDE_STALE=1`), for checking a
 * port mid-alignment before its manifest is restamped. Off by default, and off in CI.
 */
export const INCLUDE_STALE = ['1', 'true'].includes(process.env.PARITY_INCLUDE_STALE ?? '');

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
 * `<demo>/<framework>` order. A new port is picked up by committing its manifest; nothing here has
 * to change. `port` is 0 until `discoverParityPorts` numbers the ports it serves.
 */
export function readCommittedPorts(): DiscoveredPort[] {
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
    return ports;
}

/**
 * One entry of `check-seeds.mjs --stale`: a port whose manifest's `sourceHash` (`manifestHash`) is
 * not the current hash of its React demo (`sourceHash`). The commits name the same two points.
 */
export interface StalePortReport {
    demo: string;
    framework: string;
    sourceHash: string;
    manifestHash: string | null;
    sourceCommit: string | null;
    manifestCommit: string | null;
}

/** A committed port a discovery run leaves out, and why. Recorded in `summary.json`. */
export interface SkippedPort extends StalePortReport {
    reason: 'stale';
}

const STALE_REPORT_SCRIPT = resolve(__dirname, '..', '..', 'tools', 'seeds', 'check-seeds.mjs');

/**
 * The stale ports, from the report `check-seeds.mjs --stale` writes, so the hashing is the seed
 * tooling's own and never reimplemented here. With `PARITY_STALE_REPORT` naming a file (relative
 * to the working directory) the report is read from it: CI writes it on the host, where the
 * checkout's git is set up (the hash reads its file list from git), before starting the run in its
 * Playwright container. Otherwise the script is run here.
 */
export function readStaleReport(): StalePortReport[] {
    const path = process.env.PARITY_STALE_REPORT;
    const text = path
        ? readFileSync(resolve(path), 'utf8')
        : execFileSync(process.execPath, [STALE_REPORT_SCRIPT, '--stale'], {
              encoding: 'utf8',
              stdio: ['ignore', 'pipe', 'inherit'],
          });
    const report = JSON.parse(text) as { stale?: unknown };
    if (!Array.isArray(report.stale)) {
        throw new Error(`${path ?? 'check-seeds.mjs --stale'} is not a stale report: it has no "stale" array`);
    }
    return report.stale as StalePortReport[];
}

/**
 * Splits the committed ports into the ones to compare and the stale ones to skip. A stale port's
 * manifest records an older hash of its demo than the current one: the demo changed after the port
 * was last aligned, which is expected on `latest` between releases (ports are aligned at the
 * release-branch cut), so comparing it would fail every pull request that visibly changes a demo.
 * With `includeStale` nothing is skipped.
 */
export function partitionStalePorts<T extends { demo: string; framework: string }>(
    ports: readonly T[],
    stale: readonly StalePortReport[],
    includeStale = false
): { current: T[]; skipped: SkippedPort[] } {
    if (includeStale) return { current: [...ports], skipped: [] };
    const staleByKey = new Map(stale.map((entry) => [`${entry.demo}/${entry.framework}`, entry]));
    const current: T[] = [];
    const skipped: SkippedPort[] = [];
    for (const port of ports) {
        const entry = staleByKey.get(`${port.demo}/${port.framework}`);
        if (!entry) {
            current.push(port);
            continue;
        }
        const { demo, framework, sourceHash, manifestHash, sourceCommit, manifestCommit } = entry;
        skipped.push({ demo, framework, reason: 'stale', sourceHash, manifestHash, sourceCommit, manifestCommit });
    }
    return { current, skipped };
}

let discovered: { ports: DiscoveredPort[]; skipped: SkippedPort[] } | undefined;

/**
 * What a `PARITY_DISCOVER` run compares: every committed port that is not stale (see
 * `partitionStalePorts`), numbered from `DISCOVERED_PORT_BASE` in `<demo>/<framework>` order so
 * port numbers are stable between runs, and the stale ones it skips. A port to compare whose
 * `dist` is missing is reported, since the run would otherwise fail inside the web server with
 * less to go on. Worked out once per process: the config, the reporter and the spec all ask.
 */
export function discoverParityPorts(): { ports: DiscoveredPort[]; skipped: SkippedPort[] } {
    if (discovered) return discovered;
    const committed = readCommittedPorts();
    const stale = committed.length === 0 || INCLUDE_STALE ? [] : readStaleReport();
    const { current, skipped } = partitionStalePorts(committed, stale, INCLUDE_STALE);
    current.forEach((port, index) => (port.port = DISCOVERED_PORT_BASE + index));

    const unbuilt = current.filter((port) => !existsSync(join(port.distDir, 'index.html')));
    if (unbuilt.length > 0) {
        const names = unbuilt.map((port) => `${port.demo}/${port.framework}`).join(', ');
        throw new Error(
            `No built dist for ${names}; run \`yarn nx run ag-charts-demos-seeds:build\` before a PARITY_DISCOVER run`
        );
    }
    discovered = { ports: current, skipped };
    return discovered;
}

/** The ports this run skips: the stale ones in a discovery run, none otherwise. */
export function skippedPorts(): SkippedPort[] {
    return DISCOVER ? discoverParityPorts().skipped : [];
}

/**
 * The targets: from the `PARITY_TARGETS` JSON array of `{ demo, framework, baseURL }`; or, with
 * `PARITY_DISCOVER=1`, one per discovered port that is not stale, at the local port the config
 * serves it on, which may be none. With neither, every registered demo is compared against the
 * second React preview.
 */
export function parityTargets(): ParityTarget[] {
    const raw = process.env.PARITY_TARGETS;
    if (!raw && DISCOVER) {
        return discoverParityPorts().ports.map(({ demo, framework, port }) => ({
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
