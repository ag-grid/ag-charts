#!/usr/bin/env node
/* eslint-disable no-console */
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';

import { FRAMEWORK, generateReactSeed, isPreservedPath } from './generate-react-seed.mjs';
import { MANIFEST_FILENAME, SEEDS_DIR, WORKSPACE_ROOT, listFiles, readDemoIds } from './seed-common.mjs';

/**
 * Freshness check for the committed seed projects.
 *
 * `--react` regenerates every React seed into a temporary directory and diffs it against
 * `seeds/<id>/react/`. Any difference means the committed seed no longer matches its golden
 * master (or the workspace version moved), so the check exits non-zero with a summary of what
 * changed and how to fix it.
 *
 * Usage: node tools/seeds/check-seeds.mjs --react
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
function compareSeed(demoId, freshRoot) {
    const committedDir = join(SEEDS_DIR, demoId, FRAMEWORK);
    const freshDir = join(freshRoot, demoId, FRAMEWORK);
    const label = relative(WORKSPACE_ROOT, committedDir);

    if (!existsSync(committedDir)) {
        return [`${label}: missing (not generated yet)`];
    }

    const committedFiles = new Set(listFiles(committedDir).filter((file) => !isPreservedPath(file)));
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
    const freshRoot = mkdtempSync(join(tmpdir(), 'ag-charts-seeds-'));
    try {
        const stale = [];
        for (const demoId of readDemoIds()) {
            await generateReactSeed(demoId, freshRoot);
            const report = compareSeed(demoId, freshRoot);
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

async function main(argv) {
    if (argv.includes('--react')) {
        return checkReact();
    }
    console.error('check-seeds: pass --react to verify the committed React seeds are fresh.');
    return 2;
}

process.exit(await main(process.argv.slice(2)));
