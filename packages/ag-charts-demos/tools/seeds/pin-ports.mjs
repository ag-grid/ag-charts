#!/usr/bin/env node
/* eslint-disable no-console */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    RESET_PIN_FLAG,
    SEEDS_DIR,
    WORKSPACE_ROOT,
    describePin,
    readChartsPins,
    readPinnedChartsVersion,
} from './seed-common.mjs';
import { readPortManifests } from './stale-ports.mjs';

/**
 * Keeps the framework ports' `ag-charts-*` pins on the version the seeds are meant to install.
 *
 * The React seed is regenerated with its pins (`generate-react-seed.mjs`); the Angular, Vue and
 * TypeScript ports are hand-written, so this rewrites them in place instead: every `ag-charts-*`
 * dependency in each port's `package.json`, and `pinnedVersion` / `pinSource` in its
 * `.seed-manifest.json`, are set from `readPinnedChartsVersion()`: the release for a plain
 * `X.Y.Z` workspace version, the npm `latest` dist-tag for a pre-release, or a release that every
 * seed already carries in from a merge-back, which is kept. Values are replaced in the file text
 * rather than by re-serialising the JSON, so each file keeps its own formatting.
 *
 * `--reset-pin` drops a carried-in release and writes the dist-tag for a pre-release.
 * `tools/bump-versions.sh` runs it with `--reset-pin` right after regenerating the React seeds with
 * it, and `check-seeds.mjs --pins` fails CI when a port's pins have drifted from the pin.
 *
 * Usage: node tools/seeds/pin-ports.mjs [--reset-pin]
 */

export const PIN_COMMAND = `node ${relative(WORKSPACE_ROOT, fileURLToPath(import.meta.url))}`;

/** The manifest fields that record the pin. */
const MANIFEST_PIN_FIELDS = ['pinnedVersion', 'pinSource'];

/**
 * The ports whose pins disagree with `pin`, one entry per port, as
 * `{ demo, framework, packageJsonPath, manifestPath, pins, manifest }`: `pins` holds only the
 * drifted `ag-charts-*` dependencies (`{ name: actualVersion }`) and `manifest` only the drifted
 * manifest fields (`{ pinnedVersion?, pinSource? }`, a value of `null` meaning the field is
 * missing). A port whose package.json pins nothing from `ag-charts-*` is an error: every port
 * renders a chart.
 */
export function findPortPinDrift({ seedsDir = SEEDS_DIR, pin = readPinnedChartsVersion({ seedsDir }) } = {}) {
    const drift = [];
    for (const { demo, framework, manifestPath, manifest } of readPortManifests(seedsDir)) {
        const packageJsonPath = join(dirname(manifestPath), 'package.json');
        const pins = readChartsPins(JSON.parse(readFileSync(packageJsonPath, 'utf8')));
        if (Object.keys(pins).length === 0) {
            throw new Error(`${packageJsonPath} pins no ag-charts-* package`);
        }
        const driftedPins = Object.fromEntries(
            Object.entries(pins).filter(([, version]) => version !== pin.pinnedVersion)
        );
        const driftedManifest = Object.fromEntries(
            MANIFEST_PIN_FIELDS.filter((field) => manifest[field] !== pin[field]).map((field) => [
                field,
                manifest[field] ?? null,
            ])
        );
        if (Object.keys(driftedPins).length === 0 && Object.keys(driftedManifest).length === 0) {
            continue;
        }
        drift.push({ demo, framework, packageJsonPath, manifestPath, pins: driftedPins, manifest: driftedManifest });
    }
    return drift;
}

/**
 * Sets the string value of `key` in JSON `text` without re-serialising it. The key must occur
 * exactly once; when it does not occur at all and `after` is given, the key is inserted on a new
 * line after `after`, with that line's indentation.
 */
function setJsonString(text, key, value, { after, path } = {}) {
    const pattern = new RegExp(`("${escapeRegExp(key)}"\\s*:\\s*)"[^"]*"`, 'g');
    const matches = [...text.matchAll(pattern)];
    if (matches.length > 1) {
        throw new Error(`${path}: "${key}" occurs ${matches.length} times`);
    }
    if (matches.length === 1) {
        return text.replace(pattern, `$1${JSON.stringify(value)}`);
    }
    if (!after) {
        throw new Error(`${path}: no "${key}" to rewrite`);
    }
    const anchor = new RegExp(`^([ \\t]*)"${escapeRegExp(after)}"\\s*:\\s*"[^"]*"`, 'm');
    const anchorMatch = anchor.exec(text);
    if (!anchorMatch) {
        throw new Error(`${path}: no "${after}" to insert "${key}" after`);
    }
    const [line, indent] = anchorMatch;
    return text.replace(anchor, `${line},\n${indent}"${key}": ${JSON.stringify(value)}`);
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Rewrites every drifted port to `pin`. Returns the drift that was fixed (see `findPortPinDrift`),
 * empty when nothing needed changing.
 */
export function pinPorts({ seedsDir = SEEDS_DIR, pin = readPinnedChartsVersion({ seedsDir }) } = {}) {
    const drift = findPortPinDrift({ seedsDir, pin });
    for (const port of drift) {
        if (Object.keys(port.pins).length > 0) {
            let text = readFileSync(port.packageJsonPath, 'utf8');
            for (const name of Object.keys(port.pins)) {
                text = setJsonString(text, name, pin.pinnedVersion, { path: port.packageJsonPath });
            }
            writeFileSync(port.packageJsonPath, text);
        }
        if (Object.keys(port.manifest).length > 0) {
            let text = readFileSync(port.manifestPath, 'utf8');
            text = setJsonString(text, 'pinnedVersion', pin.pinnedVersion, {
                after: 'framework',
                path: port.manifestPath,
            });
            text = setJsonString(text, 'pinSource', pin.pinSource, { after: 'pinnedVersion', path: port.manifestPath });
            writeFileSync(port.manifestPath, text);
        }
    }
    return drift;
}

/** One line per drifted port naming what disagreed, e.g. `seeds/financial/vue: ag-charts-vue3 14.1.0, manifest pinnedVersion 14.1.0`. */
export function describeDrift(drift) {
    return drift.map(({ demo, framework, pins, manifest }) => {
        const parts = [
            ...Object.entries(pins).map(([name, version]) => `${name} ${version}`),
            ...Object.entries(manifest).map(([field, value]) => `manifest ${field} ${value ?? 'missing'}`),
        ];
        return `seeds/${demo}/${framework}: ${parts.join(', ')}`;
    });
}

/**
 * Reads the pin as the command line asks (`--reset-pin` or not) and rewrites every drifted port to
 * it. Returns `{ pin, fixed }`, `fixed` as `pinPorts` returns it. `seedsDir` and `workspaceVersion`
 * stand in for the committed seeds and the workspace version in the unit tests.
 */
export function runPinPorts(argv, { seedsDir = SEEDS_DIR, workspaceVersion } = {}) {
    const unknown = argv.filter((arg) => arg !== RESET_PIN_FLAG);
    if (unknown.length) {
        throw new Error(`unknown argument ${unknown.join(' ')}; usage: pin-ports.mjs [${RESET_PIN_FLAG}]`);
    }
    const pin = readPinnedChartsVersion({ workspaceVersion, seedsDir, reset: argv.includes(RESET_PIN_FLAG) });
    return { pin, fixed: pinPorts({ seedsDir, pin }) };
}

function main(argv) {
    const { pin, fixed } = runPinPorts(argv);
    if (fixed.length === 0) {
        console.log(`pin-ports: every port already pins ag-charts-* ${describePin(pin)}.`);
        return;
    }
    console.log(`pin-ports: pinned ag-charts-* ${describePin(pin)}; was:`);
    for (const line of describeDrift(fixed)) console.log(`  ${line}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    try {
        main(process.argv.slice(2));
    } catch (error) {
        console.error(`pin-ports: ${error.message}`);
        process.exit(1);
    }
}
