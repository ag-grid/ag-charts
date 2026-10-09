import { spawnSync } from 'node:child_process';
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * Runs the shell of `.github/workflows/demo-seeds-mirror.yml` as the workflow would, against a local
 * bare repository standing in for `ag-grid/ag-charts-demos`, to check which mirror refs each trigger
 * moves: `staging` after the staging deploy, `bX.Y.Z` on a push of that branch, `release-X.Y.Z` and
 * the default branch `latest` only on a release tag, and nothing from a push to ag-charts `latest`.
 */

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const WORKFLOWS = join(REPO_ROOT, '.github', 'workflows');
const MIRROR_WORKFLOW = readFileSync(join(WORKFLOWS, 'demo-seeds-mirror.yml'), 'utf8');
const CI_WORKFLOW = readFileSync(join(WORKFLOWS, 'ci.yml'), 'utf8');
const CONSTANTS = join(REPO_ROOT, 'packages', 'ag-charts-website', 'src', 'constants.ts');
const MIRROR_URL = 'https://x-access-token:token@github.com/ag-grid/ag-charts-demos.git';

/** The `run:` script of the step named `name`: the block after its `run: |`, dedented. */
function stepScript(workflow, name) {
    const lines = workflow.split('\n');
    const start = lines.findIndex((line) => line.trim() === `- name: ${name}`);
    if (start === -1) throw new Error(`No step "${name}"`);
    const runIndex = lines.findIndex((line, index) => index > start && /^\s*run: \|\s*$/.test(line));
    if (runIndex === -1) throw new Error(`Step "${name}" has no run block`);
    const indent = lines[runIndex].match(/^\s*/)[0].length;
    const body = [];
    for (const line of lines.slice(runIndex + 1)) {
        if (line.trim() !== '' && line.match(/^\s*/)[0].length <= indent) break;
        body.push(line.slice(indent + 2));
    }
    return body.join('\n');
}

/** The text of the top-level job `name` of a workflow, up to the next job. */
function jobBlock(workflow, name) {
    const lines = workflow.split('\n');
    const start = lines.findIndex((line) => line === `    ${name}:`);
    if (start === -1) throw new Error(`No job "${name}"`);
    const end = lines.findIndex(
        (line, index) => index > start && /^ {4}\S/.test(line) && !line.trimStart().startsWith('#')
    );
    return lines.slice(start, end === -1 ? undefined : end).join('\n');
}

const git = (cwd, ...args) => {
    const result = spawnSync('git', args, {
        cwd,
        encoding: 'utf8',
        env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null' },
    });
    if (result.status !== 0) throw new Error(`git ${args.join(' ')}: ${result.stderr}`);
    return result.stdout.trim();
};

let work;
let checkout;
let mirror;

beforeEach(() => {
    work = mkdtempSync(join(tmpdir(), 'mirror-workflow-'));
    // What the sparse checkout of the workflow's first step leaves.
    checkout = join(work, 'checkout');
    mkdirSync(join(checkout, 'packages/ag-charts-demos/seeds'), { recursive: true });
    mkdirSync(join(checkout, 'packages/ag-charts-website/src'), { recursive: true });
    copyFileSync(CONSTANTS, join(checkout, 'packages/ag-charts-website/src/constants.ts'));
    mirror = join(work, 'mirror.git');
});
afterEach(() => {
    rmSync(work, { recursive: true, force: true });
});

describe('Resolve the mirror branch', () => {
    const script = stepScript(MIRROR_WORKFLOW, 'Resolve the mirror branch');

    function resolve({ refType = 'branch', refName, target = '' }) {
        const output = join(work, 'github-output');
        writeFileSync(output, '');
        const result = spawnSync('bash', ['-c', script], {
            cwd: checkout,
            encoding: 'utf8',
            env: {
                PATH: process.env.PATH,
                REF_TYPE: refType,
                REF_NAME: refName,
                TARGET: target,
                GITHUB_OUTPUT: output,
                GITHUB_STEP_SUMMARY: join(work, 'summary'),
            },
        });
        const outputs = Object.fromEntries(
            readFileSync(output, 'utf8')
                .split('\n')
                .filter(Boolean)
                .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)])
        );
        return { status: result.status, outputs, stdout: result.stdout };
    }

    it('syncs staging, with the tarballs the staging site serves, after the staging deploy', () => {
        const { status, outputs } = resolve({ refName: 'latest', target: 'staging' });

        expect(status).toBe(0);
        expect(outputs).toEqual({
            branch: 'staging',
            'charts-build': 'https://charts-staging.ag-grid.com/npm-packages',
        });
    });

    it('syncs bX.Y.Z on a push of that branch, with the tarballs of the archive for that version', () => {
        const { status, outputs } = resolve({ refName: 'b14.2.0' });

        expect(status).toBe(0);
        expect(outputs).toEqual({
            branch: 'b14.2.0',
            'charts-build': 'https://www.ag-grid.com/charts/archive/14.2.0/npm-packages',
        });
    });

    it('syncs a release tag to its release branch and tag, with no tarballs: the tagged seeds pin npm', () => {
        const { status, outputs } = resolve({ refType: 'tag', refName: 'release-14.2.0' });

        expect(status).toBe(0);
        expect(outputs).toEqual({ branch: 'b14.2.0', tag: 'release-14.2.0' });
    });

    it('syncs nothing from a push to ag-charts latest: the mirror default branch moves only on release', () => {
        const { status, outputs, stdout } = resolve({ refName: 'latest' });

        expect(status).not.toBe(0);
        expect(outputs).toEqual({});
        expect(stdout).toContain('Nothing to mirror from latest');
    });

    it('refuses a target it does not know', () => {
        const { status, outputs, stdout } = resolve({ refName: 'latest', target: 'production' });

        expect(status).not.toBe(0);
        expect(outputs).toEqual({});
        expect(stdout).toContain("Unknown target 'production'");
    });

    it('skips a ref that carries no seeds', () => {
        rmSync(join(checkout, 'packages/ag-charts-demos/seeds'), { recursive: true });

        expect(resolve({ refName: 'b13.0.0' })).toMatchObject({ status: 0, outputs: { skip: 'true' } });
    });
});

describe('the triggers', () => {
    it('does not run on a push to latest, only on release branches and release tags', () => {
        const on = MIRROR_WORKFLOW.slice(MIRROR_WORKFLOW.indexOf('\non:\n'), MIRROR_WORKFLOW.indexOf('\nconcurrency:'));
        const patterns = [...on.matchAll(/^\s+- '([^']+)'/gm)].map(([, pattern]) => pattern);

        expect(patterns).toEqual(['b[0-9][0-9]?.[0-9][0-9]?.[0-9][0-9]?', 'release-*']);
        expect(on).toContain('workflow_call');
    });

    it('is called by CI only on latest, after a successful staging deploy, for the staging target', () => {
        const job = jobBlock(CI_WORKFLOW, 'sync_demo_seeds_staging');

        expect(job).toMatch(/needs: \[report\]/);
        expect(job).toContain("github.ref == 'refs/heads/latest'");
        expect(job).toContain("needs.report.outputs.staging_deployed == 'true'");
        expect(job).toContain('uses: ./.github/workflows/demo-seeds-mirror.yml');
        expect(job).toMatch(/target: staging/);
        expect(jobBlock(CI_WORKFLOW, 'report')).toContain(
            "staging_deployed: ${{ steps.deploy_to_staging.outcome == 'success' }}"
        );
    });
});

describe('Export the mirror tree', () => {
    const script = stepScript(MIRROR_WORKFLOW, 'Export the mirror tree');

    function exportArgs(chartsBuild) {
        const bin = join(work, 'bin');
        mkdirSync(bin);
        const recorded = join(work, 'node-args');
        writeFileSync(join(bin, 'node'), `#!/bin/bash\nprintf '%s\\n' "$@" > "${recorded}"\n`);
        chmodSync(join(bin, 'node'), 0o755);
        const result = spawnSync('bash', ['-c', script], {
            cwd: checkout,
            encoding: 'utf8',
            env: {
                PATH: `${bin}:${process.env.PATH}`,
                RUNNER_TEMP: work,
                REF_NAME: 'b14.2.0',
                CHARTS_BUILD: chartsBuild,
            },
        });
        expect(result.status).toBe(0);
        return readFileSync(recorded, 'utf8').trim().split('\n').slice(1);
    }

    it('passes --charts-build when the target resolves a tarball base', () => {
        expect(exportArgs('https://www.ag-grid.com/charts/archive/14.2.0/npm-packages')).toEqual([
            '--out',
            join(work, 'export'),
            '--ref',
            'b14.2.0',
            '--charts-build',
            'https://www.ag-grid.com/charts/archive/14.2.0/npm-packages',
        ]);
    });

    it('exports without --charts-build for a release tag, whose seeds are not rewritten', () => {
        expect(exportArgs('')).toEqual(['--out', join(work, 'export'), '--ref', 'b14.2.0']);
    });
});

describe('Sync the mirror', () => {
    const script = stepScript(MIRROR_WORKFLOW, 'Sync the mirror');

    /** The mirror as it stands before a run: `latest` holds the released seeds, plus any `extra` branches. */
    function seedMirror(extra = {}) {
        git(work, 'init', '--quiet', '--bare', '--initial-branch=latest', mirror);
        const scratch = join(work, 'scratch');
        git(work, 'clone', '--quiet', mirror, scratch);
        git(scratch, 'config', 'user.name', 'test');
        git(scratch, 'config', 'user.email', 'test@example.com');
        writeFileSync(join(scratch, 'package.json'), 'released\n');
        git(scratch, 'add', '-A');
        git(scratch, 'commit', '--quiet', '-m', 'release');
        git(scratch, 'push', '--quiet', 'origin', 'HEAD:refs/heads/latest');
        for (const [branch, content] of Object.entries(extra)) {
            git(scratch, 'checkout', '--quiet', '-B', branch, 'origin/latest');
            writeFileSync(join(scratch, 'package.json'), content);
            git(scratch, 'commit', '--quiet', '-am', branch);
            git(scratch, 'push', '--quiet', 'origin', `HEAD:refs/heads/${branch}`);
        }
    }

    const tip = (ref) => git(mirror, 'rev-parse', '--verify', '--quiet', ref);
    const content = (ref) => git(mirror, 'show', `${ref}:package.json`);
    const refs = () => git(mirror, 'for-each-ref', '--format=%(refname:short)').split('\n');

    const SHA = (digit) => digit.repeat(40);

    /**
     * Stand-ins, first on the PATH, for what the step asks of the network: `sleep` returns at once,
     * `npm view <package>@<version>` answers unless `<package>@<version>` is among `unpublished`
     * (until it has been asked about `appearsAfter` times), and `gh api .../compare/<base>...<head>`
     * answers `compare`.
     */
    function stubBin({ unpublished, appearsAfter, compare }) {
        const bin = join(work, 'stubs');
        mkdirSync(bin, { recursive: true });
        const stub = (name, body) => {
            writeFileSync(join(bin, name), `#!/bin/bash\n${body}\n`);
            chmodSync(join(bin, name), 0o755);
        };
        stub('sleep', 'exit 0');
        const asked = join(work, 'npm-asked');
        mkdirSync(asked, { recursive: true });
        stub(
            'npm',
            [
                `case " ${unpublished.join(' ')} " in *" $2 "*)`,
                `    n=$(cat '${asked}'/"$2" 2> /dev/null || echo 0)`,
                `    echo $((n + 1)) > '${asked}'/"$2"`,
                `    [ "$n" -ge ${appearsAfter} ] || exit 1;;`,
                'esac',
                `printf '%s\\n' "\${2##*@}"`,
            ].join('\n')
        );
        stub('gh', `printf '%s\\n' "${compare}"`);
        return bin;
    }

    /**
     * Runs the step on a fresh runner, with the export folder holding `exported`. `source` is the
     * commit of ag-charts the run is for, `unpublished` the `package@version` that npm does not yet
     * serve, and `compare` what GitHub says of the commit the mirror's `staging` holds relative to it.
     */
    function sync({
        branch,
        tag = '',
        exported,
        path = process.env.PATH,
        source = 'abc',
        unpublished = [],
        appearsAfter = Infinity,
        compare = 'behind',
    }) {
        rmSync(join(work, 'export'), { recursive: true, force: true });
        rmSync(join(work, 'mirror'), { recursive: true, force: true });
        mkdirSync(join(work, 'export'), { recursive: true });
        writeFileSync(join(work, 'export', 'package.json'), exported);
        return spawnSync('bash', ['-c', script], {
            encoding: 'utf8',
            env: {
                PATH: `${stubBin({ unpublished, appearsAfter, compare })}:${path}`,
                HOME: work,
                RUNNER_TEMP: work,
                MIRROR_REPOSITORY: 'ag-grid/ag-charts-demos',
                GH_TOKEN: 'token',
                MIRROR_BRANCH: branch,
                MIRROR_TAG: tag,
                SOURCE: `ag-grid/ag-charts@${source} (test)`,
                GITHUB_SHA: source,
                GITHUB_REPOSITORY: 'ag-grid/ag-charts',
                SOURCE_TOKEN: 'source-token',
                GITHUB_STEP_SUMMARY: join(work, 'summary'),
                GIT_CONFIG_GLOBAL: '/dev/null',
                GIT_CONFIG_COUNT: '1',
                GIT_CONFIG_KEY_0: `url.${mirror}.insteadOf`,
                GIT_CONFIG_VALUE_0: MIRROR_URL,
            },
        });
    }

    it('creates the staging branch from the staging export and leaves the default branch where it is', () => {
        seedMirror();
        const latest = tip('latest');

        const result = sync({ branch: 'staging', exported: 'staging build\n' });

        expect(result.status, result.stderr).toBe(0);
        expect(content('staging')).toBe('staging build');
        expect(tip('latest')).toBe(latest);
        expect(refs().filter((ref) => ref.startsWith('release-'))).toEqual([]);
    });

    it('moves staging on to each deploy, and commits nothing when the seeds did not change', () => {
        seedMirror();
        sync({ branch: 'staging', exported: 'build 1\n' });
        const first = tip('staging');

        expect(sync({ branch: 'staging', exported: 'build 1\n' }).status).toBe(0);
        expect(tip('staging')).toBe(first);

        expect(sync({ branch: 'staging', exported: 'build 2\n' }).status).toBe(0);
        expect(content('staging')).toBe('build 2');
        expect(git(mirror, 'rev-parse', 'staging^')).toBe(first);
    });

    describe('staging after a retry', () => {
        it('leaves staging alone when a run for an older commit is re-run after a newer one synced it', () => {
            seedMirror();
            expect(sync({ branch: 'staging', exported: 'build B\n', source: SHA('b') }).status).toBe(0);
            const staging = tip('staging');

            // GitHub says the commit staging holds (B) is ahead of the one being re-run (A).
            const result = sync({ branch: 'staging', exported: 'build A\n', source: SHA('a'), compare: 'ahead' });

            expect(result.status, result.stderr).toBe(0);
            expect(result.stdout).toContain('Mirror staging left as it is');
            expect(tip('staging')).toBe(staging);
            expect(content('staging')).toBe('build B');
        });

        it('moves staging on to a newer commit', () => {
            seedMirror();
            sync({ branch: 'staging', exported: 'build A\n', source: SHA('a') });

            const result = sync({ branch: 'staging', exported: 'build B\n', source: SHA('b'), compare: 'behind' });

            expect(result.status, result.stderr).toBe(0);
            expect(content('staging')).toBe('build B');
        });

        it('syncs a re-run of the commit staging already holds', () => {
            seedMirror();
            sync({ branch: 'staging', exported: 'build A\n', source: SHA('a') });

            const result = sync({
                branch: 'staging',
                exported: 'build A, again\n',
                source: SHA('a'),
                compare: 'ahead',
            });

            expect(result.status, result.stderr).toBe(0);
            expect(content('staging')).toBe('build A, again');
        });

        it('does not apply to a release branch, whose pushes are ordered by the branch itself', () => {
            seedMirror({ 'b14.2.0': 'archive build\n' });

            const result = sync({
                branch: 'b14.2.0',
                exported: 'archive build 2\n',
                source: SHA('a'),
                compare: 'ahead',
            });

            expect(result.status, result.stderr).toBe(0);
            expect(content('b14.2.0')).toBe('archive build 2');
        });
    });

    it('syncs a release branch without touching the default branch or staging', () => {
        seedMirror({ staging: 'staging build\n' });
        const [latest, staging] = [tip('latest'), tip('staging')];

        const result = sync({ branch: 'b14.2.0', exported: 'archive build\n' });

        expect(result.status, result.stderr).toBe(0);
        expect(content('b14.2.0')).toBe('archive build');
        expect([tip('latest'), tip('staging')]).toEqual([latest, staging]);
    });

    describe('on a release tag', () => {
        it('tags the head of the release branch when it already holds the released seeds, and moves latest to them', () => {
            seedMirror({ 'b14.2.0': 'released 14.2.0\n' });
            const branchHead = tip('b14.2.0');

            const result = sync({ branch: 'b14.2.0', tag: 'release-14.2.0', exported: 'released 14.2.0\n' });

            expect(result.status, result.stderr).toBe(0);
            expect(tip('b14.2.0')).toBe(branchHead);
            expect(tip('release-14.2.0^{commit}')).toBe(branchHead);
            expect(content('latest')).toBe('released 14.2.0');
        });

        it('tags a commit on top of the release branch when it holds rewritten seeds, without moving the branch', () => {
            seedMirror({ 'b14.2.0': 'archive build\n' });
            const branchHead = tip('b14.2.0');

            const result = sync({ branch: 'b14.2.0', tag: 'release-14.2.0', exported: 'released 14.2.0\n' });

            expect(result.status, result.stderr).toBe(0);
            expect(tip('b14.2.0')).toBe(branchHead);
            expect(git(mirror, 'rev-parse', 'release-14.2.0^{commit}^')).toBe(branchHead);
            expect(content('release-14.2.0')).toBe('released 14.2.0');
            expect(content('latest')).toBe('released 14.2.0');
        });

        it('leaves the default branch alone for a release older than the newest one tagged', () => {
            seedMirror();
            expect(sync({ branch: 'b14.2.0', tag: 'release-14.2.0', exported: 'released 14.2.0\n' }).status).toBe(0);
            const latest = tip('latest');

            const result = sync({ branch: 'b14.1.3', tag: 'release-14.1.3', exported: 'released 14.1.3\n' });

            expect(result.status, result.stderr).toBe(0);
            expect(tip('release-14.1.3')).not.toBe('');
            expect(tip('latest')).toBe(latest);
            expect(content('latest')).toBe('released 14.2.0');
        });

        it('leaves the default branch to a newer release that tagged and moved it while this run was pushing', () => {
            seedMirror();
            // The commit the run of release-14.3.0 would push to latest, made ahead of time (a hook
            // cannot write objects that outlive the push it rejects).
            const racer = join(work, 'racer');
            git(work, 'clone', '--quiet', mirror, racer);
            git(racer, 'config', 'user.name', 'test');
            git(racer, 'config', 'user.email', 'test@example.com');
            writeFileSync(join(racer, 'package.json'), 'released 14.3.0\n');
            git(racer, 'commit', '--quiet', '-am', 'release 14.3.0');
            git(racer, 'push', '--quiet', 'origin', 'HEAD:refs/heads/racer');
            const newer = git(racer, 'rev-parse', 'HEAD');
            // Stands in for that run: on the first push to latest it tags the release, moves latest to
            // its seeds and rejects the push, as the real run's own push would have. (Ref updates are
            // forbidden in a hook's quarantine environment unless that is unset.)
            const marker = join(work, 'raced');
            const hook = join(mirror, 'hooks', 'pre-receive');
            writeFileSync(
                hook,
                [
                    '#!/bin/sh',
                    'while read old new ref; do',
                    `  if [ "$ref" = refs/heads/latest ] && [ ! -e '${marker}' ]; then`,
                    `    touch '${marker}'`,
                    `    env -u GIT_QUARANTINE_PATH git update-ref refs/tags/release-14.3.0 ${newer}`,
                    `    env -u GIT_QUARANTINE_PATH git update-ref refs/heads/latest ${newer}`,
                    '    exit 1',
                    '  fi',
                    'done',
                    '',
                ].join('\n')
            );
            chmodSync(hook, 0o755);

            const result = sync({ branch: 'b14.2.1', tag: 'release-14.2.1', exported: 'released 14.2.1\n' });

            expect(result.status, result.stderr).toBe(0);
            expect(content('latest')).toBe('released 14.3.0');
            expect(result.stdout).toContain('Push rejected');
            expect(result.stdout).toContain('is older than the newest release tagged there (release-14.3.0)');
            expect(tip('release-14.2.1')).not.toBe('');
        });

        it('leaves the default branch to a newer release that tagged and moved it between the order check and the build', () => {
            seedMirror();
            const racer = join(work, 'racer');
            git(work, 'clone', '--quiet', mirror, racer);
            git(racer, 'config', 'user.name', 'test');
            git(racer, 'config', 'user.email', 'test@example.com');
            writeFileSync(join(racer, 'package.json'), 'released 14.3.0\n');
            git(racer, 'commit', '--quiet', '-am', 'release 14.3.0');
            git(racer, 'push', '--quiet', 'origin', 'HEAD:refs/heads/racer');
            const newer = git(racer, 'rev-parse', 'HEAD');
            // A git that lets the first fetch after the run has pushed its own tag complete (the one the
            // order check reads), then has the run of release-14.3.0 tag and move latest before the next
            // command: where a build that fetched again would take the newer head as its parent and push
            // the older seeds on top of it, a fast-forward.
            const tagged = join(work, 'tagged');
            const bin = join(work, 'bin');
            mkdirSync(bin);
            const marker = join(work, 'raced');
            const realGit = spawnSync('which', ['git'], { encoding: 'utf8' }).stdout.trim();
            const shim = join(bin, 'git');
            writeFileSync(
                shim,
                [
                    '#!/bin/sh',
                    `'${realGit}' "$@"`,
                    'status=$?',
                    `if [ "$1" = push ] && [ "$4" = refs/tags/release-14.2.1 ]; then touch '${tagged}'; fi`,
                    `if [ "$1" = fetch ] && [ -e '${tagged}' ] && [ ! -e '${marker}' ]; then`,
                    `    touch '${marker}'`,
                    `    '${realGit}' --git-dir '${mirror}' update-ref refs/tags/release-14.3.0 ${newer}`,
                    `    '${realGit}' --git-dir '${mirror}' update-ref refs/heads/latest ${newer}`,
                    'fi',
                    'exit $status',
                    '',
                ].join('\n')
            );
            chmodSync(shim, 0o755);

            const result = sync({
                branch: 'b14.2.1',
                tag: 'release-14.2.1',
                exported: 'released 14.2.1\n',
                path: `${bin}:${process.env.PATH}`,
            });

            expect(result.status, result.stderr).toBe(0);
            expect(content('latest')).toBe('released 14.3.0');
            expect(tip('latest')).toBe(newer);
            expect(result.stdout).toContain('is older than the newest release tagged there (release-14.3.0)');
        });

        describe('waiting for npm', () => {
            const seeds = JSON.stringify({
                dependencies: { 'ag-charts-community': '14.2.0', 'ag-charts-react': '14.2.0' },
            });

            it('moves latest once npm serves every package the seeds install', () => {
                seedMirror();

                const result = sync({ branch: 'b14.2.0', tag: 'release-14.2.0', exported: seeds });

                expect(result.status, result.stderr).toBe(0);
                expect(content('latest')).toBe(seeds);
            });

            it('waits for a package that is not published yet, then moves latest', () => {
                seedMirror();

                const result = sync({
                    branch: 'b14.2.0',
                    tag: 'release-14.2.0',
                    exported: seeds,
                    unpublished: ['ag-charts-react@14.2.0'],
                    appearsAfter: 3,
                });

                expect(result.status, result.stderr).toBe(0);
                expect(result.stdout).toContain('Waiting for npm to serve 14.2.0 of: ag-charts-react');
                expect(content('latest')).toBe(seeds);
            });

            it('fails with latest untouched when a package is still not on npm after the wait', () => {
                seedMirror();
                const latest = tip('latest');

                const result = sync({
                    branch: 'b14.2.0',
                    tag: 'release-14.2.0',
                    exported: seeds,
                    unpublished: ['ag-charts-react@14.2.0'],
                });

                expect(result.status).not.toBe(0);
                expect(result.stdout + result.stderr).toContain('14.2.0 is not on npm for: ag-charts-react');
                expect(tip('latest')).toBe(latest);
                // The tag is already there, so a re-run once the release is published only moves latest.
                expect(tip('release-14.2.0')).not.toBe('');
            });
        });

        it('compares versions numerically, so 14.10.0 is newer than 14.9.0', () => {
            seedMirror();
            sync({ branch: 'b14.9.0', tag: 'release-14.9.0', exported: 'released 14.9.0\n' });

            sync({ branch: 'b14.10.0', tag: 'release-14.10.0', exported: 'released 14.10.0\n' });

            expect(content('latest')).toBe('released 14.10.0');
        });

        it('fails rather than move a tag the mirror holds with other content', () => {
            seedMirror();
            sync({ branch: 'b14.2.0', tag: 'release-14.2.0', exported: 'released 14.2.0\n' });
            const tagged = tip('release-14.2.0');

            const result = sync({ branch: 'b14.2.0', tag: 'release-14.2.0', exported: 'something else\n' });

            expect(result.status).not.toBe(0);
            expect(result.stdout + result.stderr).toContain('tags are never moved');
            expect(tip('release-14.2.0')).toBe(tagged);
        });

        it('re-running a tag that already holds the seeds changes nothing', () => {
            seedMirror();
            sync({ branch: 'b14.2.0', tag: 'release-14.2.0', exported: 'released 14.2.0\n' });
            const before = refs().map((ref) => [ref, tip(ref)]);

            const result = sync({ branch: 'b14.2.0', tag: 'release-14.2.0', exported: 'released 14.2.0\n' });

            expect(result.status, result.stderr).toBe(0);
            expect(refs().map((ref) => [ref, tip(ref)])).toEqual(before);
        });
    });
});
