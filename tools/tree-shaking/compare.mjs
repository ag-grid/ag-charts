#!/usr/bin/env node
/**
 * Compares consumer bundle sizes of AG Charts across targets, bundling each scenario in
 * `scenarios.mjs` with esbuild the way an application would (minified ESM, tree-shaken).
 *
 * Targets (comma-separated, first is the reference for deltas):
 *   local          this checkout's built dist (`yarn nx build ag-charts-enterprise` first)
 *   dir:<path>     another checkout's built dist, e.g. the main repo on `latest`
 *   <version>      a published npm version, e.g. 14.2.0 (installed once into the cache)
 *
 * Usage:
 *   node tools/tree-shaking/compare.mjs --targets 14.2.0,local
 *   node tools/tree-shaking/compare.mjs --targets 14.2.0,local --json reports/start.json
 *   node tools/tree-shaking/compare.mjs --baseline reports/start.json --targets local --markdown
 *
 * Options:
 *   --targets <list>      targets to measure (default: local)
 *   --baseline <file>     prepend the targets recorded in a previous --json report
 *   --json <file>         write the results as JSON
 *   --filter <text>       only run scenarios whose name contains <text>
 *   --breakdown           print minified bytes per AG Charts package for each scenario
 *   --markdown            print the table as markdown
 *   --cache-dir <path>    where published versions are installed (default: <tmpdir>/ag-charts-tree-shaking)
 */
import * as esbuild from 'esbuild';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';

import { scenarios } from './scenarios.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const packages = [
    'ag-charts-types',
    'ag-charts-core',
    'ag-charts-locale',
    'ag-charts-community',
    'ag-charts-enterprise',
];

const { values: args } = parseArgs({
    options: {
        targets: { type: 'string', default: 'local' },
        baseline: { type: 'string' },
        json: { type: 'string' },
        filter: { type: 'string' },
        breakdown: { type: 'boolean', default: false },
        markdown: { type: 'boolean', default: false },
        'cache-dir': { type: 'string', default: join(tmpdir(), 'ag-charts-tree-shaking') },
    },
});

function resolveTarget(target) {
    if (target === 'local') return checkBuilt(repoRoot, target);
    if (target.startsWith('dir:')) return checkBuilt(resolve(target.slice(4)), target);
    if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(target)) throw new Error(`Unknown target "${target}"`);

    const dir = join(args['cache-dir'], target);
    if (!existsSync(join(dir, 'node_modules', 'ag-charts-enterprise', 'package.json'))) {
        console.error(`Installing ag-charts ${target} into ${dir}`);
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'tree-shaking-target', private: true }));
        execFileSync(
            'npm',
            [
                'install',
                '--ignore-scripts',
                '--no-audit',
                '--no-fund',
                '--no-package-lock',
                `ag-charts-community@${target}`,
                `ag-charts-enterprise@${target}`,
            ],
            { cwd: dir, stdio: ['ignore', 'ignore', 'inherit'] }
        );
    }
    return dir;
}

function checkBuilt(root, target) {
    for (const pkg of ['ag-charts-core', 'ag-charts-community', 'ag-charts-enterprise']) {
        const entry = join(root, 'packages', pkg, 'dist', 'package', 'main.esm.mjs');
        if (!existsSync(entry)) throw new Error(`${target}: missing ${entry}; build it first`);
    }
    return root;
}

function entrySource({ imports }) {
    const lines = [];
    const refs = [];
    Object.entries(imports).forEach(([pkg, names], i) => {
        if (names === '*') {
            lines.push(`import * as ns${i} from '${pkg}';`);
            refs.push(`ns${i}`);
        } else {
            lines.push(`import { ${names.join(', ')} } from '${pkg}';`);
            refs.push(...names);
        }
    });
    lines.push(`console.log(${refs.join(', ')});`);
    return lines.join('\n');
}

function packageOf(inputPath) {
    const match = /(ag-charts-[a-z]+)[/\\](?!.*ag-charts-[a-z]+[/\\])/.exec(inputPath);
    return match && packages.includes(match[1]) ? match[1] : 'other';
}

async function measure(resolveDir, scenario) {
    try {
        const result = await esbuild.build({
            stdin: { contents: entrySource(scenario), resolveDir, loader: 'js' },
            bundle: true,
            minify: true,
            format: 'esm',
            platform: 'browser',
            target: 'es2020',
            write: false,
            metafile: true,
            logLevel: 'silent',
            // The repo tsconfig `paths` would redirect package imports inside dist to src.
            tsconfigRaw: '{}',
        });
        const code = result.outputFiles[0].contents;
        const breakdown = {};
        for (const output of Object.values(result.metafile.outputs)) {
            for (const [path, { bytesInOutput }] of Object.entries(output.inputs)) {
                const pkg = packageOf(path);
                breakdown[pkg] = (breakdown[pkg] ?? 0) + bytesInOutput;
            }
        }
        return {
            minified: code.length,
            gzip: gzipSync(code, { level: 9 }).length,
            brotli: brotliCompressSync(code, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length,
            breakdown,
        };
    } catch (e) {
        return { error: e.errors?.[0]?.text ?? e.message };
    }
}

const kB = (bytes) => (bytes / 1000).toFixed(1);

function formatCell(result, reference) {
    if (!result) return '-';
    if (result.error) return 'n/a';
    const size = `${kB(result.brotli)} kB`;
    if (!reference || reference.error || reference === result) return size;
    const delta = result.brotli - reference.brotli;
    const percent = ((delta / reference.brotli) * 100).toFixed(1);
    return `${size} (${delta >= 0 ? '+' : ''}${kB(delta)}, ${delta >= 0 ? '+' : ''}${percent}%)`;
}

function printTable(report, names) {
    const labels = Object.keys(report.targets);
    const header = ['scenario (brotli)', ...labels];
    const rows = names.map((name) => {
        const reference = report.targets[labels[0]][name];
        return [name, ...labels.map((label) => formatCell(report.targets[label][name], reference))];
    });

    if (args.markdown) {
        console.log(`| ${header.join(' | ')} |`);
        console.log(`| ${header.map(() => '---').join(' | ')} |`);
        rows.forEach((row) => console.log(`| ${row.join(' | ')} |`));
    } else {
        const widths = header.map((_, i) => Math.max(...[header, ...rows].map((row) => row[i].length)));
        [header, ...rows].forEach((row) => console.log(row.map((cell, i) => cell.padEnd(widths[i])).join('  ')));
    }

    for (const label of labels) {
        for (const name of names) {
            const error = report.targets[label][name]?.error;
            if (error) console.log(`n/a: ${label} / ${name}: ${error}`);
        }
    }
}

function printBreakdown(report, names) {
    for (const [label, results] of Object.entries(report.targets)) {
        console.log(`\nMinified bytes per package (${label}):`);
        for (const name of names) {
            const breakdown = results[name]?.breakdown;
            if (!breakdown) continue;
            const parts = Object.entries(breakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([pkg, bytes]) => `${pkg.replace('ag-charts-', '')} ${kB(bytes)} kB`);
            console.log(`  ${name}: ${parts.join(', ')}`);
        }
    }
}

const selected = scenarios.filter(({ name }) => !args.filter || name.includes(args.filter));
const report = { generatedAt: new Date().toISOString(), targets: {} };

if (args.baseline) {
    const baseline = JSON.parse(readFileSync(args.baseline, 'utf8'));
    for (const [label, results] of Object.entries(baseline.targets)) {
        report.targets[`${label} (${args.baseline})`] = results;
    }
}

for (const target of args.targets.split(',').filter(Boolean)) {
    const resolveDir = resolveTarget(target);
    const label = target === 'local' ? `local@${gitHead()}` : target;
    report.targets[label] = {};
    for (const scenario of selected) {
        report.targets[label][scenario.name] = await measure(resolveDir, scenario);
    }
}

function gitHead() {
    try {
        return execFileSync('git', ['-C', repoRoot, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
    } catch {
        return 'unknown';
    }
}

const names = selected.map(({ name }) => name);
printTable(report, names);
if (args.breakdown) printBreakdown(report, names);
if (args.json) {
    mkdirSync(dirname(resolve(args.json)), { recursive: true });
    writeFileSync(args.json, JSON.stringify(report, null, 2));
    console.error(`\nWrote ${args.json}`);
}
