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
