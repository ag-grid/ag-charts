import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { generateReactSeeds } from './generate-react-seed.mjs';

const BETA = '14.3.0-beta.20260920';

let seedsDir;
let outRoot;

/** A committed seed pinning `version` throughout, as a merge-back or a bump leaves it. */
function writeCommittedSeed(seed, version, pinSource) {
    const dir = join(seedsDir, seed);
    mkdirSync(dir, { recursive: true });
    const [demo, framework] = seed.split('/');
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ dependencies: { 'ag-charts-community': version } }));
    writeFileSync(
        join(dir, '.seed-manifest.json'),
        JSON.stringify({ demo, framework, pinnedVersion: version, pinSource })
    );
}

/** The pins the generated financial seed carries, off its package.json, manifest and README. */
function readGeneratedPins() {
    const dir = join(outRoot, 'financial', 'react');
    const { dependencies } = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
    const manifest = JSON.parse(readFileSync(join(dir, '.seed-manifest.json'), 'utf8'));
    return {
        dependencies: Object.entries(dependencies).filter(([name]) => name.startsWith('ag-charts-')),
        pinnedVersion: manifest.pinnedVersion,
        pinSource: manifest.pinSource,
        readme: readFileSync(join(dir, 'README.md'), 'utf8'),
    };
}

beforeEach(() => {
    seedsDir = mkdtempSync(join(tmpdir(), 'generate-seed-committed-'));
    outRoot = mkdtempSync(join(tmpdir(), 'generate-seed-out-'));
    writeCommittedSeed('financial/react', '14.2.0', 'release');
    writeCommittedSeed('financial/vue', '14.2.0', 'release');
});
afterEach(() => {
    rmSync(seedsDir, { recursive: true, force: true });
    rmSync(outRoot, { recursive: true, force: true });
});

describe('generateReactSeeds', () => {
    it('keeps a release every committed seed carries in from a merge-back', async () => {
        const log = [];
        await generateReactSeeds(['--out', outRoot, 'financial'], {
            seedsDir,
            workspaceVersion: BETA,
            log: (line) => log.push(line),
        });

        const pins = readGeneratedPins();
        expect(pins.dependencies.length).toBeGreaterThan(0);
        expect(pins.dependencies.every(([, version]) => version === '14.2.0')).toBe(true);
        expect(pins).toMatchObject({ pinnedVersion: '14.2.0', pinSource: 'release' });
        expect(pins.readme).toMatch(/pinned to 14\.2\.0/);
        expect(log[0]).toBe(
            'Pinning ag-charts-* 14.2.0 (release carried in by a merge-back; the next beta bump restores latest)'
        );
    });

    it('pins the npm latest dist-tag instead with --reset-pin', async () => {
        await generateReactSeeds(['--out', outRoot, '--reset-pin', 'financial'], {
            seedsDir,
            workspaceVersion: BETA,
            log: () => {},
        });

        const pins = readGeneratedPins();
        expect(pins.dependencies.every(([, version]) => version === 'latest')).toBe(true);
        expect(pins).toMatchObject({ pinnedVersion: 'latest', pinSource: 'dist-tag' });
        expect(pins.readme).toMatch(/use the npm `latest` tag/);
    });
});
