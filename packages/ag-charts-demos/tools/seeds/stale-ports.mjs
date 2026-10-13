import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';

import {
    DEMOS_SRC_DIR,
    MANIFEST_FILENAME,
    SEEDS_DIR,
    WORKSPACE_ROOT,
    hashDemoSource,
    readDemoIds,
    readDemoSourceCommit,
    readJson,
} from './seed-common.mjs';

/**
 * Staleness of the hand-maintained framework ports against the React golden masters.
 *
 * A port's `.seed-manifest.json` records the `sourceHash` of `src/demos/<demo>/**` it was last
 * synced to (see `hashDemoSource`). The port is stale when that differs from the current hash.
 * The React seed is generated, never ported, so it is checked by `check-seeds.mjs --react` and
 * excluded here.
 */

export const GENERATED_FRAMEWORK = 'react';

/**
 * Every `seeds/<demo>/<framework>/.seed-manifest.json` for a ported framework, as
 * `{ demo, framework, manifestPath, manifest }`, in directory order.
 */
export function readPortManifests(seedsDir = SEEDS_DIR) {
    const ports = [];
    if (!existsSync(seedsDir)) return ports;
    for (const demo of listDirectories(seedsDir)) {
        for (const framework of listDirectories(join(seedsDir, demo))) {
            if (framework === GENERATED_FRAMEWORK) continue;
            const manifestPath = join(seedsDir, demo, framework, MANIFEST_FILENAME);
            if (!existsSync(manifestPath)) continue;
            const manifest = readJson(manifestPath);
            for (const [field, expected] of [
                ['demo', demo],
                ['framework', framework],
            ]) {
                if (manifest[field] !== expected) {
                    throw new Error(
                        `${manifestPath}: "${field}" is ${JSON.stringify(manifest[field])} but the folder says "${expected}"`
                    );
                }
            }
            ports.push({ demo, framework, manifestPath, manifest });
        }
    }
    return ports;
}

/**
 * The stale ports, as `{ demo, framework, sourceHash, manifestHash, sourceCommit, manifestCommit }`:
 * `sourceHash` / `sourceCommit` describe the golden master now, `manifestHash` / `manifestCommit`
 * what the port was last synced to. A manifest with no `sourceHash` has never been synced and
 * is stale.
 *
 * `demoIds` limits the check to registered demos; a seed folder for an unregistered demo is
 * reported through `onSkip` rather than hashed, since it has no golden master.
 */
export function findStalePorts({
    seedsDir = SEEDS_DIR,
    demoIds = readDemoIds(),
    hashSource = hashDemoSource,
    readSourceCommit = readDemoSourceCommit,
    onSkip = () => {},
} = {}) {
    const stale = [];
    const hashes = new Map();
    for (const { demo, framework, manifest } of readPortManifests(seedsDir)) {
        if (!demoIds.includes(demo)) {
            onSkip(`seeds/${demo}/${framework}: "${demo}" is not a registered demo; skipped`);
            continue;
        }
        if (!hashes.has(demo)) {
            hashes.set(demo, { sourceHash: hashSource(demo), sourceCommit: readSourceCommit(demo) });
        }
        const { sourceHash, sourceCommit } = hashes.get(demo);
        const manifestHash = manifest.sourceHash ?? null;
        if (manifestHash === sourceHash) continue;
        stale.push({
            demo,
            framework,
            sourceHash,
            manifestHash,
            sourceCommit,
            manifestCommit: manifest.sourceCommit ?? null,
        });
    }
    return stale;
}

/** A path below the workspace as the repository-relative POSIX path git prints. */
const toRepoPath = (path) => relative(WORKSPACE_ROOT, path).split(/[\\/]/).join('/');

/** `packages/ag-charts-demos/seeds/`, as the paths `git diff --name-only` prints start. */
const SEEDS_PATH_PREFIX = `${toRepoPath(SEEDS_DIR)}/`;

/**
 * Files at a port's root whose edit does not count as touching the port. A pin update
 * (`pin-ports.mjs`, run by `tools/bump-versions.sh` on every version bump and at a release-branch
 * cut) rewrites `package.json` and the manifest in every port, stale or not, so a release cut would
 * fail on the ports it is about to align. `README.md` carries no demo behaviour and is not part of
 * the demo source hash, so editing it neither aligns the port nor needs a restamp.
 */
const UNCOUNTED_PORT_FILES = new Set(['package.json', MANIFEST_FILENAME, 'README.md']);

/**
 * The stale ports a change edits: every entry of `stale` (as `findStalePorts` returns them) with a
 * file under its `seeds/<demo>/<framework>/` among `changedFiles`, other than the files a pin
 * update rewrites. Each is returned with the `files` that touched it, relative to the port.
 *
 * A port is aligned by editing it and then restamping its manifest; one that is edited and still
 * stale was aligned without the restamp, and the blocking parity run would skip it as stale rather
 * than compare it. (A change that edits a port while moving its demo on is a different case; see
 * `splitTouchedByBaseStaleness`.) `changedFiles` are repository-relative POSIX paths, as `git diff --name-only`
 * prints them.
 */
export function findTouchedStalePorts({ changedFiles, stale, seedsPathPrefix = SEEDS_PATH_PREFIX }) {
    const touched = [];
    for (const port of stale) {
        const portPrefix = `${seedsPathPrefix}${port.demo}/${port.framework}/`;
        const files = changedFiles
            .filter((file) => file.startsWith(portPrefix))
            .map((file) => file.slice(portPrefix.length))
            .filter((file) => !UNCOUNTED_PORT_FILES.has(file));
        if (files.length > 0) touched.push({ ...port, files });
    }
    return touched;
}

/**
 * Splits the ports a change edits (`findTouchedStalePorts`) into those it must restamp and those
 * it need not, given `staleAtBase` (`findStalePortsAtBase`, whose `sourceHash` is the demo's hash
 * at the base).
 *
 * `inherited` ports were already stale at the base **and** the change moves their demo's source
 * hash. That is an API migration swept across the demo and every port: the change did not cause
 * the drift and cannot be expected to clear it, and the release-branch cut aligns them.
 *
 * Everything else is `introduced` and must be restamped: a port that was in step with its demo at
 * the base, and one that was already stale but whose demo the change leaves alone. The latter is
 * an alignment (the Demo Port Alignment workflow, `/port-showcases`) that only ever edits ports
 * stale at its base; one that forgot to restamp would otherwise have its parity run skipped as
 * stale with nothing to say so.
 */
export function splitTouchedByBaseStaleness({ touched, staleAtBase }) {
    const hashAtBase = new Map(
        staleAtBase.map(({ demo, framework, sourceHash }) => [`${demo}/${framework}`, sourceHash])
    );
    const demoMoved = ({ demo, framework, sourceHash }) => {
        const key = `${demo}/${framework}`;
        return hashAtBase.has(key) && hashAtBase.get(key) !== sourceHash;
    };
    return {
        introduced: touched.filter((port) => !demoMoved(port)),
        inherited: touched.filter(demoMoved),
    };
}

/**
 * The ports that were already stale at `base`: `findStalePorts` over the demo sources and port
 * manifests as committed there. Both are read out of `base`'s tree with `git archive` into a
 * temporary folder, so, like `readChangedFiles`, it needs no merge base and works in a shallow
 * clone once `base` is fetched. A port or demo that does not exist at `base` is not stale there.
 * When `base` predates the seeds altogether nothing was stale at it, so every edited stale port is
 * held to the restamp rule.
 *
 * The base tree is hashed with `HEAD`'s `hashDemoSource`, so a change to the hashing algorithm
 * itself makes every demo's hash differ between the two, which classes every edited stale port as
 * inherited. Such a change re-stamps the manifests anyway.
 */
export function findStalePortsAtBase(base, { demoIds = readDemoIds(), workspaceRoot = WORKSPACE_ROOT } = {}) {
    const demosPath = toRepoPath(DEMOS_SRC_DIR);
    const manifestsPath = `${SEEDS_PATH_PREFIX}*/*/${MANIFEST_FILENAME}`;
    const tmp = mkdtempSync(join(tmpdir(), 'stale-ports-base-'));
    try {
        const archive = join(tmp, 'base.tar');
        try {
            execFileSync(
                'git',
                ['archive', '--format=tar', '-o', archive, base, '--', demosPath, `:(glob)${manifestsPath}`],
                {
                    cwd: workspaceRoot,
                    // The "did not match" check below reads git's message, so keep it English.
                    env: { ...process.env, LC_ALL: 'C' },
                    stdio: ['ignore', 'pipe', 'pipe'],
                }
            );
        } catch (error) {
            if (/did not match any files/.test(String(error.stderr ?? ''))) return [];
            throw error;
        }
        const tree = join(tmp, 'tree');
        mkdirSync(tree);
        execFileSync('tar', ['-xf', archive, '-C', tree], { stdio: ['ignore', 'pipe', 'pipe'] });

        const srcDir = join(tree, ...demosPath.split('/'));
        return findStalePorts({
            seedsDir: join(tree, ...SEEDS_PATH_PREFIX.split('/')),
            demoIds: demoIds.filter((demo) => existsSync(join(srcDir, demo))),
            hashSource: (demo) => hashDemoSource(demo, srcDir),
            readSourceCommit: () => null,
        });
    } finally {
        rmSync(tmp, { recursive: true, force: true });
    }
}

/**
 * The files that differ between the tree at `base` and the working tree's `HEAD`, as
 * repository-relative POSIX paths. A tree comparison needs no merge base, so it works in the
 * shallow clones CI checks out, as long as `base` itself has been fetched.
 */
export function readChangedFiles(base) {
    return execFileSync('git', ['diff', '--name-only', '--no-renames', base, 'HEAD'], {
        cwd: WORKSPACE_ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
    })
        .split('\n')
        .filter(Boolean);
}

function listDirectories(dir) {
    return readdirSync(dir)
        .filter((name) => statSync(join(dir, name)).isDirectory())
        .sort();
}
