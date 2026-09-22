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

/** Every file below `dir`, as POSIX paths relative to `dir`, sorted. */
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
 * The source a demo is made of: every file under its own folder, plus the files it reaches
 * through relative imports from sibling demos (procurement draws its world map from
 * web-analytics' topology rather than duplicating it). A seed copies the latter under
 * `src/vendored/<demo>/`, and the manifests list them as `vendored`.
 *
 * @returns {{ files: string[], vendored: string[] }} `files` relative to the demo's folder,
 * `vendored` relative to `srcDir` (`web-analytics/topology.ts`), both sorted.
 */
export function resolveDemoSources(demoId, srcDir = DEMOS_SRC_DIR) {
    const dir = join(srcDir, demoId);
    const files = listFiles(dir);
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
 * Deterministic content hash of a demo's source: every file of `src/demos/<id>/**` in sorted
 * path order, each contributing its relative path and its bytes, then every file it imports
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
 * shared module.
 */
export function readDemoSourceCommit(demoId) {
    try {
        const paths = [
            join('src', 'demos', demoId),
            ...resolveDemoSources(demoId).vendored.map((file) => join('src', 'demos', file)),
        ];
        const sha = execFileSync('git', ['log', '-1', '--format=%H', '--', ...paths], {
            cwd: DEMOS_ROOT,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
        }).trim();
        return sha || null;
    } catch {
        return null;
    }
}

export function readJson(path) {
    return JSON.parse(readFileSync(path, 'utf8'));
}
