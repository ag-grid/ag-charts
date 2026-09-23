import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
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

/** The website's record of released versions, newest first; `tools/updateVersionsData.js` prepends each release. */
export const RELEASED_VERSIONS_PATH = join(
    WORKSPACE_ROOT,
    'packages',
    'ag-charts-website',
    'src',
    'content',
    'versions',
    'ag-charts-versions.json'
);

/**
 * The `ag-charts-*` version a seed pins, and where it came from.
 *
 * A seed is installed from npm, so its pin must be a published version. On a release branch the
 * workspace version is the release itself (`14.2.0`), so it is pinned exactly and the release
 * bump regenerates the seeds with it. Anywhere else the workspace carries a pre-release
 * (`14.2.0-beta.20260920`) that is never published, so the newest entry of the website's released
 * versions is pinned instead. Stripping the suffix would not do: on `latest` the beta already
 * carries the next release's number, which is unpublished until that release ships.
 *
 * @returns {{ pinnedVersion: string, pinSource: 'workspace' | 'released' }}
 */
export function readPinnedChartsVersion() {
    const workspaceVersion = readJson(join(WORKSPACE_ROOT, 'packages', 'ag-charts-community', 'package.json')).version;
    if (!workspaceVersion.includes('-')) {
        return { pinnedVersion: workspaceVersion, pinSource: 'workspace' };
    }
    const [newest] = readJson(RELEASED_VERSIONS_PATH);
    if (typeof newest?.version !== 'string' || newest.version.includes('-')) {
        throw new Error(`${relative(WORKSPACE_ROOT, RELEASED_VERSIONS_PATH)} does not start with a released version`);
    }
    return { pinnedVersion: newest.version, pinSource: 'released' };
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
