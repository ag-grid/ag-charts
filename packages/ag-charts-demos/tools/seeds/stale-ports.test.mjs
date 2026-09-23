import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { findStalePorts, readPortManifests } from './stale-ports.mjs';
import { stampPortManifest } from './stamp-port-manifest.mjs';

const CURRENT_HASH = 'sha256-current';
const CURRENT_COMMIT = 'c0ffee0000000000000000000000000000000000';

let seedsDir;

function writeManifest(demo, framework, manifest) {
    const dir = join(seedsDir, demo, framework);
    mkdirSync(dir, { recursive: true });
    const path = join(dir, '.seed-manifest.json');
    writeFileSync(path, `${JSON.stringify({ demo, framework, ...manifest }, null, 4)}\n`);
    return path;
}

const options = () => ({
    seedsDir,
    demoIds: ['financial', 'procurement'],
    hashSource: (demo) => `${CURRENT_HASH}-${demo}`,
    readSourceCommit: () => CURRENT_COMMIT,
});

beforeEach(() => {
    seedsDir = mkdtempSync(join(tmpdir(), 'stale-ports-'));
});
afterEach(() => {
    rmSync(seedsDir, { recursive: true, force: true });
});

describe('readPortManifests', () => {
    it('lists every ported framework and skips the generated React seed', () => {
        writeManifest('financial', 'react', { sourceHash: 'x' });
        writeManifest('financial', 'angular', { sourceHash: 'x' });
        writeManifest('financial', 'vue', { sourceHash: 'x' });
        mkdirSync(join(seedsDir, 'financial', 'typescript'), { recursive: true }); // no manifest yet
        writeFileSync(join(seedsDir, 'project.json'), '{}');

        expect(readPortManifests(seedsDir).map(({ demo, framework }) => `${demo}/${framework}`)).toEqual([
            'financial/angular',
            'financial/vue',
        ]);
    });

    it('rejects a manifest that disagrees with its folder', () => {
        writeManifest('financial', 'angular', { sourceHash: 'x' });
        const path = join(seedsDir, 'financial', 'angular', '.seed-manifest.json');
        writeFileSync(path, JSON.stringify({ demo: 'procurement', framework: 'angular', sourceHash: 'x' }));

        expect(() => readPortManifests(seedsDir)).toThrow(/"demo" is "procurement" but the folder says "financial"/);
    });

    it('is empty when there is no seeds folder', () => {
        expect(readPortManifests(join(seedsDir, 'missing'))).toEqual([]);
    });
});

describe('findStalePorts', () => {
    it('reports only the ports whose recorded hash differs from the current one', () => {
        writeManifest('financial', 'angular', { sourceHash: `${CURRENT_HASH}-financial`, sourceCommit: 'aaa' });
        writeManifest('financial', 'vue', { sourceHash: 'sha256-old', sourceCommit: 'bbb' });
        writeManifest('procurement', 'typescript', { sourceHash: `${CURRENT_HASH}-procurement`, sourceCommit: 'ccc' });

        expect(findStalePorts(options())).toEqual([
            {
                demo: 'financial',
                framework: 'vue',
                sourceHash: `${CURRENT_HASH}-financial`,
                manifestHash: 'sha256-old',
                sourceCommit: CURRENT_COMMIT,
                manifestCommit: 'bbb',
            },
        ]);
    });

    it('treats a manifest without a sourceHash as never synced', () => {
        writeManifest('financial', 'angular', { pinnedVersion: '14.2.0' });

        expect(findStalePorts(options())).toMatchObject([
            { demo: 'financial', framework: 'angular', manifestHash: null, manifestCommit: null },
        ]);
    });

    it('hashes each demo once however many ports it has', () => {
        writeManifest('financial', 'angular', { sourceHash: 'old' });
        writeManifest('financial', 'vue', { sourceHash: 'old' });
        writeManifest('financial', 'typescript', { sourceHash: 'old' });
        const hashed = [];

        const stale = findStalePorts({ ...options(), hashSource: (demo) => (hashed.push(demo), 'new') });

        expect(stale).toHaveLength(3);
        expect(hashed).toEqual(['financial']);
    });

    it('skips a seed folder for an unregistered demo and says so', () => {
        writeManifest('retired', 'angular', { sourceHash: 'old' });
        const skipped = [];

        expect(findStalePorts({ ...options(), onSkip: (message) => skipped.push(message) })).toEqual([]);
        expect(skipped).toEqual(['seeds/retired/angular: "retired" is not a registered demo; skipped']);
    });
});

describe('stampPortManifest', () => {
    it('rewrites only sourceHash and sourceCommit and keeps the field order', () => {
        const path = writeManifest('financial', 'vue', {
            sourceHash: 'sha256-old',
            sourceCommit: 'bbb',
            pinnedVersion: '14.2.0',
            pinSource: 'release',
            dist: 'dist',
        });

        const stamped = stampPortManifest(path, {
            hashSource: () => 'sha256-new',
            readSourceCommit: () => CURRENT_COMMIT,
        });

        expect(stamped).toEqual({ sourceHash: 'sha256-new', sourceCommit: CURRENT_COMMIT });
        expect(readFileSync(path, 'utf8')).toBe(
            `${JSON.stringify(
                {
                    demo: 'financial',
                    framework: 'vue',
                    sourceHash: 'sha256-new',
                    sourceCommit: CURRENT_COMMIT,
                    pinnedVersion: '14.2.0',
                    pinSource: 'release',
                    dist: 'dist',
                },
                null,
                4
            )}\n`
        );
        expect(findStalePorts({ ...options(), hashSource: () => 'sha256-new' })).toEqual([]);
    });
});
