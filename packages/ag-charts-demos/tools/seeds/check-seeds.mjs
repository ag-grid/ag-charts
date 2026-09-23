#!/usr/bin/env node
/* eslint-disable no-console */
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';

import { PIN_COMMAND, describeDrift, findPortPinDrift } from './pin-ports.mjs';
import {
    MANIFEST_FILENAME,
    SEEDS_DIR,
    WORKSPACE_ROOT,
    describePin,
    listFiles,
    listSourceFiles,
    readDemoIds,
    readPinnedChartsVersion,
} from './seed-common.mjs';
import { GENERATED_FRAMEWORK, findStalePorts } from './stale-ports.mjs';

/**
 * Freshness check for the committed seed projects.
 *
 * `--react` regenerates every React seed into a temporary directory and diffs it against
 * `seeds/<id>/react/`. Any difference means the committed seed no longer matches its golden
 * master (or the workspace version moved), so the check exits non-zero with a summary of what
 * changed and how to fix it.
 *
 * `--stale` reports the hand-maintained framework ports whose `.seed-manifest.json` no longer
 * matches the hash of their golden master, as JSON on stdout:
 * `{ "stale": [{ demo, framework, sourceHash, manifestHash, sourceCommit, manifestCommit }] }`.
 * It is a report, so it exits 0 whatever it finds unless `--fail-on-stale` is also passed.
 * It needs nothing installed: the generator (and its Prettier dependency) is only loaded for
 * `--react`, so CI can run it on a bare checkout. Stale ports are expected on `latest` between
 * releases; they are aligned at the release-branch cut.
 *
 * `--pins` fails when a framework port's `ag-charts-*` pins, or its manifest's `pinnedVersion` /
 * `pinSource`, disagree with what the seeds install (`readPinnedChartsVersion`: the release
 * version on a release branch or a release, the npm `latest` dist-tag otherwise), naming the port
 * and the command that fixes it. The React seed's pins are covered by `--react`. Both checks
 * follow the branch the checkout is built for (`resolveBranch`), a pull request's base included.
 *
 * `--react` and `--pins` combine; the exit status is non-zero if either fails.
 *
 * Usage: node tools/seeds/check-seeds.mjs --react [--pins]
 *        node tools/seeds/check-seeds.mjs --stale [--fail-on-stale]
 */

/** Manifest fields the comparison ignores: a shallow CI checkout cannot reproduce the source commit. */
const MANIFEST_IGNORED_FIELDS = ['sourceCommit'];

/** Lines of context shown around the first difference in a changed text file. */
const MAX_DIFF_LINES = 6;

function readComparable(path, relativePath) {
    const content = readFileSync(path);
    if (relativePath !== MANIFEST_FILENAME) return content;
    const manifest = JSON.parse(content.toString('utf8'));
    for (const field of MANIFEST_IGNORED_FIELDS) delete manifest[field];
    return Buffer.from(JSON.stringify(manifest, null, 4));
}

function isText(buffer) {
    return !buffer.subarray(0, 8000).includes(0);
}

/** First run of differing lines between two texts, in a compact expected/actual form. */
function describeTextDifference(expected, actual) {
    const expectedLines = expected.split('\n');
    const actualLines = actual.split('\n');
    const lines = [];
    let shown = 0;
    for (let i = 0; i < Math.max(expectedLines.length, actualLines.length) && shown < MAX_DIFF_LINES; i++) {
        if (expectedLines[i] === actualLines[i]) continue;
        lines.push(`      line ${i + 1}:`);
        if (expectedLines[i] !== undefined) lines.push(`        - ${expectedLines[i]}`);
        if (actualLines[i] !== undefined) lines.push(`        + ${actualLines[i]}`);
        shown++;
    }
    return lines;
}

/** Compares one committed seed with its regenerated twin; returns the report lines, empty when identical. */
function compareSeed(demoId, freshRoot, isPreservedPath) {
    const committedDir = join(SEEDS_DIR, demoId, GENERATED_FRAMEWORK);
    const freshDir = join(freshRoot, demoId, GENERATED_FRAMEWORK);
    const label = relative(WORKSPACE_ROOT, committedDir);

    if (!existsSync(committedDir)) {
        return [`${label}: missing (not generated yet)`];
    }

    // Git's view of the committed seed, so an ignored file dropped into it (`.DS_Store`) is not
    // reported as a file the generator no longer writes.
    const committedFiles = new Set(listSourceFiles(committedDir).filter((file) => !isPreservedPath(file)));
    const freshFiles = new Set(listFiles(freshDir));
    const report = [];

    for (const file of [...freshFiles].sort()) {
        if (!committedFiles.has(file)) {
            report.push(`  + ${file} (missing from the committed seed)`);
            continue;
        }
        const expected = readComparable(join(freshDir, file), file);
        const actual = readComparable(join(committedDir, file), file);
        if (expected.equals(actual)) continue;

        report.push(`  ~ ${file}`);
        if (isText(expected) && isText(actual)) {
            report.push(...describeTextDifference(expected.toString('utf8'), actual.toString('utf8')));
        } else {
            report.push(`      binary content differs (${expected.length} vs ${actual.length} bytes)`);
        }
    }
    for (const file of [...committedFiles].sort()) {
        if (!freshFiles.has(file)) {
            report.push(`  - ${file} (no longer generated)`);
        }
    }

    return report.length ? [`${label}: stale`, ...report] : [];
}

async function checkReact() {
    const { generateReactSeed, isPreservedPath } = await import('./generate-react-seed.mjs');
    const freshRoot = mkdtempSync(join(tmpdir(), 'ag-charts-seeds-'));
    try {
        const stale = [];
        for (const demoId of readDemoIds()) {
            await generateReactSeed(demoId, freshRoot);
            const report = compareSeed(demoId, freshRoot, isPreservedPath);
            if (report.length) stale.push(report);
        }

        if (stale.length === 0) {
            console.log('check-seeds: all React seeds are up to date.');
            return 0;
        }

        console.error('check-seeds: committed React seeds differ from their golden masters.\n');
        for (const report of stale) {
            console.error(report.join('\n'));
            console.error('');
        }
        console.error('Regenerate with: node packages/ag-charts-demos/tools/seeds/generate-react-seed.mjs');
        console.error('then commit the result (or `yarn nx run ag-charts-demos:generate-seeds`).');
        return 1;
    } finally {
        rmSync(freshRoot, { recursive: true, force: true });
    }
}

function reportStale(failOnStale) {
    const stale = findStalePorts({ onSkip: (message) => console.error(`check-seeds: ${message}`) });
    console.log(JSON.stringify({ stale }, null, 2));
    return failOnStale && stale.length > 0 ? 1 : 0;
}

function checkPins() {
    const pin = readPinnedChartsVersion();
    const drift = findPortPinDrift({ pin });
    if (drift.length === 0) {
        console.log(`check-seeds: every port pins ag-charts-* ${describePin(pin)}.`);
        return 0;
    }
    console.error(`check-seeds: framework ports must pin ag-charts-* ${describePin(pin)}.\n`);
    for (const line of describeDrift(drift)) console.error(`  ${line}`);
    console.error(`\nFix with: ${PIN_COMMAND}`);
    console.error('then commit the result.');
    return 1;
}

async function main(argv) {
    const checks = [];
    if (argv.includes('--react')) checks.push(checkReact);
    if (argv.includes('--pins')) checks.push(checkPins);
    if (checks.length > 0) {
        let status = 0;
        for (const check of checks) status = Math.max(status, await check());
        return status;
    }
    if (argv.includes('--stale')) {
        return reportStale(argv.includes('--fail-on-stale'));
    }
    console.error(
        'check-seeds: pass --react to verify the committed React seeds are fresh, --pins to verify the ports pin the seeds version, or --stale to report ported seeds behind their golden master.'
    );
    return 2;
}

process.exit(await main(process.argv.slice(2)));
