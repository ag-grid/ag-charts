/* eslint-disable no-console */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { WORKSPACE_ROOT } from './seed-common.mjs';
import { findStalePorts, readPortManifests } from './stale-ports.mjs';

/**
 * Which framework ports the demos' functional specs (`e2e/*.spec.ts`) run against in CI, and what
 * the run of each is.
 *
 * Every committed port is a single-demo app, so it can only answer its own demo's specs. Stale
 * ports, whose demo changed after they were last aligned, are skipped exactly as the blocking
 * parity run skips them (a React change on `latest` must not fail on ports that are aligned at the
 * next release cut). Both come from `stale-ports.mjs`, so the discovery and the hashing are the
 * seed tooling's own.
 *
 * Usage: node tools/seeds/port-spec-plan.mjs [--stale-report <file>] [--out <file>]
 *
 * `--stale-report` reads the output of `check-seeds.mjs --stale` instead of working it out, so the
 * parity step's report can be reused. The plan (`{ run, skipped }`, see `planPortSpecs`) goes to
 * `--out`, or to stdout; the human-readable summary and GitHub annotations go to stderr.
 */

/**
 * Splits `ports` (as `readPortManifests` returns them) into the ports to run the functional specs
 * against, as `{ demo, framework, dist, grep }`, and the stale ones to skip, as `{ demo, framework }`,
 * both in `<demo>/<framework>` order.
 *
 * `dist` is the port's build output as a repository-relative POSIX path, because the specs run
 * in a container that mounts the checkout elsewhere; `grep` is the Playwright title filter that
 * selects only that port's demo.
 */
export function planPortSpecs({ ports, stale, workspaceRoot = WORKSPACE_ROOT }) {
    const staleKeys = new Set(stale.map(({ demo, framework }) => portKey(demo, framework)));
    const byKey = (a, b) => portKey(a.demo, a.framework).localeCompare(portKey(b.demo, b.framework));
    const run = [];
    const skipped = [];
    for (const { demo, framework, manifestPath, manifest } of [...ports].sort(byKey)) {
        if (staleKeys.has(portKey(demo, framework))) {
            skipped.push({ demo, framework });
            continue;
        }
        if (typeof manifest.dist !== 'string' || manifest.dist === '') {
            throw new Error(`${manifestPath} has no "dist": the functional specs cannot serve this port`);
        }
        const dist = relative(workspaceRoot, resolve(dirname(manifestPath), manifest.dist))
            .split(/[\\/]/)
            .join('/');
        run.push({ demo, framework, dist, grep: demoGrep(demo) });
    }
    return { run, skipped };
}

/** `demo/framework`, the name a port goes by in every message. */
export function portKey(demo, framework) {
    return `${demo}/${framework}`;
}

/**
 * The `--grep` pattern selecting the specs of `demo`: each spec file names its demo in the title
 * of every test and describe block (`demo "<id>" renders…`, `test.describe(<id>)`), and the title
 * Playwright matches also carries the spec's file name. Demo ids are lower-case words joined by
 * hyphens, so there is nothing to escape; anything else is refused rather than matched loosely.
 */
export function demoGrep(demo) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(demo)) {
        throw new Error(`"${demo}" is not a demo id: expected lower-case words joined by hyphens`);
    }
    return demo;
}

/** The lines the job prints about a plan: what runs, what is skipped and why, or that nothing does. */
export function describePlan({ run, skipped }, { annotate = false } = {}) {
    const lines = [];
    for (const { demo, framework } of skipped) {
        const message = `seeds/${demo}/${framework} no longer matches src/demos/${demo} and its functional specs are not run. It is aligned at the release-branch cut (Demo Port Alignment workflow) or with /port-showcases.`;
        lines.push(
            annotate
                ? `::warning title=Stale demo port skipped by functional specs::${message}`
                : `Skipped (stale): ${portKey(demo, framework)}`
        );
    }
    if (skipped.length > 0 && annotate) {
        lines.push(`Skipped stale ports: ${skipped.map((port) => portKey(port.demo, port.framework)).join(', ')}`);
    }
    if (run.length === 0) {
        lines.push(
            skipped.length === 0
                ? 'No committed framework ports: there is nothing to run the functional specs against.'
                : 'Every committed framework port is stale: there is nothing to run the functional specs against.'
        );
    } else {
        lines.push(`Functional specs run against: ${run.map((port) => portKey(port.demo, port.framework)).join(', ')}`);
    }
    return lines;
}

/** The stale ports from a `check-seeds.mjs --stale` report file. */
export function readStaleReport(path) {
    const report = JSON.parse(readFileSync(path, 'utf8'));
    if (!Array.isArray(report.stale)) {
        throw new Error(`${path} is not a stale report: it has no "stale" array`);
    }
    return report.stale;
}

function readOption(argv, name) {
    const index = argv.indexOf(name);
    if (index === -1) return undefined;
    const value = argv[index + 1];
    if (value == null || value.startsWith('--')) throw new Error(`${name} needs a value`);
    return value;
}

function main(argv) {
    const staleReport = readOption(argv, '--stale-report');
    const out = readOption(argv, '--out');
    const ports = readPortManifests();
    const stale =
        staleReport == null
            ? findStalePorts({ onSkip: (message) => console.error(`port-spec-plan: ${message}`) })
            : readStaleReport(staleReport);
    const plan = planPortSpecs({ ports, stale });

    for (const line of describePlan(plan, { annotate: process.env.GITHUB_ACTIONS === 'true' })) console.error(line);
    const json = `${JSON.stringify(plan, null, 2)}\n`;
    if (out == null) {
        process.stdout.write(json);
    } else {
        mkdirSync(dirname(resolve(out)), { recursive: true });
        writeFileSync(out, json);
    }
}

if (process.argv[1] != null && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    try {
        main(process.argv.slice(2));
    } catch (error) {
        console.error(`port-spec-plan: ${error.message}`);
        process.exit(1);
    }
}
