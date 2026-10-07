import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { hashDemoSource } from './seed-common.mjs';
import {
    findStalePorts,
    findStalePortsAtBase,
    findTouchedStalePorts,
    readPortManifests,
    splitTouchedByBaseStaleness,
} from './stale-ports.mjs';
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
    demoIds: ['trading-terminal', 'procurement'],
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
        writeManifest('trading-terminal', 'react', { sourceHash: 'x' });
        writeManifest('trading-terminal', 'angular', { sourceHash: 'x' });
        writeManifest('trading-terminal', 'vue', { sourceHash: 'x' });
        mkdirSync(join(seedsDir, 'trading-terminal', 'typescript'), { recursive: true }); // no manifest yet
        writeFileSync(join(seedsDir, 'project.json'), '{}');

        expect(readPortManifests(seedsDir).map(({ demo, framework }) => `${demo}/${framework}`)).toEqual([
            'trading-terminal/angular',
            'trading-terminal/vue',
        ]);
    });

    it('rejects a manifest that disagrees with its folder', () => {
        writeManifest('trading-terminal', 'angular', { sourceHash: 'x' });
        const path = join(seedsDir, 'trading-terminal', 'angular', '.seed-manifest.json');
        writeFileSync(path, JSON.stringify({ demo: 'procurement', framework: 'angular', sourceHash: 'x' }));

        expect(() => readPortManifests(seedsDir)).toThrow(
            /"demo" is "procurement" but the folder says "trading-terminal"/
        );
    });

    it('is empty when there is no seeds folder', () => {
        expect(readPortManifests(join(seedsDir, 'missing'))).toEqual([]);
    });
});

describe('findStalePorts', () => {
    it('reports only the ports whose recorded hash differs from the current one', () => {
        writeManifest('trading-terminal', 'angular', {
            sourceHash: `${CURRENT_HASH}-trading-terminal`,
            sourceCommit: 'aaa',
        });
        writeManifest('trading-terminal', 'vue', { sourceHash: 'sha256-old', sourceCommit: 'bbb' });
        writeManifest('procurement', 'typescript', { sourceHash: `${CURRENT_HASH}-procurement`, sourceCommit: 'ccc' });

        expect(findStalePorts(options())).toEqual([
            {
                demo: 'trading-terminal',
                framework: 'vue',
                sourceHash: `${CURRENT_HASH}-trading-terminal`,
                manifestHash: 'sha256-old',
                sourceCommit: CURRENT_COMMIT,
                manifestCommit: 'bbb',
            },
        ]);
    });

    it('treats a manifest without a sourceHash as never synced', () => {
        writeManifest('trading-terminal', 'angular', { pinnedVersion: '14.2.0' });

        expect(findStalePorts(options())).toMatchObject([
            { demo: 'trading-terminal', framework: 'angular', manifestHash: null, manifestCommit: null },
        ]);
    });

    it('hashes each demo once however many ports it has', () => {
        writeManifest('trading-terminal', 'angular', { sourceHash: 'old' });
        writeManifest('trading-terminal', 'vue', { sourceHash: 'old' });
        writeManifest('trading-terminal', 'typescript', { sourceHash: 'old' });
        const hashed = [];

        const stale = findStalePorts({ ...options(), hashSource: (demo) => (hashed.push(demo), 'new') });

        expect(stale).toHaveLength(3);
        expect(hashed).toEqual(['trading-terminal']);
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
        const path = writeManifest('trading-terminal', 'vue', {
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
                    demo: 'trading-terminal',
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

describe('findTouchedStalePorts', () => {
    const SEEDS = 'packages/ag-charts-demos/seeds/';
    const stalePort = (demo, framework) => ({
        demo,
        framework,
        sourceHash: 'sha256-now',
        manifestHash: 'sha256-then',
        sourceCommit: 'c0ffee',
        manifestCommit: 'decade',
    });
    const stale = [stalePort('trading-terminal', 'angular'), stalePort('trading-terminal', 'vue')];

    it('reports a stale port the change edits, with the files that touched it', () => {
        const changedFiles = [
            `${SEEDS}trading-terminal/angular/src/app/app.component.ts`,
            `${SEEDS}trading-terminal/angular/src/styles.css`,
            'packages/ag-charts-demos/src/demos/trading-terminal/data.ts',
        ];
        expect(findTouchedStalePorts({ changedFiles, stale })).toEqual([
            { ...stalePort('trading-terminal', 'angular'), files: ['src/app/app.component.ts', 'src/styles.css'] },
        ]);
    });

    it('passes a change that edits only ports that are not stale', () => {
        const changedFiles = [
            `${SEEDS}procurement/angular/src/main.ts`,
            `${SEEDS}trading-terminal/typescript/src/main.ts`,
        ];
        expect(findTouchedStalePorts({ changedFiles, stale })).toEqual([]);
    });

    it('passes a change that leaves the stale ports alone', () => {
        const changedFiles = [
            'packages/ag-charts-demos/src/demos/trading-terminal/data.ts',
            `${SEEDS}trading-terminal/react/src/data.ts`,
        ];
        expect(findTouchedStalePorts({ changedFiles, stale })).toEqual([]);
    });

    it('does not count a pin update, which rewrites every port stale or not', () => {
        const changedFiles = [
            `${SEEDS}trading-terminal/angular/package.json`,
            `${SEEDS}trading-terminal/angular/.seed-manifest.json`,
            `${SEEDS}trading-terminal/vue/package.json`,
        ];
        expect(findTouchedStalePorts({ changedFiles, stale })).toEqual([]);
    });

    it('counts a nested package.json, which no pin update writes', () => {
        const changedFiles = [`${SEEDS}trading-terminal/vue/src/data/package.json`];
        expect(findTouchedStalePorts({ changedFiles, stale })).toEqual([
            { ...stalePort('trading-terminal', 'vue'), files: ['src/data/package.json'] },
        ]);
    });

    it('does not mistake a framework whose name another starts with', () => {
        const changedFiles = [
            `${SEEDS}trading-terminal/angular-signals/src/main.ts`,
            `${SEEDS}trading-terminal/angular.PORTING.md`,
        ];
        expect(findTouchedStalePorts({ changedFiles, stale })).toEqual([]);
    });
});

describe('splitTouchedByBaseStaleness', () => {
    const portAt = (framework, sourceHash, demo = 'web-analytics') => ({ demo, framework, sourceHash });
    const touched = ['angular', 'typescript', 'vue'].map((framework) => ({
        ...portAt(framework, 'sha256-now'),
        files: ['src/main.ts'],
    }));

    it('excuses a port that was stale at the base when the change also moves its demo', () => {
        const staleAtBase = [portAt('angular', 'sha256-base')];
        const { introduced, inherited } = splitTouchedByBaseStaleness({ touched, staleAtBase });

        expect(inherited.map(({ framework }) => framework)).toEqual(['angular']);
        expect(introduced.map(({ framework }) => framework)).toEqual(['typescript', 'vue']);
    });

    it('holds a port stale at the base to the restamp rule when the change leaves its demo alone', () => {
        // An alignment edits only ports that are stale at its base, with the demo untouched.
        const staleAtBase = [portAt('angular', 'sha256-now')];
        const { introduced, inherited } = splitTouchedByBaseStaleness({ touched, staleAtBase });

        expect(inherited).toEqual([]);
        expect(introduced).toEqual(touched);
    });

    it('holds every port to the restamp rule when none was stale at the base', () => {
        const { introduced, inherited } = splitTouchedByBaseStaleness({ touched, staleAtBase: [] });

        expect(introduced).toEqual(touched);
        expect(inherited).toEqual([]);
    });

    it('does not take a same-named framework of another demo for a stale one', () => {
        const staleAtBase = [portAt('angular', 'sha256-base', 'procurement')];

        expect(splitTouchedByBaseStaleness({ touched, staleAtBase }).inherited).toEqual([]);
    });
});

describe('findStalePortsAtBase', () => {
    const DEMOS = ['packages', 'ag-charts-demos', 'src', 'demos'];
    const SEEDS = ['packages', 'ag-charts-demos', 'seeds'];
    let repo;

    const git = (...args) =>
        execFileSync(
            'git',
            ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', '-c', 'commit.gpgsign=false', ...args],
            { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
        );
    const write = (path, content) => {
        const full = join(repo, ...path);
        mkdirSync(join(full, '..'), { recursive: true });
        writeFileSync(full, content);
    };
    const commit = (message) => {
        git('add', '-A');
        git('commit', '-m', message);
    };
    /** Writes a port manifest recording `sourceHash`, or the hash the demo has in the working tree. */
    const stampPort = (demo, framework, sourceHash = hashDemoSource(demo, join(repo, ...DEMOS))) =>
        write([...SEEDS, demo, framework, '.seed-manifest.json'], JSON.stringify({ demo, framework, sourceHash }));

    beforeEach(() => {
        repo = mkdtempSync(join(tmpdir(), 'stale-ports-repo-'));
        git('init', '--quiet');
    });
    afterEach(() => {
        rmSync(repo, { recursive: true, force: true });
    });

    it('reports a port whose manifest was behind its demo at the base, and not one that was in step', () => {
        write([...DEMOS, 'web-analytics', 'index.ts'], 'export const a = 1;\n');
        stampPort('web-analytics', 'angular');
        stampPort('web-analytics', 'vue', 'sha256-from-an-older-demo');
        commit('base');

        expect(findStalePortsAtBase('HEAD', { demoIds: ['web-analytics'], workspaceRoot: repo })).toEqual([
            expect.objectContaining({ demo: 'web-analytics', framework: 'vue' }),
        ]);
    });

    it('judges the port by the base, whatever the working tree has become since', () => {
        write([...DEMOS, 'web-analytics', 'index.ts'], 'export const a = 1;\n');
        stampPort('web-analytics', 'angular');
        commit('base');
        // The change under test moves the demo on and edits the port, without restamping it.
        write([...DEMOS, 'web-analytics', 'index.ts'], 'export const a = 2;\n');
        write([...SEEDS, 'web-analytics', 'angular', 'src', 'main.ts'], 'edited');
        commit('change');

        expect(findStalePortsAtBase('HEAD~1', { demoIds: ['web-analytics'], workspaceRoot: repo })).toEqual([]);
        expect(
            findStalePorts({
                seedsDir: join(repo, ...SEEDS),
                demoIds: ['web-analytics'],
                hashSource: (demo) => hashDemoSource(demo, join(repo, ...DEMOS)),
                readSourceCommit: () => null,
            })
        ).toHaveLength(1);
    });

    it('follows a demo import into a sibling when hashing the base', () => {
        write([...DEMOS, 'procurement', 'index.ts'], "import './map';\nexport {};\n");
        write([...DEMOS, 'procurement', 'map.ts'], "import '../web-analytics/topology';\nexport {};\n");
        write([...DEMOS, 'web-analytics', 'topology.ts'], 'export const t = 1;\n');
        stampPort('procurement', 'vue');
        commit('base');
        write([...DEMOS, 'web-analytics', 'topology.ts'], 'export const t = 2;\n');
        commit('shared module changes');

        expect(findStalePortsAtBase('HEAD~1', { demoIds: ['procurement'], workspaceRoot: repo })).toEqual([]);
        expect(findStalePortsAtBase('HEAD', { demoIds: ['procurement'], workspaceRoot: repo })).toHaveLength(1);
    });

    it('treats a port or demo missing at the base as not stale there', () => {
        write([...DEMOS, 'web-analytics', 'index.ts'], 'export const a = 1;\n');
        stampPort('web-analytics', 'angular', 'sha256-old');
        commit('base');
        write([...DEMOS, 'procurement', 'index.ts'], 'export const p = 1;\n');
        stampPort('procurement', 'vue', 'sha256-old');
        commit('adds a demo and its port');

        const demoIds = ['web-analytics', 'procurement'];
        expect(findStalePortsAtBase('HEAD~1', { demoIds, workspaceRoot: repo }).map(({ demo }) => demo)).toEqual([
            'web-analytics',
        ]);
    });

    it('reports nothing for a base that predates the seeds', () => {
        write(['README.md'], 'hello');
        commit('base');
        write([...DEMOS, 'web-analytics', 'index.ts'], 'export const a = 1;\n');
        stampPort('web-analytics', 'angular', 'sha256-old');
        commit('adds the seeds');

        expect(findStalePortsAtBase('HEAD~1', { demoIds: ['web-analytics'], workspaceRoot: repo })).toEqual([]);
    });

    it('fails on a base git does not know', () => {
        write([...DEMOS, 'web-analytics', 'index.ts'], 'export const a = 1;\n');
        commit('base');

        expect(() => findStalePortsAtBase('no-such-ref', { demoIds: [], workspaceRoot: repo })).toThrow();
    });
});
