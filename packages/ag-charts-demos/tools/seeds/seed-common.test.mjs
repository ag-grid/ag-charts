import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    describePin,
    hashDemoSource,
    listSourceFiles,
    readCommittedPins,
    readDemoSourceCommit,
    readPinnedChartsVersion,
    resolveBranch,
    resolveDemoSources,
    resolveSourceCommit,
} from './seed-common.mjs';

let srcDir;

function write(path, content) {
    mkdirSync(join(srcDir, path, '..'), { recursive: true });
    writeFileSync(join(srcDir, path), content);
}

beforeEach(() => {
    srcDir = mkdtempSync(join(tmpdir(), 'seed-common-'));
    write(
        'alpha/index.tsx',
        "import { world } from '../beta/topology';\nimport './alpha.css';\nexport const a = world;\n"
    );
    write('alpha/alpha.css', '.a { color: red; }\n');
    write('beta/topology.ts', "import { helper } from './lib';\nexport const world = helper();\n");
    write('beta/lib/index.ts', 'export const helper = () => 1;\n');
    write('beta/index.tsx', "import { world } from './topology';\nexport const b = world;\n");
});
afterEach(() => {
    rmSync(srcDir, { recursive: true, force: true });
});

describe('resolveDemoSources', () => {
    it('lists a demo’s own files and the sibling-demo files its imports reach', () => {
        expect(resolveDemoSources('alpha', srcDir)).toEqual({
            files: ['alpha.css', 'index.tsx'],
            vendored: ['beta/lib/index.ts', 'beta/topology.ts'],
        });
    });

    it('vendors nothing for a demo that only imports its own files', () => {
        expect(resolveDemoSources('beta', srcDir).vendored).toEqual([]);
    });

    it('leaves out test files, as the seed does', () => {
        write('alpha/index.test.tsx', "import { a } from './index';\n");
        write('alpha/lib/helper.spec.ts', 'export {};\n');
        expect(resolveDemoSources('alpha', srcDir).files).toEqual(['alpha.css', 'index.tsx']);
    });
});

describe('hashDemoSource', () => {
    it('is stable for unchanged source', () => {
        expect(hashDemoSource('alpha', srcDir)).toBe(hashDemoSource('alpha', srcDir));
        expect(hashDemoSource('alpha', srcDir)).toMatch(/^sha256-[0-9a-f]{64}$/);
    });

    it('changes when a sibling-demo file the demo imports changes', () => {
        const before = hashDemoSource('alpha', srcDir);
        write('beta/lib/index.ts', 'export const helper = () => 2;\n');
        expect(hashDemoSource('alpha', srcDir)).not.toBe(before);
    });

    it('does not change when a sibling-demo file the demo does not import changes', () => {
        const before = hashDemoSource('alpha', srcDir);
        write('beta/index.tsx', "import { world } from './topology';\nexport const b = world + 1;\n");
        expect(hashDemoSource('alpha', srcDir)).toBe(before);
    });

    it('does not change when only a test file changes', () => {
        const before = hashDemoSource('alpha', srcDir);
        write('alpha/index.test.tsx', "it('renders', () => {});\n");
        expect(hashDemoSource('alpha', srcDir)).toBe(before);
    });

    it('does not change when an ignored file appears in a git work tree', () => {
        git(srcDir, 'init', '-q');
        write('.gitignore', '.DS_Store\n');
        const before = hashDemoSource('alpha', srcDir);
        write('alpha/.DS_Store', 'finder metadata');
        expect(hashDemoSource('alpha', srcDir)).toBe(before);
    });
});

function git(cwd, ...args) {
    return execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', ...args], {
        cwd,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
}

describe('listSourceFiles', () => {
    it('lists what git would commit: tracked and untracked files, less ignored and deleted ones', () => {
        git(srcDir, 'init', '-q');
        write('.gitignore', '.DS_Store\ndist/\n');
        write('alpha/gone.ts', 'export {};\n');
        git(srcDir, 'add', '-A');
        git(srcDir, 'commit', '-q', '-m', 'initial');
        rmSync(join(srcDir, 'alpha', 'gone.ts'));
        write('alpha/new-file.ts', 'export {};\n');
        write('alpha/.DS_Store', 'finder metadata');
        write('alpha/dist/bundle.js', 'built');

        expect(listSourceFiles(join(srcDir, 'alpha'))).toEqual(['alpha.css', 'index.tsx', 'new-file.ts']);
    });

    it('walks the folder when it is not inside a git work tree', () => {
        write('alpha/.DS_Store', 'finder metadata');
        expect(listSourceFiles(join(srcDir, 'alpha'))).toEqual(['.DS_Store', 'alpha.css', 'index.tsx']);
    });
});

describe('readDemoSourceCommit', () => {
    let repo;
    let clone;
    beforeEach(() => {
        repo = mkdtempSync(join(tmpdir(), 'seed-common-repo-'));
        clone = mkdtempSync(join(tmpdir(), 'seed-common-clone-'));
        const add = (path, content) => {
            mkdirSync(join(repo, path, '..'), { recursive: true });
            writeFileSync(join(repo, path), content);
        };
        git(repo, 'init', '-q');
        add('src/demos/alpha/index.tsx', 'export default 1;\n');
        git(repo, 'add', '-A');
        git(repo, 'commit', '-q', '-m', 'Add alpha');
        add('README.md', 'unrelated\n');
        git(repo, 'add', '-A');
        git(repo, 'commit', '-q', '-m', 'Unrelated change');
    });
    afterEach(() => {
        rmSync(repo, { recursive: true, force: true });
        rmSync(clone, { recursive: true, force: true });
    });

    it('names the last commit that touched the demo, ignoring test-only commits', () => {
        const [touched] = git(repo, 'log', '--format=%H', '--', 'src/demos/alpha').split('\n');
        mkdirSync(join(repo, 'src/demos/alpha/lib'), { recursive: true });
        writeFileSync(join(repo, 'src/demos/alpha/lib/index.test.tsx'), "it('renders', () => {});\n");
        git(repo, 'add', '-A');
        git(repo, 'commit', '-q', '-m', 'Test alpha');
        expect(readDemoSourceCommit('alpha', { demosRoot: repo })).toBe(touched);
    });

    it('does not mistake the boundary of a shallow clone for the change', () => {
        execFileSync('git', ['clone', '-q', '--depth', '1', `file://${repo}`, clone], { stdio: 'ignore' });
        expect(readDemoSourceCommit('alpha', { demosRoot: clone })).toBeNull();
    });
});

describe('resolveSourceCommit', () => {
    it('keeps the recorded commit while the source hash is unchanged', () => {
        const readSourceCommit = vi.fn(() => 'shallow-head');
        expect(
            resolveSourceCommit(
                'alpha',
                'sha256-a',
                { sourceHash: 'sha256-a', sourceCommit: 'synced' },
                readSourceCommit
            )
        ).toBe('synced');
        expect(readSourceCommit).not.toHaveBeenCalled();
    });

    it('reads the history when the source moved, or nothing was recorded', () => {
        const readSourceCommit = vi.fn(() => 'latest-change');
        expect(
            resolveSourceCommit(
                'alpha',
                'sha256-b',
                { sourceHash: 'sha256-a', sourceCommit: 'synced' },
                readSourceCommit
            )
        ).toBe('latest-change');
        expect(resolveSourceCommit('alpha', 'sha256-b', null, readSourceCommit)).toBe('latest-change');
        expect(
            resolveSourceCommit('alpha', 'sha256-b', { sourceHash: 'sha256-b', sourceCommit: null }, readSourceCommit)
        ).toBe('latest-change');
    });
});

describe('resolveBranch', () => {
    const noGit = () => {
        throw new Error('the checked-out branch must not be read');
    };

    it('takes AG_CHARTS_SEED_BRANCH ahead of every CI variable', () => {
        const env = { AG_CHARTS_SEED_BRANCH: 'b14.3.0', GITHUB_BASE_REF: 'latest', GITHUB_REF_NAME: 'latest' };
        expect(resolveBranch({ env, readGitBranch: noGit })).toBe('b14.3.0');
    });

    it('takes a pull request’s base branch, not its merge ref', () => {
        const env = { GITHUB_BASE_REF: 'b14.2.0', GITHUB_REF_NAME: '8310/merge' };
        expect(resolveBranch({ env, readGitBranch: noGit })).toBe('b14.2.0');
    });

    it('takes the pushed branch in any other workflow run', () => {
        const env = { GITHUB_BASE_REF: '', GITHUB_REF_NAME: 'b14.2.0' };
        expect(resolveBranch({ env, readGitBranch: noGit })).toBe('b14.2.0');
    });

    it('takes the checked-out branch outside a workflow', () => {
        expect(resolveBranch({ env: {}, readGitBranch: () => 'ag-18147/fix-tooling' })).toBe('ag-18147/fix-tooling');
    });

    it('is null for a detached HEAD, or no git work tree, with no variable set', () => {
        expect(resolveBranch({ env: {}, readGitBranch: () => 'HEAD' })).toBeNull();
        expect(resolveBranch({ env: {}, readGitBranch: () => null })).toBeNull();
    });
});

describe('readPinnedChartsVersion', () => {
    const BETA = '14.3.0-beta.20260920';
    let seedsDir;

    /** A committed seed: its package.json's `ag-charts-*` dependencies and its manifest's pin fields. */
    function writeSeed(seed, { pins, pinnedVersion, pinSource }) {
        const dir = join(seedsDir, seed);
        mkdirSync(dir, { recursive: true });
        const [demo, framework] = seed.split('/');
        writeFileSync(join(dir, 'package.json'), JSON.stringify({ dependencies: { react: '^19.0.0', ...pins } }));
        writeFileSync(
            join(dir, '.seed-manifest.json'),
            JSON.stringify({ demo, framework, pinnedVersion, pinSource, sourceHash: 'sha256-x' })
        );
    }

    /** Every seed of two demos pinning `version` throughout, as a merge-back or a bump leaves them. */
    function writeSeeds(version, pinSource) {
        for (const seed of ['financial/react', 'financial/angular', 'procurement/vue']) {
            const pins = { 'ag-charts-community': version, 'ag-charts-enterprise': version };
            writeSeed(seed, { pins, pinnedVersion: version, pinSource });
        }
    }

    const pinFor = (workspaceVersion, options) => readPinnedChartsVersion({ workspaceVersion, seedsDir, ...options });

    beforeEach(() => {
        seedsDir = mkdtempSync(join(tmpdir(), 'seed-pins-'));
        writeFileSync(join(seedsDir, 'project.json'), '{}');
    });
    afterEach(() => {
        rmSync(seedsDir, { recursive: true, force: true });
        vi.unstubAllEnvs();
    });

    it('pins a plain release version exactly, whatever the seeds carry and even without a reset', () => {
        writeSeeds('latest', 'dist-tag');
        const expected = { pinnedVersion: '14.2.0', pinSource: 'release', reason: 'workspace version 14.2.0' };
        expect(pinFor('14.2.0')).toEqual(expected);
        expect(pinFor('14.2.0', { reset: true })).toEqual(expected);

        writeSeeds('14.1.0', 'release');
        expect(pinFor('14.2.0')).toEqual(expected);
    });

    it('pins the npm latest dist-tag for a pre-release, on a release branch or a pull request into one too', () => {
        writeSeeds('latest', 'dist-tag');
        vi.stubEnv('AG_CHARTS_SEED_BRANCH', 'b14.2.0');
        vi.stubEnv('GITHUB_BASE_REF', 'b14.2.0');
        vi.stubEnv('GITHUB_REF_NAME', 'b14.2.0');

        expect(pinFor('14.2.0-beta.20260920.1405')).toEqual({
            pinnedVersion: 'latest',
            pinSource: 'dist-tag',
            reason: 'npm dist-tag: workspace version 14.2.0-beta.20260920.1405 is a pre-release, which public npm does not have',
        });
    });

    it('pins the dist-tag for a pre-release when there are no seeds yet', () => {
        rmSync(seedsDir, { recursive: true, force: true });
        expect(pinFor(BETA)).toMatchObject({ pinnedVersion: 'latest', pinSource: 'dist-tag' });
    });

    it('keeps a release that every seed carries in from a merge-back', () => {
        writeSeeds('14.2.0', 'release');

        const pin = pinFor(BETA);
        expect(pin).toEqual({
            pinnedVersion: '14.2.0',
            pinSource: 'release',
            reason: 'release carried in by a merge-back; the next beta bump restores latest',
        });
        expect(describePin(pin)).toBe(
            '14.2.0 (release carried in by a merge-back; the next beta bump restores latest)'
        );
    });

    it('puts the dist-tag back over a carried-in release on a reset', () => {
        writeSeeds('14.2.0', 'release');

        expect(pinFor(BETA, { reset: true })).toEqual({
            pinnedVersion: 'latest',
            pinSource: 'dist-tag',
            reason: `npm dist-tag: workspace version ${BETA} is a pre-release, which public npm does not have; --reset-pin replaces the carried-in 14.2.0`,
        });
    });

    it('pins the dist-tag, naming what each seed carries, when the seeds mix a release with the dist-tag', () => {
        writeSeeds('latest', 'dist-tag');
        writeSeed('procurement/vue', {
            pins: { 'ag-charts-vue3': '14.2.0', 'ag-charts-enterprise': '14.2.0' },
            pinnedVersion: '14.2.0',
            pinSource: 'release',
        });

        const pin = pinFor(BETA);
        expect(pin).toMatchObject({ pinnedVersion: 'latest', pinSource: 'dist-tag' });
        expect(pin.reason).toBe(
            `npm dist-tag: workspace version ${BETA} is a pre-release, which public npm does not have; a release carried in by a merge-back is kept only when every seed pins the same plain X.Y.Z, but the seeds pin latest with pinSource dist-tag in financial/angular, financial/react; 14.2.0 with pinSource release in procurement/vue`
        );
    });

    it('keeps no release that the seeds disagree on, or that one seed pins only in part', () => {
        writeSeeds('14.2.0', 'release');
        writeSeed('procurement/vue', {
            pins: { 'ag-charts-vue3': 'latest', 'ag-charts-enterprise': 'latest' },
            pinnedVersion: 'latest',
            pinSource: 'dist-tag',
        });
        expect(pinFor(BETA).pinnedVersion).toBe('latest');

        writeSeed('procurement/vue', {
            pins: { 'ag-charts-vue3': '14.2.1', 'ag-charts-enterprise': '14.2.1' },
            pinnedVersion: '14.2.1',
            pinSource: 'release',
        });
        expect(pinFor(BETA).pinnedVersion).toBe('latest');

        writeSeed('procurement/vue', {
            pins: { 'ag-charts-vue3': '14.2.0', 'ag-charts-enterprise': 'latest' },
            pinnedVersion: '14.2.0',
            pinSource: 'release',
        });
        expect(pinFor(BETA).reason).toMatch(
            /but the seeds pin .*; 14\.2\.0 and latest with pinSource release in procurement\/vue$/
        );
    });

    it('keeps no carried-in release whose manifests do not record it as a release', () => {
        writeSeeds('14.2.0', 'release');
        writeSeed('financial/angular', {
            pins: { 'ag-charts-angular': '14.2.0' },
            pinnedVersion: '14.2.0',
            pinSource: 'dist-tag',
        });
        expect(pinFor(BETA).pinnedVersion).toBe('latest');

        writeSeed('financial/angular', { pins: { 'ag-charts-angular': '14.2.0' }, pinSource: 'release' });
        expect(pinFor(BETA).reason).toMatch(
            /14\.2\.0 and no pinnedVersion with pinSource release in financial\/angular/
        );
    });

    it('keeps no pre-release pin, however consistently the seeds carry it', () => {
        writeSeeds('14.3.0-beta.1', 'release');

        const pin = pinFor(BETA);
        expect(pin).toMatchObject({ pinnedVersion: 'latest', pinSource: 'dist-tag' });
        expect(pin.reason).toMatch(/but the seeds pin 14\.3\.0-beta\.1 with pinSource release in /);
    });

    it('rejects a workspace version with no X.Y.Z release part', () => {
        expect(() => pinFor('14.2-beta.1')).toThrow(/is not X\.Y\.Z/);
    });
});

describe('readCommittedPins', () => {
    it('reads every seed with a manifest, the React seed included, and skips anything else', () => {
        const seedsDir = mkdtempSync(join(tmpdir(), 'seed-pins-'));
        try {
            const write = (path, value) => {
                mkdirSync(join(seedsDir, path, '..'), { recursive: true });
                writeFileSync(join(seedsDir, path), JSON.stringify(value));
            };
            write('project.json', {});
            write('financial/react/package.json', {
                dependencies: { 'ag-charts-community': 'latest', react: '^19.0.0' },
                devDependencies: { 'ag-charts-types': '14.2.0' },
            });
            write('financial/react/.seed-manifest.json', { pinnedVersion: 'latest', pinSource: 'dist-tag' });
            write('financial/vue/.seed-manifest.json', {});
            write('financial/notes/package.json', { dependencies: { 'ag-charts-community': '1.0.0' } });

            expect(readCommittedPins(seedsDir)).toEqual([
                { seed: 'financial/react', versions: ['14.2.0', 'latest'], pinSource: 'dist-tag' },
                { seed: 'financial/vue', versions: [null], pinSource: null },
            ]);
        } finally {
            rmSync(seedsDir, { recursive: true, force: true });
        }
    });
});

describe('describePin', () => {
    it('names the pin and why it was chosen, or its source when no reason is given', () => {
        expect(describePin({ pinnedVersion: '14.2.0', pinSource: 'release', reason: 'workspace version 14.2.0' })).toBe(
            '14.2.0 (workspace version 14.2.0)'
        );
        expect(describePin({ pinnedVersion: 'latest', pinSource: 'dist-tag' })).toBe('latest (dist-tag)');
    });
});
