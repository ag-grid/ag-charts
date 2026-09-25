import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Shared helpers for the seed tooling: where the demos live, which demos exist, and the
 * content hash the seed manifests record.
 */

const TOOLS_DIR = dirname(fileURLToPath(import.meta.url));

/** `packages/ag-charts-demos` */
export const DEMOS_ROOT = resolve(TOOLS_DIR, '..', '..');
/** `packages/ag-charts-demos/src/demos` — the React golden masters. */
export const DEMOS_SRC_DIR = join(DEMOS_ROOT, 'src', 'demos');
/** `packages/ag-charts-demos/seeds` — the committed seed projects. */
export const SEEDS_DIR = join(DEMOS_ROOT, 'seeds');
/** Repository root. */
export const WORKSPACE_ROOT = resolve(DEMOS_ROOT, '..', '..');

export const MANIFEST_FILENAME = '.seed-manifest.json';

/**
 * A release branch, `bX.Y.Z`, cut for release X.Y.Z by `tools/create-release-automated.sh`.
 * Production is deployed from it, which is how `tools/ci/check-demo-seed-links.mjs` uses it. The
 * seed pins do not depend on the branch (`readPinnedChartsVersion`).
 */
export const RELEASE_BRANCH = /^b(\d+\.\d+\.\d+)$/;

/**
 * Names the branch outright, ahead of everything `resolveBranch` would otherwise read: for
 * example, to run `tools/ci/check-demo-seed-links.mjs` from a detached checkout of a release branch.
 */
export const BRANCH_OVERRIDE_ENV = 'AG_CHARTS_SEED_BRANCH';

/**
 * The branch the checkout is being built for, or `null` when there is none to tell:
 *
 * 1. `AG_CHARTS_SEED_BRANCH`, when set (see `BRANCH_OVERRIDE_ENV`);
 * 2. on a GitHub Actions pull request, the branch it merges into (`GITHUB_BASE_REF`): the
 *    checkout is a detached merge commit, and what the change must suit is its target;
 * 3. in any other GitHub Actions run, `GITHUB_REF_NAME`, the pushed or dispatched branch;
 * 4. otherwise the checked-out branch (`git rev-parse --abbrev-ref HEAD`). A detached HEAD, or a
 *    folder that is not a git work tree, gives `null`.
 *
 * `readGitBranch` stands in for step 4 in the unit tests.
 */
export function resolveBranch({ env = process.env, readGitBranch = readCheckedOutBranch } = {}) {
    for (const name of [BRANCH_OVERRIDE_ENV, 'GITHUB_BASE_REF', 'GITHUB_REF_NAME']) {
        if (env[name]) return env[name];
    }
    const branch = readGitBranch();
    return branch && branch !== 'HEAD' ? branch : null;
}

function readCheckedOutBranch() {
    try {
        return execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
            cwd: WORKSPACE_ROOT,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
        }).trim();
    } catch (error) {
        if (/not a git repository/i.test(String(error.stderr ?? ''))) return null;
        throw error;
    }
}

/** How a seed's `ag-charts-*` pin was chosen, as its manifest's `pinSource` records it. */
export const PIN_SOURCE = {
    /** An exact release version: the workspace is at that release, or a merge-back carried it in. */
    release: 'release',
    /** The npm `latest` dist-tag: the workspace carries a pre-release, which public npm does not have. */
    distTag: 'dist-tag',
};

/** The npm dist-tag that names the newest published release, pinned for every pre-release. */
export const NPM_LATEST_TAG = 'latest';

/**
 * The flag that makes `generate-react-seed.mjs` and `pin-ports.mjs` write the preferred pin even
 * where the seeds carry a release a merge-back brought in (see `readPinnedChartsVersion`).
 * `tools/bump-versions.sh` passes it on every version bump.
 */
export const RESET_PIN_FLAG = '--reset-pin';

/** Why a merge-back may carry a release pin in, and how it goes away; shown whenever one is kept. */
const CARRIED_RELEASE_REASON = `release carried in by a merge-back; the next beta bump restores ${NPM_LATEST_TAG}`;

const RELEASE_VERSION = /^\d+\.\d+\.\d+$/;

/** The dependency sections whose `ag-charts-*` entries are pinned. */
const PIN_DEPENDENCY_SECTIONS = ['dependencies', 'devDependencies', 'peerDependencies'];

const PINNED_PACKAGE = /^ag-charts-/;

/** The `ag-charts-*` dependencies of a seed's package.json, as `{ name: version }`, whatever the section. */
export function readChartsPins(packageJson) {
    const pins = {};
    for (const section of PIN_DEPENDENCY_SECTIONS) {
        for (const [name, version] of Object.entries(packageJson[section] ?? {})) {
            if (PINNED_PACKAGE.test(name)) pins[name] = version;
        }
    }
    return pins;
}

/**
 * The pin each committed seed carries, generated React seeds and framework ports alike, as
 * `{ seed: '<demo>/<framework>', versions, pinSource }`: `versions` holds every distinct value
 * among its `ag-charts-*` dependencies and its manifest's `pinnedVersion` (`null` when that is
 * missing), sorted; `pinSource` is its manifest's, or `null`. A folder with no manifest is not a
 * seed and is skipped.
 */
export function readCommittedPins(seedsDir = SEEDS_DIR) {
    const seeds = [];
    for (const demo of listDirectoryNames(seedsDir)) {
        for (const framework of listDirectoryNames(join(seedsDir, demo))) {
            const dir = join(seedsDir, demo, framework);
            const manifestPath = join(dir, MANIFEST_FILENAME);
            if (!existsSync(manifestPath)) continue;
            const manifest = readJson(manifestPath);
            const packageJsonPath = join(dir, 'package.json');
            const pins = existsSync(packageJsonPath) ? readChartsPins(readJson(packageJsonPath)) : {};
            const versions = new Set([...Object.values(pins), manifest.pinnedVersion ?? null]);
            seeds.push({
                seed: `${demo}/${framework}`,
                versions: [...versions].sort(),
                pinSource: manifest.pinSource ?? null,
            });
        }
    }
    return seeds;
}

function listDirectoryNames(dir) {
    if (!existsSync(dir)) return [];
    return readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();
}

/**
 * The release every committed seed agrees on, or `null`: each seed's `ag-charts-*` dependencies
 * and manifest `pinnedVersion` must all be one and the same plain `X.Y.Z`, with `pinSource`
 * `release`.
 */
function findCarriedRelease(committed) {
    const release = committed[0]?.versions[0];
    if (!RELEASE_VERSION.test(release ?? '')) return null;
    const agree = committed.every(
        ({ versions, pinSource }) =>
            versions.length === 1 && versions[0] === release && pinSource === PIN_SOURCE.release
    );
    return agree ? release : null;
}

/** Which seeds carry which pin, e.g. `latest with pinSource dist-tag in financial/react; 14.2.0 …`. */
function describeCommittedPins(committed) {
    const groups = new Map();
    for (const { seed, versions, pinSource } of committed) {
        const label = `${versions.map((version) => version ?? 'no pinnedVersion').join(' and ')} with pinSource ${pinSource ?? 'missing'}`;
        groups.set(label, [...(groups.get(label) ?? []), seed]);
    }
    return [...groups].map(([label, seeds]) => `${label} in ${seeds.join(', ')}`).join('; ');
}

/**
 * The `ag-charts-*` version the seeds pin, where it came from, and why.
 *
 * A seed is installed from public npm, since that is where a StackBlitz user installs from, so
 * its pin must be something npm can resolve. The workspace version usually cannot be pinned as it
 * is: between releases every branch carries a pre-release, `X.Y.Z-beta.<date>[.<time>]`
 * (`tools/calculate-next-version.js`), and betas are published only to the private registry at
 * registry.ag-grid.com, never to public npm. The branch plays no part:
 *
 * 1. A plain `X.Y.Z` workspace version is a release (the "Release X.Y.Z Prep" commit, which runs
 *    `tools/bump-versions.sh` and is tagged `release-X.Y.Z`), so it is pinned exactly.
 * 2. A pre-release pins the npm `latest` dist-tag, which installs the newest published release;
 *    release branches, `bX.Y.Z`, included.
 * 3. Release branches are merged back into `latest` several times per release, and git carries
 *    their pin lines across unannounced. So where rule 2 applies, a plain `X.Y.Z` that every
 *    committed seed agrees on (`readCommittedPins`) is kept rather than flagged: plain versions
 *    only come from a tagged Release Prep, which publishes that version to npm. The seeds must
 *    agree completely, every `ag-charts-*` dependency, `pinnedVersion` and `pinSource` alike;
 *    anything else, a pre-release pin included, gets rule 2's dist-tag, and the reason names what
 *    the seeds carry. `reset` (`RESET_PIN_FLAG`) skips this rule, which is how the next version
 *    bump puts the dist-tag back.
 *
 * `workspaceVersion` stands in for the version in `ag-charts-community/package.json`, and
 * `seedsDir` for the committed seeds, for the unit tests.
 *
 * @returns {{ pinnedVersion: string, pinSource: 'release' | 'dist-tag', reason: string }}
 */
export function readPinnedChartsVersion({
    workspaceVersion = readWorkspaceVersion(),
    seedsDir = SEEDS_DIR,
    reset = false,
} = {}) {
    const [release] = workspaceVersion.split('-');
    if (!RELEASE_VERSION.test(release)) {
        throw new Error(`Workspace version ${workspaceVersion} is not X.Y.Z or X.Y.Z-<pre-release>`);
    }
    if (release === workspaceVersion) {
        return { pinnedVersion: release, pinSource: PIN_SOURCE.release, reason: `workspace version ${release}` };
    }
    const preferred = {
        pinnedVersion: NPM_LATEST_TAG,
        pinSource: PIN_SOURCE.distTag,
        reason: `npm dist-tag: workspace version ${workspaceVersion} is a pre-release, which public npm does not have`,
    };
    const committed = readCommittedPins(seedsDir);
    const carried = findCarriedRelease(committed);
    if (carried && reset) {
        return { ...preferred, reason: `${preferred.reason}; ${RESET_PIN_FLAG} replaces the carried-in ${carried}` };
    }
    if (carried) {
        return { pinnedVersion: carried, pinSource: PIN_SOURCE.release, reason: CARRIED_RELEASE_REASON };
    }
    const inStep = committed.every(
        ({ versions, pinSource }) =>
            versions.length === 1 && versions[0] === NPM_LATEST_TAG && pinSource === PIN_SOURCE.distTag
    );
    if (inStep || reset) return preferred;
    return {
        ...preferred,
        reason: `${preferred.reason}; a release carried in by a merge-back is kept only when every seed pins the same plain X.Y.Z, but the seeds pin ${describeCommittedPins(committed)}`,
    };
}

/** `pin` for a log line, e.g. `14.2.0 (release carried in by a merge-back; …)`. */
export function describePin({ pinnedVersion, pinSource, reason }) {
    return `${pinnedVersion} (${reason ?? pinSource})`;
}

function readWorkspaceVersion() {
    return readJson(join(WORKSPACE_ROOT, 'packages', 'ag-charts-community', 'package.json')).version;
}

/**
 * Demo ids in registry order. `src/registry.ts` is TypeScript, so the ids are read off its
 * `id: '...'` entries rather than by importing it; each must have a matching source folder.
 */
export function readDemoIds() {
    const registry = readFileSync(join(DEMOS_ROOT, 'src', 'registry.ts'), 'utf8');
    const ids = [...registry.matchAll(/\bid:\s*'([^']+)'/g)].map((match) => match[1]);
    if (ids.length === 0) {
        throw new Error('No demo ids found in src/registry.ts');
    }
    for (const id of ids) {
        const dir = join(DEMOS_SRC_DIR, id);
        if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) {
            throw new Error(`Registry lists "${id}" but src/demos/${id} does not exist`);
        }
    }
    return ids;
}

/**
 * Every file below `dir`, as POSIX paths relative to `dir`, sorted. Walks the file system as it
 * is, so it suits folders the tooling writes itself; source is listed with `listSourceFiles`.
 */
export function listFiles(dir) {
    const files = [];
    const walk = (current) => {
        for (const entry of readdirSync(current, { withFileTypes: true })) {
            const full = join(current, entry.name);
            if (entry.isDirectory()) {
                walk(full);
            } else if (entry.isFile()) {
                files.push(toPosix(relative(dir, full)));
            }
        }
    };
    walk(dir);
    return files.sort();
}

/**
 * The files below `dir` that git would commit, as POSIX paths relative to `dir`, sorted: tracked
 * files plus untracked ones that no ignore rule excludes, less any deleted from the working tree.
 * Ignored files (`.DS_Store`, editor droppings, local build output) therefore never reach a
 * seed or a source hash. Untracked files do count, so a new demo file is picked up before it is
 * staged; once committed, the result is what a CI checkout of the same commit sees.
 *
 * Falls back to walking the folder only when `dir` is not inside a git work tree at all, which
 * is the case for the unit tests' temporary folders; any other git failure is an error.
 */
export function listSourceFiles(dir) {
    let output;
    try {
        output = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', '.'], {
            cwd: dir,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
        });
    } catch (error) {
        if (/not a git repository/i.test(String(error.stderr ?? ''))) return listFiles(dir);
        throw error;
    }
    const files = new Set(
        output
            .split('\0')
            .filter(Boolean)
            .filter((file) => statSync(join(dir, file), { throwIfNoEntry: false })?.isFile())
    );
    return [...files].sort();
}

/**
 * Test files stay with the workspace: a seed has no test runner and vitest is not a seed
 * dependency. They are left out of the seed and of the source hash alike, so a test-only edit
 * neither changes a seed nor reports its ports stale.
 */
export const EXCLUDED_DEMO_SOURCE = /\.(test|spec)\.[cm]?[jt]sx?$/;

/** `EXCLUDED_DEMO_SOURCE` as git exclude pathspecs, so the history is read over the same files. */
const EXCLUDED_DEMO_SOURCE_PATHSPECS = ['test', 'spec'].flatMap((kind) =>
    ['', 'c', 'm'].flatMap((module) =>
        ['j', 't'].flatMap((language) =>
            ['s', 'sx'].map((suffix) => `:(glob,exclude)**/*.${kind}.${module}${language}${suffix}`)
        )
    )
);

/** The files a demo's folder contributes to its seed and its source hash, relative to `dir`, sorted. */
export function listDemoSourceFiles(dir) {
    return listSourceFiles(dir).filter((file) => !EXCLUDED_DEMO_SOURCE.test(file));
}

export function toPosix(path) {
    return path.split(sep).join('/');
}

/** Relative import specifiers, side-effect imports included; group 1 is the quote, group 2 the specifier. */
export const RELATIVE_IMPORT = /(?<=\b(?:from|import)\s*)(['"])(\.[^'"]+)\1/g;
/** A file whose imports are followed. */
export const SOURCE_FILE = /\.[cm]?[jt]sx?$/;
const SOURCE_EXTENSIONS = ['.ts', '.tsx'];

/**
 * Resolves a relative import the way the bundler does: the specifier as written, then with a
 * source extension, then as a folder index. Reports which of those it took, since a seed that
 * rewrites the import needs to write it the same way.
 */
export function resolveRelativeImport(fromFile, specifier) {
    const base = resolve(dirname(fromFile), specifier);
    const candidates = [
        { target: base },
        ...SOURCE_EXTENSIONS.map((ext) => ({ target: `${base}${ext}`, addedExtension: true })),
        ...SOURCE_EXTENSIONS.map((ext) => ({ target: join(base, `index${ext}`), viaIndex: true })),
    ];
    const found = candidates.find(({ target }) => statSync(target, { throwIfNoEntry: false })?.isFile());
    if (!found) {
        throw new Error(`Cannot resolve import "${specifier}" from ${relative(WORKSPACE_ROOT, fromFile)}`);
    }
    return found;
}

/** Which demo a source file below `srcDir` belongs to. */
export function ownerDemo(file, srcDir = DEMOS_SRC_DIR) {
    const rel = relative(srcDir, file);
    if (rel.startsWith('..')) {
        throw new Error(`${relative(WORKSPACE_ROOT, file)} is outside src/demos; a seed cannot include it`);
    }
    return rel.split(sep)[0];
}

/**
 * The source a demo is made of: every file under its own folder (`listDemoSourceFiles`: git's
 * view of it, test files excluded), plus the files it reaches
 * through relative imports from sibling demos (procurement draws its world map from
 * web-analytics' topology rather than duplicating it). A seed copies the latter under
 * `src/vendored/<demo>/`, and the manifests list them as `vendored`.
 *
 * @returns {{ files: string[], vendored: string[] }} `files` relative to the demo's folder,
 * `vendored` relative to `srcDir` (`web-analytics/topology.ts`), both sorted.
 */
export function resolveDemoSources(demoId, srcDir = DEMOS_SRC_DIR) {
    const dir = join(srcDir, demoId);
    const files = listDemoSourceFiles(dir);
    const queue = files.map((file) => join(dir, file));
    const seen = new Set();
    const vendored = new Set();
    while (queue.length) {
        const file = queue.shift();
        if (seen.has(file)) continue;
        seen.add(file);
        if (ownerDemo(file, srcDir) !== demoId) vendored.add(toPosix(relative(srcDir, file)));
        if (!SOURCE_FILE.test(file)) continue;
        for (const [, , specifier] of readFileSync(file, 'utf8').matchAll(RELATIVE_IMPORT)) {
            queue.push(resolveRelativeImport(file, specifier).target);
        }
    }
    return { files, vendored: [...vendored].sort() };
}

/**
 * Deterministic content hash of a demo's source: every file `resolveDemoSources` lists for
 * `src/demos/<id>/` in sorted path order (test files and ignored files excluded, exactly as the
 * seed leaves them out), each contributing its relative path and its bytes, then every file it imports
 * from a sibling demo under its `../<demo>/…` path. A change to a shared module such as
 * web-analytics' topology therefore moves the hash of every demo that draws on it, and the
 * ports of those demos are reported stale. The ports' manifests (Phase 4) compare against the
 * same hash, so the algorithm is shared here rather than duplicated.
 */
export function hashDemoSource(demoId, srcDir = DEMOS_SRC_DIR) {
    const dir = join(srcDir, demoId);
    const { files, vendored } = resolveDemoSources(demoId, srcDir);
    const hash = createHash('sha256');
    const add = (key, path) => {
        hash.update(key);
        hash.update('\0');
        hash.update(readFileSync(path));
        hash.update('\0');
    };
    for (const file of files) add(file, join(dir, file));
    for (const file of vendored) add(`../${file}`, join(srcDir, file));
    return `sha256-${hash.digest('hex')}`;
}

/**
 * The last commit that touched the demo's source, sibling-demo imports included, so a port's
 * `sourceCommit` names the change it has to catch up with even when that change was made to a
 * shared module. Test files are left out, as they are from the hash.
 *
 * In a shallow clone the history stops at the shallow boundary, whose commit appears to add
 * every file it holds, so `git log` would name it whenever the real change is older. A boundary
 * commit is therefore not an answer and this returns null; callers keep the recorded commit when
 * the source is unchanged (`resolveSourceCommit`).
 */
export function readDemoSourceCommit(demoId, { demosRoot = DEMOS_ROOT } = {}) {
    const git = (args) =>
        execFileSync('git', args, { cwd: demosRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    try {
        const srcDir = join(demosRoot, 'src', 'demos');
        const paths = [
            join('src', 'demos', demoId),
            ...resolveDemoSources(demoId, srcDir).vendored.map((file) => join('src', 'demos', file)),
        ];
        const sha = git(['log', '-1', '--format=%H', '--', ...paths, ...EXCLUDED_DEMO_SOURCE_PATHSPECS]);
        if (!sha) return null;
        if (git(['rev-parse', '--is-shallow-repository']) === 'true') {
            const shallowFile = resolve(demosRoot, git(['rev-parse', '--git-path', 'shallow']));
            const boundary = readFileSync(shallowFile, 'utf8').split('\n');
            if (boundary.includes(sha)) return null;
        }
        return sha;
    } catch {
        return null;
    }
}

/**
 * The `sourceCommit` to record for a demo whose source now hashes to `sourceHash`. When the
 * manifest being rewritten already records that hash, its commit still names the change it was
 * synced to and is kept: rewriting it would only let a shallow clone (a version bump, a CI job)
 * replace it with whatever commit the clone happens to start at. Otherwise the commit is read
 * from the history.
 */
export function resolveSourceCommit(demoId, sourceHash, previousManifest, readSourceCommit = readDemoSourceCommit) {
    if (previousManifest?.sourceHash === sourceHash && previousManifest.sourceCommit) {
        return previousManifest.sourceCommit;
    }
    return readSourceCommit(demoId);
}

export function readJson(path) {
    return JSON.parse(readFileSync(path, 'utf8'));
}
