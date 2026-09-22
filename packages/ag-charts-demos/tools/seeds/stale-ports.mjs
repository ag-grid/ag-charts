import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import {
    MANIFEST_FILENAME,
    SEEDS_DIR,
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

function listDirectories(dir) {
    return readdirSync(dir)
        .filter((name) => statSync(join(dir, name)).isDirectory())
        .sort();
}
