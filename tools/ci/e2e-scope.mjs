#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Decides which Playwright spec files a pull request needs, from the files it changes.
 *
 * Anything this cannot classify keeps the whole suite, so the failure mode is a slower PR rather
 * than a missed test. `latest` and release branches never call this and always run everything.
 *
 * A website-only PR keeps:
 *  - every spec whose pages cannot be read statically, which covers those testing the website itself;
 *  - specs it edits, including through their committed snapshots;
 *  - for a change under `src/content/docs/<page>/`, the specs that load that page and the generated
 *    example sweep for it;
 *  - for any other website change, every generated example sweep and the cross-browser job.
 *
 * Usage: node tools/ci/e2e-scope.mjs --base <ref> --out <specs-file>
 * Prints a JSON decision. When `scope` is `scoped`, `--out` lists the specs relative to the e2e dir.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const WEBSITE = 'packages/ag-charts-website/';
const WEBSITE_SHARED_SRC = 'external/ag-website-shared/src/';
const CONTENT = `${WEBSITE}src/content/`;
const E2E = `${WEBSITE}e2e/`;

/** Docs areas `generate-test-files.ts` leaves out of the generated example sweeps. */
const PAGES_WITHOUT_SWEEP = new Set(['gallery', 'benchmarks']);

const NON_CODE = /^(?:\.claude|\.cursor|\.rulesync|docs)\/|\.md$/;

/** Mirrors `toBasePageCategory` in `e2e/generate-test-files.ts`. */
export function sweepFileForPage(page) {
    return `generated/examples-${page.replace(/-(?:test|e2e)$/, '')}.spec.ts`;
}

/** What a changed path means for scoping. `all` is the default for anything unrecognised. */
export function classifyPath(path) {
    if (NON_CODE.test(path)) return { kind: 'ignore' };
    if (path.startsWith(E2E)) {
        const relative = path.slice(E2E.length);
        const snapshotOwner = /^([^/]+\.spec\.ts)-snapshots\//.exec(relative);
        if (snapshotOwner) return { kind: 'spec', spec: snapshotOwner[1] };
        if (/^[^/]+\.spec\.ts$/.test(relative)) return { kind: 'spec', spec: relative };
        return { kind: 'all', reason: `e2e harness changed: ${path}` };
    }
    if (path.startsWith(`${CONTENT}docs/`)) {
        const page = path.slice(`${CONTENT}docs/`.length).split('/')[0];
        if (page && path !== `${CONTENT}docs/${page}`) {
            return { kind: 'page', page, hasExample: path.includes('/_examples/') };
        }
        return { kind: 'website' };
    }
    if (path.startsWith(`${CONTENT}gallery/`)) return { kind: 'page', page: 'gallery', hasExample: true };
    if (path.startsWith(`${WEBSITE}src/`) || path.startsWith(`${WEBSITE}public/`)) return { kind: 'website' };
    if (path.startsWith(WEBSITE_SHARED_SRC)) return { kind: 'website' };
    return { kind: 'all', reason: `outside the website: ${path}` };
}

/**
 * The docs pages a spec loads, or undefined when they cannot all be read from its source. The
 * caller keeps such a spec on every website PR.
 */
export function pagesLoadedBySpec(source) {
    if (/\btoPageUrl\(/.test(source)) return undefined;
    const calls = [...source.matchAll(/\btoExamplePageUrls?\(\s*(?:(['"])([^'"]+)\1)?/g)];
    if (calls.length === 0 || calls.some((call) => call[2] === undefined)) return undefined;
    return new Set(calls.map((call) => call[2]));
}

/**
 * @param changedFiles paths relative to the repo root
 * @param specs every spec relative to the e2e dir, mapped to its source; generated sweeps may map to ''
 * @param crossBrowserSpecs the top-level spec names the cross-browser job runs
 */
export function computeScope(changedFiles, specs, crossBrowserSpecs) {
    const everything = (reason) => ({ scope: 'all', reason, crossBrowser: true });

    const changes = changedFiles.map(classifyPath).filter((change) => change.kind !== 'ignore');
    if (changes.length === 0) return everything('no classifiable changes');

    const fullRun = changes.find((change) => change.kind === 'all');
    if (fullRun) return everything(fullRun.reason);

    const keep = new Set();
    const websiteWide = changes.some((change) => change.kind === 'website');
    const changedPages = new Set(changes.filter((c) => c.kind === 'page').map((c) => c.page));

    for (const change of changes) {
        if (change.kind !== 'page' || PAGES_WITHOUT_SWEEP.has(change.page)) continue;
        const sweep = sweepFileForPage(change.page);
        if (sweep in specs) {
            keep.add(sweep);
        } else if (change.hasExample) {
            // A changed example with no sweep means this mapping no longer matches the generator.
            return everything(`no generated sweep for page: ${change.page}`);
        }
    }

    for (const [spec, source] of Object.entries(specs)) {
        if (spec.startsWith('generated/')) {
            if (websiteWide) keep.add(spec);
            continue;
        }
        const pages = pagesLoadedBySpec(source);
        if (pages === undefined || [...pages].some((page) => changedPages.has(page))) {
            keep.add(spec);
        }
    }

    for (const change of changes) {
        if (change.kind !== 'spec') continue;
        // A deleted spec or snapshot has nothing left to run, so only an existing one is kept.
        if (change.spec in specs) keep.add(change.spec);
    }

    return {
        scope: 'scoped',
        reason: websiteWide ? 'website change' : 'docs content change',
        crossBrowser: websiteWide || [...keep].some((spec) => crossBrowserSpecs.has(spec)),
        specs: [...keep].sort(),
    };
}

/** The names matched by a Playwright config's `'**\/name.spec.ts'` entries. */
export function crossBrowserSpecsFromConfig(source) {
    return new Set([...source.matchAll(/'\*\*\/([^'/]+\.spec\.ts)'/g)].map((match) => match[1]));
}

function readSpecs(e2eDir) {
    const specs = {};
    for (const entry of readdirSync(e2eDir, { recursive: true })) {
        if (entry.endsWith('.spec.ts')) specs[entry] = readFileSync(join(e2eDir, entry), 'utf8');
    }
    return specs;
}

function main(argv) {
    const option = (name) => argv[argv.indexOf(`--${name}`) + 1];
    const base = option('base');
    const out = option('out');

    let decision;
    try {
        const diff = execFileSync('git', ['diff', '--name-only', '--no-renames', base], { encoding: 'utf8' });
        const config = readFileSync(`${WEBSITE}playwright.cross-browser.config.ts`, 'utf8');
        decision = computeScope(diff.split('\n').filter(Boolean), readSpecs(E2E), crossBrowserSpecsFromConfig(config));
    } catch (error) {
        decision = { scope: 'all', reason: `scope failed: ${error.message}`, crossBrowser: true };
    }

    if (decision.specs) writeFileSync(out, `${decision.specs.join('\n')}\n`);
    console.log(JSON.stringify(decision));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main(process.argv.slice(2));
}
