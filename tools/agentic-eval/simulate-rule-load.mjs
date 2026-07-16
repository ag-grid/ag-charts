#!/usr/bin/env node
// Simulates which .claude/rules files auto-attach for a given file path, and the
// context cost (word count) of the attached set. Uses picomatch — the same glob
// semantics family Claude Code uses for rule `paths` frontmatter.
//
// Usage:
//   node tools/agentic-eval/simulate-rule-load.mjs [--rules-dir <dir>] <file-path> [...more paths]
//   node tools/agentic-eval/simulate-rule-load.mjs            # runs the built-in representative sample set
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const picomatch = require('picomatch');

const DEFAULT_SAMPLES = [
    'packages/ag-charts-community/src/chart/series/cartesian/barSeries.test.ts',
    'packages/ag-charts-community/src/chart/series/cartesian/barSeries.ts',
    'packages/ag-charts-community/src/chart/chart.ts',
    'packages/ag-charts-community/src/chart/axis/axis.test.ts',
    'packages/ag-charts-community/src/scale/colorScale.test.ts',
    'packages/ag-charts-community/src/module/optionsModule.ts',
    'packages/ag-charts-enterprise/src/features/zoom/zoom.ts',
    'packages/ag-charts-types/src/chart/chartOptions.ts',
    'packages/ag-charts-locale/src/en-US.ts',
    'packages/ag-charts-website/src/content/docs/axes/index.mdoc',
    'packages/ag-charts-website/src/content/docs/axes/_examples/basic/main.ts',
    'packages/ag-charts-website/src/content/docs/benchmarks/_examples/large-scale/main.ts',
    'packages/ag-charts-website/src/pages/gallery.astro',
    'packages/ag-charts-website/e2e/zoom.spec.ts',
    'packages/ag-charts-community/benchmarks/large-scale.benchmark.ts',
];

const args = process.argv.slice(2);
let rulesDir = '.claude/rules';
const paths = [];
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--rules-dir') {
        rulesDir = args[++i];
    } else {
        paths.push(args[i]);
    }
}
const samples = paths.length ? paths : DEFAULT_SAMPLES;

const rules = fs
    .readdirSync(rulesDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
        const src = fs.readFileSync(path.join(rulesDir, f), 'utf8');
        const words = src.split(/\s+/).filter(Boolean).length;
        const frontmatter = src.match(/^---\n([\s\S]*?)\n---/);
        const globs = frontmatter
            ? [...frontmatter[1].matchAll(/^\s*-\s+(.+)$/gm)].map((m) => m[1].trim().replace(/^'|'$/g, ''))
            : [];
        return { file: f, words, globs, matchers: globs.map((g) => picomatch(g, { dot: true })) };
    });

const alwaysOn = rules.filter((r) => r.globs.length === 0);
console.log(
    `always-on (no globs): ${alwaysOn.reduce((a, r) => a + r.words, 0)} words — ${alwaysOn.map((r) => r.file).join(', ')}\n`
);

let grandTotal = 0;
for (const sample of samples) {
    const hits = rules.filter((r) => r.matchers.some((fn) => fn(sample)));
    const total = hits.reduce((a, r) => a + r.words, 0);
    grandTotal += total;
    console.log(`${sample}\n  -> ${hits.length} rules, ${total} words`);
    for (const r of hits) console.log(`     ${r.file} (${r.words}w)`);
}
console.log(`\nTOTAL across ${samples.length} sample paths: ${grandTotal} words`);
