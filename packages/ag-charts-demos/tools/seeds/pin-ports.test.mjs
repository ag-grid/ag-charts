import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { describeDrift, findPortPinDrift, pinPorts } from './pin-ports.mjs';

const PIN = { pinnedVersion: '14.2.0', pinSource: 'release' };

let seedsDir;

/** A port as committed: 2-space package.json and 4-space manifest, both with a trailing newline. */
function writePort(demo, framework, { dependencies, devDependencies, manifest = {}, indent = 2 }) {
    const dir = join(seedsDir, demo, framework);
    mkdirSync(dir, { recursive: true });
    const packageJson = {
        name: `ag-charts-demo-${demo}-${framework}`,
        version: '0.0.0',
        private: true,
        scripts: { dev: 'vite' },
        dependencies,
        ...(devDependencies && { devDependencies }),
    };
    writeFileSync(join(dir, 'package.json'), `${JSON.stringify(packageJson, null, indent)}\n`);
    writeFileSync(
        join(dir, '.seed-manifest.json'),
        `${JSON.stringify({ demo, framework, sourceHash: 'sha256-x', ...manifest }, null, 4)}\n`
    );
    return dir;
}

const inStep = {
    dependencies: { 'ag-charts-community': '14.2.0', 'ag-charts-enterprise': '14.2.0', 'ag-grid-community': '~35.0.1' },
    manifest: { pinnedVersion: '14.2.0', pinSource: 'release', dist: 'dist' },
};

beforeEach(() => {
    seedsDir = mkdtempSync(join(tmpdir(), 'pin-ports-'));
});
afterEach(() => {
    rmSync(seedsDir, { recursive: true, force: true });
});

describe('findPortPinDrift', () => {
    it('is empty when every port pins the version', () => {
        writePort('financial', 'vue', inStep);
        writePort('financial', 'typescript', inStep);

        expect(findPortPinDrift({ seedsDir, pin: PIN })).toEqual([]);
    });

    it('names each drifted ag-charts-* dependency and manifest field, and nothing else', () => {
        writePort('financial', 'angular', {
            dependencies: {
                'ag-charts-angular': '14.1.0',
                'ag-charts-community': '14.2.0',
                'ag-charts-enterprise': '14.1.0',
                'ag-grid-angular': '~34.0.0',
            },
            manifest: { pinnedVersion: '14.1.0', pinSource: 'dist-tag', dist: 'dist' },
        });

        const drift = findPortPinDrift({ seedsDir, pin: PIN });
        expect(drift).toMatchObject([
            {
                demo: 'financial',
                framework: 'angular',
                pins: { 'ag-charts-angular': '14.1.0', 'ag-charts-enterprise': '14.1.0' },
                manifest: { pinnedVersion: '14.1.0', pinSource: 'dist-tag' },
            },
        ]);
        expect(describeDrift(drift)).toEqual([
            'seeds/financial/angular: ag-charts-angular 14.1.0, ag-charts-enterprise 14.1.0, manifest pinnedVersion 14.1.0, manifest pinSource dist-tag',
        ]);
    });

    it('reports a manifest whose pin fields are missing as drift', () => {
        writePort('financial', 'vue', { ...inStep, manifest: { dist: 'dist' } });

        const drift = findPortPinDrift({ seedsDir, pin: PIN });
        expect(drift).toMatchObject([
            { framework: 'vue', pins: {}, manifest: { pinnedVersion: null, pinSource: null } },
        ]);
        expect(describeDrift(drift)).toEqual([
            'seeds/financial/vue: manifest pinnedVersion missing, manifest pinSource missing',
        ]);
    });

    it('covers devDependencies too, and skips the generated React seed', () => {
        writePort('financial', 'react', {
            dependencies: { 'ag-charts-community': '1.0.0' },
            manifest: { pinnedVersion: '1.0.0' },
        });
        writePort('financial', 'typescript', {
            dependencies: { 'ag-grid-community': '~35.0.1' },
            devDependencies: { 'ag-charts-community': '14.1.0' },
            manifest: inStep.manifest,
        });

        expect(findPortPinDrift({ seedsDir, pin: PIN })).toMatchObject([
            { framework: 'typescript', pins: { 'ag-charts-community': '14.1.0' } },
        ]);
    });

    it('rejects a port that pins no ag-charts-* package at all', () => {
        writePort('financial', 'vue', { ...inStep, dependencies: { vue: '^3.5.13' } });

        expect(() => findPortPinDrift({ seedsDir, pin: PIN })).toThrow(
            /vue\/package\.json pins no ag-charts-\* package/
        );
    });
});

describe('pinPorts', () => {
    it('rewrites only the drifted values and keeps each file byte-for-byte otherwise', () => {
        const dir = writePort('financial', 'angular', {
            dependencies: {
                '@angular/core': '^20.0.0',
                'ag-charts-angular': '14.1.0',
                'ag-charts-community': '14.1.0',
                'ag-grid-angular': '~35.0.1',
            },
            manifest: { sourceCommit: 'abc', pinnedVersion: '14.1.0', pinSource: 'dist-tag', dist: 'dist' },
        });
        const packageBefore = readFileSync(join(dir, 'package.json'), 'utf8');
        const manifestBefore = readFileSync(join(dir, '.seed-manifest.json'), 'utf8');

        const fixed = pinPorts({ seedsDir, pin: PIN });

        expect(fixed).toHaveLength(1);
        expect(readFileSync(join(dir, 'package.json'), 'utf8')).toBe(
            packageBefore
                .replace('"ag-charts-angular": "14.1.0"', '"ag-charts-angular": "14.2.0"')
                .replace('"ag-charts-community": "14.1.0"', '"ag-charts-community": "14.2.0"')
        );
        expect(readFileSync(join(dir, '.seed-manifest.json'), 'utf8')).toBe(
            manifestBefore
                .replace('"pinnedVersion": "14.1.0"', '"pinnedVersion": "14.2.0"')
                .replace('"pinSource": "dist-tag"', '"pinSource": "release"')
        );
        expect(findPortPinDrift({ seedsDir, pin: PIN })).toEqual([]);
    });

    it('moves a release-pinned port to the npm latest dist-tag', () => {
        const dir = writePort('financial', 'vue', {
            dependencies: { 'ag-charts-vue3': '14.2.0', 'ag-charts-enterprise': '14.2.0', vue: '^3.5.13' },
            manifest: inStep.manifest,
        });

        pinPorts({ seedsDir, pin: { pinnedVersion: 'latest', pinSource: 'dist-tag' } });

        expect(JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).dependencies).toEqual({
            'ag-charts-vue3': 'latest',
            'ag-charts-enterprise': 'latest',
            vue: '^3.5.13',
        });
        expect(JSON.parse(readFileSync(join(dir, '.seed-manifest.json'), 'utf8'))).toMatchObject({
            pinnedVersion: 'latest',
            pinSource: 'dist-tag',
        });
    });

    it('preserves a 4-space package.json as it found it', () => {
        const dir = writePort('financial', 'vue', {
            dependencies: { 'ag-charts-vue3': '14.1.0', 'ag-charts-community': '14.2.0' },
            manifest: inStep.manifest,
            indent: 4,
        });
        const before = readFileSync(join(dir, 'package.json'), 'utf8');

        pinPorts({ seedsDir, pin: PIN });

        expect(readFileSync(join(dir, 'package.json'), 'utf8')).toBe(
            before.replace('"ag-charts-vue3": "14.1.0"', '"ag-charts-vue3": "14.2.0"')
        );
    });

    it('adds missing manifest pin fields after "framework" with the manifest indentation', () => {
        const dir = writePort('financial', 'typescript', { ...inStep, manifest: { dist: 'dist' } });

        pinPorts({ seedsDir, pin: PIN });

        expect(readFileSync(join(dir, '.seed-manifest.json'), 'utf8')).toBe(
            `${JSON.stringify(
                {
                    demo: 'financial',
                    framework: 'typescript',
                    pinnedVersion: '14.2.0',
                    pinSource: 'release',
                    sourceHash: 'sha256-x',
                    dist: 'dist',
                },
                null,
                4
            )}\n`
        );
    });

    it('touches nothing when every port is already in step', () => {
        const dir = writePort('financial', 'vue', inStep);
        const before = readFileSync(join(dir, 'package.json'), 'utf8');

        expect(pinPorts({ seedsDir, pin: PIN })).toEqual([]);
        expect(readFileSync(join(dir, 'package.json'), 'utf8')).toBe(before);
    });

    it('refuses a package.json where a pinned name occurs twice, rather than guessing', () => {
        writePort('financial', 'vue', {
            dependencies: { 'ag-charts-community': '14.1.0' },
            devDependencies: { 'ag-charts-community': '14.1.0' },
            manifest: inStep.manifest,
        });

        expect(() => pinPorts({ seedsDir, pin: PIN })).toThrow(
            /vue\/package\.json: "ag-charts-community" occurs 2 times/
        );
    });
});
