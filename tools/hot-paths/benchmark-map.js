#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Maps changed source files to the browser benchmark examples that exercise them.
 *
 * The example metadata (series types, axis types, test-case ids) is derived from
 * each `_examples/<name>/main.ts` on every run rather than stored, so the map
 * cannot go stale as examples are added, renamed or retyped. Zero dependencies,
 * matching tools/benchmark/benchmark-examples.js.
 *
 * CLI usage:
 *   node benchmark-map.js --list                       # derived metadata for every example
 *   node benchmark-map.js --for <path>[,<path>...]     # recommend examples for changed files
 *   git diff --name-only base | node benchmark-map.js  # same, reading paths from stdin
 *
 * Output for --for is JSON: { tags, examples, command, notes }.
 */

const fs = require('node:fs');
const path = require('node:path');

const EXAMPLES_DIR = path.resolve(__dirname, '../../packages/ag-charts-website/src/content/docs/benchmarks/_examples');
const MAX_RECOMMENDED = 5;

// Examples without a standard harness config — see tools/benchmark/benchmark-examples.js.
const EXCLUDED = new Set(['summary', 'high-freq-high-volume']);

/** Series and axis type strings the examples actually declare, harvested from `type: '...'`. */
function readExample(name) {
    const src = fs.readFileSync(path.join(EXAMPLES_DIR, name, 'main.ts'), 'utf8');
    const types = [...new Set([...src.matchAll(/type: '([a-zA-Z-]+)'/g)].map((m) => m[1]))].sort();
    const ids = [...new Set([...src.matchAll(/\bid: '([a-z0-9-]+)'/g)].map((m) => m[1]))];
    // Some examples build testCases dynamically (data-selection-zoom-*); a literal
    // id list is then absent rather than empty, so say so instead of implying none.
    const dynamic = ids.length === 0 && /testCases[,\s]/.test(src);
    return {
        name,
        types,
        testCases: dynamic ? ['<dynamic>'] : ids,
        enterprise: /ag-charts-enterprise/.test(src),
    };
}

function allExamples() {
    return fs
        .readdirSync(EXAMPLES_DIR, { withFileTypes: true })
        .filter((e) => e.isDirectory() && !EXCLUDED.has(e.name))
        .filter((e) => fs.existsSync(path.join(EXAMPLES_DIR, e.name, 'main.ts')))
        .map((e) => readExample(e.name))
        .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Path patterns to the tags they imply. `types` match an example's declared
 * series/axis types; `names` match example directory names; `cases` match
 * test-case ids. First match wins per rule, and every matching rule contributes.
 */
const RULES = [
    // Series implementations — match the example's series type.
    { re: /(^|\/)(bar|barSeries|barAggregation|barUtil|barShape)/i, types: ['bar'] },
    { re: /(^|\/)(line|lineSeries|lineAggregation|lineUtil|lineInterpolation)/i, types: ['line'] },
    { re: /(^|\/)(area|areaSeries|areaAggregation|areaUtil)/i, types: ['area'] },
    { re: /(^|\/)(scatter|bubble)/i, types: ['scatter'] },
    { re: /(^|\/)ohlc/i, types: ['ohlc'] },
    { re: /(^|\/)candlestick/i, types: ['candlestick'] },
    { re: /(^|\/)range-?bar/i, types: ['range-bar'] },
    { re: /(^|\/)range-?area/i, types: ['range-area'] },
    { re: /(^|\/)(waterfall|histogram|box-plot|heatmap|radar|nightingale)/i, types: ['bar'] },
    { re: /(^|\/)(pie|donut|sunburst|treemap|sankey|chord|funnel|gauge|map-)/i, names: ['large-dataset'] },

    // Scales — match the example's axis type.
    { re: /unitTimeScale/i, types: ['unit-time'] },
    { re: /ordinalTimeScale/i, types: ['ordinal-time'] },
    { re: /(timeScale|time\/)/i, types: ['time'] },
    { re: /(continuousScale|linearScale|logScale)/i, types: ['number'] },
    { re: /(bandScale|ordinalScale|categoryAxis)/i, types: ['category'] },

    // Subsystems — pick the examples whose measured phase covers them.
    { re: /\/chart\/axis\//, names: ['axes-1M-number', 'axes-1M-time', 'axes-1M-unit-time', 'axes-1M-ordinal-time'] },
    {
        re: /\/chart\/data\/|dataSet|dataChangeDescription|dataModel/i,
        cases: ['append-batch', 'remove-batch', 'rolling-window'],
    },
    { re: /\/chart\/interaction\/|zoomManager|zoomUtils|dragInterpreter/i, cases: ['zoom'] },
    {
        re: /\/scene\/|\/motion\/|\/chart\/marker\//,
        names: ['high-perf-bar', 'high-perf-line', 'high-freq-line', 'large-dataset', 'simple-sparkline'],
    },
    { re: /\/dom\/|\/chart\/tooltip\/|highlight/i, cases: ['datum-highlight'] },
    {
        re: /labelPlacement|textWrapper|seriesLabel|labelFit/i,
        names: ['large-dataset', 'simple-chart', 'multi-series'],
    },
    { re: /seriesAreaManager|pickManager|quadtree/i, cases: ['datum-highlight', 'zoom'] },
    { re: /\/utils\/aggregation|Aggregation\.ts$|aggregationManager/i, cases: ['zoom'] },
    { re: /sparkline/i, names: ['simple-sparkline'] },
    { re: /integrated/i, names: ['integrated-large-scale'] },
    { re: /epochColumns|numberArray|bigint/i, names: ['high-volume-bigint', 'high-volume-iso-datetime'] },

    // Bundle surface — benchmarks are the wrong instrument.
    {
        re: /\/module\/|\/module-bundles\/|src\/main\.ts$/,
        note: 'Bundle surface: check the `.size-limit.js` budgets rather than the benchmarks.',
    },
];

function tagsFor(paths) {
    const types = new Set();
    const names = new Set();
    const cases = new Set();
    const notes = new Set();
    for (const p of paths) {
        for (const rule of RULES) {
            if (!rule.re.test(p)) continue;
            rule.types?.forEach((t) => types.add(t));
            rule.names?.forEach((n) => names.add(n));
            rule.cases?.forEach((c) => cases.add(c));
            if (rule.note) notes.add(rule.note);
        }
    }
    return { types: [...types], names: [...names], cases: [...cases], notes: [...notes] };
}

/** Score each example against the tags; higher is a closer match. */
function recommend(paths) {
    const tags = tagsFor(paths);
    const scored = allExamples()
        .map((ex) => {
            let score = 0;
            const why = [];
            if (tags.names.includes(ex.name)) {
                score += 3;
                why.push('subsystem');
            }
            const typeHits = ex.types.filter((t) => tags.types.includes(t));
            if (typeHits.length > 0) {
                score += 2 * typeHits.length;
                why.push(`type:${typeHits.join('+')}`);
            }
            const caseHits = ex.testCases.filter((c) => tags.cases.includes(c));
            if (caseHits.length > 0) {
                score += 1;
                why.push(`case:${caseHits.join('+')}`);
            }
            return { ...ex, score, why };
        })
        .filter((ex) => ex.score > 0)
        .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
        .slice(0, MAX_RECOMMENDED);

    return {
        tags,
        examples: scored.map(({ name, score, why, testCases }) => ({ name, score, why, testCases })),
        command: scored.length > 0 ? `/benchmarks ${scored.map((e) => e.name).join(' ')}` : null,
        notes: tags.notes,
    };
}

function main() {
    const argv = process.argv.slice(2);
    if (argv.includes('--list')) {
        for (const ex of allExamples()) {
            console.log(
                [
                    ex.name.padEnd(30),
                    ex.enterprise ? 'ent' : 'com',
                    (ex.types.join(',') || '-').padEnd(28),
                    ex.testCases.join(',') || '-',
                ].join(' ')
            );
        }
        return;
    }

    const forIdx = argv.indexOf('--for');
    let paths = [];
    if (forIdx !== -1 && argv[forIdx + 1]) {
        paths = argv[forIdx + 1].split(/[\s,]+/).filter(Boolean);
    } else if (!process.stdin.isTTY) {
        paths = fs.readFileSync(0, 'utf8').split(/\s+/).filter(Boolean);
    }
    if (paths.length === 0) {
        console.error('Usage: benchmark-map.js --list | --for <path>[,<path>...] | <paths on stdin>');
        process.exit(2);
    }
    console.log(JSON.stringify(recommend(paths), null, 2));
}

if (require.main === module) {
    main();
}

module.exports = { allExamples, recommend, tagsFor };
