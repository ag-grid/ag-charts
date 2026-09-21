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

/**
 * Deterministic content hash of `src/demos/<id>/**`: every file in sorted path order, each
 * contributing its relative path and its bytes. The ports' manifests (Phase 4) compare against
 * the same hash, so the algorithm is shared here rather than duplicated.
 */
export function hashDemoSource(demoId) {
    const dir = join(DEMOS_SRC_DIR, demoId);
    const hash = createHash('sha256');
    for (const file of listFiles(dir)) {
        hash.update(file);
        hash.update('\0');
        hash.update(readFileSync(join(dir, file)));
        hash.update('\0');
    }
    return `sha256-${hash.digest('hex')}`;
}

/**
 * The last commit that touched `src/demos/<id>`, or null when git cannot say (no repository,
 * or a shallow CI checkout whose single commit is not the real author of the change).
 */
export function readDemoSourceCommit(demoId) {
    try {
        const sha = execFileSync('git', ['log', '-1', '--format=%H', '--', join('src', 'demos', demoId)], {
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
