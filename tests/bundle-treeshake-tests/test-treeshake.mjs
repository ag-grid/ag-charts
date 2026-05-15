import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { gzipSync } from 'node:zlib';

import { bundleWithEsbuild } from './bundlers/esbuild.mjs';
import { bundleWithVite } from './bundlers/vite.mjs';
import { bundleWithWebpack } from './bundlers/webpack.mjs';
import { scenarios } from './scenarios.mjs';

const allBundlers = [
    { name: 'esbuild', fn: bundleWithEsbuild },
    { name: 'vite', fn: bundleWithVite },
    { name: 'webpack', fn: bundleWithWebpack },
];

// BUNDLE_TREESHAKE_BUNDLERS env var (comma-separated) selects a subset for CI sharding.
const bundlerFilter = process.env.BUNDLE_TREESHAKE_BUNDLERS?.split(',')
    .map((s) => s.trim())
    .filter(Boolean);
const bundlers = bundlerFilter?.length ? allBundlers.filter((b) => bundlerFilter.includes(b.name)) : allBundlers;
if (bundlers.length === 0) {
    throw new Error(
        `BUNDLE_TREESHAKE_BUNDLERS=${process.env.BUNDLE_TREESHAKE_BUNDLERS} matched no bundlers (known: ${allBundlers.map((b) => b.name).join(', ')})`
    );
}
console.log(`>>> running bundlers: ${bundlers.map((b) => b.name).join(', ')}`);

const { values: args } = parseArgs({
    options: {
        update: { type: 'boolean', default: false },
        'scenarios-path': { type: 'string' },
    },
});

const results = [];
const workDir = resolve('.entries');

for (const scenario of scenarios) {
    const scenarioResults = { scenario: scenario.name, limit: scenario.limit, sizes: {} };

    for (const bundler of bundlers) {
        const entryDir = join(workDir, scenario.name.replace(/\//g, '_'), bundler.name);
        mkdirSync(entryDir, { recursive: true });

        const entryFile = join(entryDir, 'entry.mjs');
        const importStatement =
            scenario.import === '*'
                ? `export * from '${scenario.package}';`
                : `export ${scenario.import} from '${scenario.package}';`;
        writeFileSync(entryFile, importStatement);

        const outFile = join(entryDir, 'output.mjs');

        try {
            await bundler.fn({ entry: entryFile, outFile });
            const raw = readFileSync(outFile);
            const gzipped = gzipSync(raw, { level: 9 });
            scenarioResults.sizes[bundler.name] = gzipped.length;
        } catch (err) {
            console.error(`ERROR: ${scenario.name} / ${bundler.name}: ${err.message}`);
            scenarioResults.sizes[bundler.name] = -1;
        }
    }

    results.push(scenarioResults);
}

// Print results table
const pad = (s, n) => String(s).padEnd(n);
const rpad = (s, n) => String(s).padStart(n);
const formatKB = (bytes) => (bytes < 0 ? 'ERROR' : `${(bytes / 1000).toFixed(1)} kB`);

console.log();
console.log('Bundle Tree-Shake Test Results');
console.log('='.repeat(100));
console.log(
    `${pad('Scenario', 42)} ${rpad('esbuild', 10)} ${rpad('vite', 10)} ${rpad('webpack', 10)} ${rpad('limit', 10)}  status`
);
console.log('-'.repeat(100));

let hasFailure = false;
let hasError = false;

for (const r of results) {
    const maxSize = Math.max(...Object.values(r.sizes));
    const pass = maxSize >= 0 && maxSize <= r.limit;
    const error = Object.values(r.sizes).some((s) => s < 0);

    if (!pass) hasFailure = true;
    if (error) hasError = true;

    const failedBundlers = Object.entries(r.sizes)
        .filter(([, size]) => size > r.limit)
        .map(([name]) => name);

    let status;
    if (error) {
        status = 'ERROR';
    } else if (pass) {
        status = 'PASS';
    } else {
        status = `FAIL (${failedBundlers.join(', ')})`;
    }

    console.log(
        `${pad(r.scenario, 42)} ${rpad(formatKB(r.sizes.esbuild), 10)} ${rpad(formatKB(r.sizes.vite), 10)} ${rpad(formatKB(r.sizes.webpack), 10)} ${rpad(formatKB(r.limit), 10)}  ${status}`
    );
}

console.log('='.repeat(100));

// Update mode: rewrite scenarios.mjs with new limits
if (args.update && args['scenarios-path']) {
    const scenariosPath = args['scenarios-path'];
    let content = readFileSync(scenariosPath, 'utf-8');

    for (const r of results) {
        const maxSize = Math.max(...Object.values(r.sizes).filter((s) => s >= 0));
        if (maxSize <= 0) continue;

        // Add 10% margin, round up to nearest 1000
        const newLimit = Math.ceil((maxSize * 1.1) / 1000) * 1000;
        const scenario = scenarios.find((s) => s.name === r.scenario);
        if (scenario) {
            content = content.replace(
                new RegExp(`(name: '${escapeRegExp(r.scenario)}'[\\s\\S]*?limit: )\\d[\\d_]*`),
                `$1${formatLimit(newLimit)}`
            );
        }
    }

    writeFileSync(scenariosPath, content);
    console.log(`\nUpdated limits in ${scenariosPath}`);
}

// Summary
const total = results.length * bundlers.length;
const passed = results.reduce((acc, r) => acc + Object.values(r.sizes).filter((s) => s >= 0 && s <= r.limit).length, 0);
const failed = total - passed;
console.log(`\n${passed}/${total} passed, ${failed} failed`);

if (hasError) process.exit(2);
if (hasFailure) process.exit(1);

function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatLimit(n) {
    if (n >= 1000) {
        return `${Math.floor(n / 1000)}_${String(n % 1000).padStart(3, '0')}`;
    }
    return String(n);
}
