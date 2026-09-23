import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    describePin,
    hashDemoSource,
    listSourceFiles,
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
    const BETA = '14.2.0-beta.20260920';
    const pinFor = (workspaceVersion, env, gitBranch = 'HEAD') =>
        readPinnedChartsVersion({ workspaceVersion, env, readGitBranch: () => gitBranch });

    it('pins the release on its release branch while the workspace still carries the beta', () => {
        expect(pinFor(BETA, { GITHUB_REF_NAME: 'b14.2.0' })).toEqual({
            pinnedVersion: '14.2.0',
            pinSource: 'release',
            reason: 'release branch b14.2.0',
        });
        expect(pinFor('14.2.0-beta.20260920.1405', {}, 'b14.2.0').pinnedVersion).toBe('14.2.0');
    });

    it('pins the release for a pull request into its release branch', () => {
        const pin = pinFor(BETA, { GITHUB_BASE_REF: 'b14.2.0', GITHUB_REF_NAME: '8310/merge' });
        expect(pin).toMatchObject({ pinnedVersion: '14.2.0', pinSource: 'release' });
    });

    it('pins a plain release version exactly whatever the branch, without reading it', () => {
        const pin = readPinnedChartsVersion({
            workspaceVersion: '14.2.0',
            env: { GITHUB_REF_NAME: 'latest' },
            readGitBranch: () => {
                throw new Error('the branch must not be read');
            },
        });
        expect(pin).toEqual({ pinnedVersion: '14.2.0', pinSource: 'release', reason: 'workspace version 14.2.0' });
    });

    it('pins the npm latest dist-tag on latest, next, feature branches and pull requests into them', () => {
        for (const env of [
            { GITHUB_REF_NAME: 'latest' },
            { GITHUB_REF_NAME: 'next' },
            { GITHUB_BASE_REF: 'latest', GITHUB_REF_NAME: '8310/merge' },
        ]) {
            expect(pinFor(BETA, env)).toMatchObject({ pinnedVersion: 'latest', pinSource: 'dist-tag' });
        }
        expect(pinFor(BETA, {}, 'ag-18147/fix-tooling')).toEqual({
            pinnedVersion: 'latest',
            pinSource: 'dist-tag',
            reason: 'branch ag-18147/fix-tooling',
        });
    });

    it('pins the dist-tag when no branch can be told', () => {
        expect(pinFor(BETA, {}, 'HEAD')).toEqual({
            pinnedVersion: 'latest',
            pinSource: 'dist-tag',
            reason: 'no branch checked out',
        });
    });

    it('takes only an exact bX.Y.Z as a release branch', () => {
        for (const branch of ['b14.2', 'b14.2.x', 'release/b14.2.0', 'b14.2.0-fix']) {
            expect(pinFor(BETA, { GITHUB_REF_NAME: branch }).pinSource).toBe('dist-tag');
        }
    });

    it('rejects a workspace version with no X.Y.Z release part', () => {
        expect(() => pinFor('14.2-beta.1', {})).toThrow(/is not X\.Y\.Z/);
    });
});

describe('describePin', () => {
    it('names the pin, its source and the reason', () => {
        expect(describePin({ pinnedVersion: '14.2.0', pinSource: 'release', reason: 'release branch b14.2.0' })).toBe(
            '14.2.0 (release: release branch b14.2.0)'
        );
        expect(describePin({ pinnedVersion: 'latest', pinSource: 'dist-tag' })).toBe('latest (dist-tag)');
    });
});
