#!/usr/bin/env node
/* eslint-disable no-console */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    MANIFEST_FILENAME,
    SEEDS_DIR,
    WORKSPACE_ROOT,
    hashDemoSource,
    readDemoIds,
    readDemoSourceCommit,
} from './seed-common.mjs';
import { GENERATED_FRAMEWORK } from './stale-ports.mjs';

/**
 * Records that a framework port is in step with its React golden master: rewrites the port's
 * `.seed-manifest.json` `sourceHash` and `sourceCommit` from the current `src/demos/<demo>/**`,
 * leaving every other field as it was. Run it after porting a demo change, before committing;
 * `check-seeds.mjs --stale` then stops reporting the port.
 *
 * Usage: node tools/seeds/stamp-port-manifest.mjs <demo> <framework>
 */

/** Rewrites the manifest at `manifestPath`; returns the new `{ sourceHash, sourceCommit }`. */
export function stampPortManifest(manifestPath, { hashSource, readSourceCommit }) {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    manifest.sourceHash = hashSource(manifest.demo);
    manifest.sourceCommit = readSourceCommit(manifest.demo);
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 4)}\n`);
    return { sourceHash: manifest.sourceHash, sourceCommit: manifest.sourceCommit };
}

function main(argv) {
    const [demo, framework, ...rest] = argv;
    if (!demo || !framework || rest.length) {
        throw new Error('usage: stamp-port-manifest.mjs <demo> <framework>');
    }
    const known = readDemoIds();
    if (!known.includes(demo)) {
        throw new Error(`Unknown demo id "${demo}". Registered: ${known.join(', ')}`);
    }
    if (framework === GENERATED_FRAMEWORK) {
        throw new Error('The React seed is generated; regenerate it with generate-react-seed.mjs instead');
    }
    const manifestPath = join(SEEDS_DIR, demo, framework, MANIFEST_FILENAME);
    if (!existsSync(manifestPath)) {
        throw new Error(`${relative(WORKSPACE_ROOT, manifestPath)} does not exist; is the port committed?`);
    }

    const { sourceHash, sourceCommit } = stampPortManifest(manifestPath, {
        hashSource: hashDemoSource,
        readSourceCommit: readDemoSourceCommit,
    });
    console.log(`${relative(WORKSPACE_ROOT, manifestPath)}: sourceHash ${sourceHash}, sourceCommit ${sourceCommit}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    try {
        main(process.argv.slice(2));
    } catch (error) {
        console.error(`stamp-port-manifest: ${error.message}`);
        process.exit(1);
    }
}
