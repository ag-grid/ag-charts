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

/**
 * What an example measures, derived from its source: the series and axis types it
 * declares, its test-case ids, and the series each dynamic case swaps in.
 *
 * `data-selection-zoom-*` build their cases from a `SERIES_TYPES` list and apply
 * the series at runtime, so neither the ids nor those series appear as a literal
 * `type: '...'`. Deriving them matters: they are the only examples covering
 * bubble and histogram, and reporting them as opaque would let a change to
 * either recommend a benchmark that never runs it.
 */
function readExample(name) {
    const src = fs.readFileSync(path.join(EXAMPLES_DIR, name, 'main.ts'), 'utf8');
    const types = [...new Set([...src.matchAll(/type: '([a-zA-Z-]+)'/g)].map((m) => m[1]))].sort();
    const ids = [...new Set([...src.matchAll(/\bid: '([a-z0-9-]+)'/g)].map((m) => m[1]))];

    const fromSeriesList = ids.length === 0 && /\bid: seriesType\b/.test(src);
    const seriesList = fromSeriesList ? /const SERIES_TYPES = \[([^\]]*)\]/.exec(src) : null;
    const variants = seriesList ? [...seriesList[1].matchAll(/'([a-z0-9-]+)'/g)].map((m) => m[1]) : [];
    // A dynamic shape this does not understand must be visible, not silently empty
    // — `hot-paths.test.js` fails on `<dynamic>` so a new shape gets handled here.
    const dynamic = ids.length === 0 && variants.length === 0 && /testCases[,\s]/.test(src);

    return {
        name,
        types,
        variants,
        testCases: dynamic ? ['<dynamic>'] : ids.length > 0 ? ids : variants,
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

/** camelCase to kebab-case, so one rule covers both conventions in a path. */
function kebab(p) {
    return p.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * A path segment naming a series. Tokens are written kebab-case and matched
 * against both the raw path (`series/box-plot/`) and its kebab form
 * (`boxPlotSeries.ts` → `box-plot-series.ts`).
 *
 * The lookahead is what stops `line` matching `linearScale`, so a scale change
 * does not pull in line-series examples. It is case-sensitive deliberately: under
 * `/i` it would also reject the camelCase boundary in `bubbleSeries.ts`.
 */
function series(pattern) {
    return new RegExp(`(^|/)(${pattern})(?![a-z])`);
}

/**
 * Path patterns to the tags they imply. `types` match an example's declared or
 * variant series/axis types; `names` match example directory names; `cases` match
 * test-case ids. Every matching rule contributes.
 *
 * A series maps only to its own type — never to a structural analogue. Where no
 * example runs that type, the change gets no recommendation and a note saying so;
 * recommending the nearest example instead would produce a clean run that never
 * executed the changed code, which is worse than no evidence at all.
 */
const RULES = [
    // Cartesian series — the examples cover these.
    { re: series('abstract-bar|bar'), types: ['bar'] },
    { re: series('line'), types: ['line'] },
    { re: series('area'), types: ['area'] },
    { re: series('scatter'), types: ['scatter'] },
    { re: series('bubble'), types: ['bubble'] },
    { re: series('histogram'), types: ['histogram'] },
    { re: series('ohlc'), types: ['ohlc'] },
    { re: series('candlestick'), types: ['candlestick'] },
    { re: series('range-bar'), types: ['range-bar'] },
    { re: series('range-area'), types: ['range-area'] },

    // Series with no benchmark example — tagged so the uncovered-type note fires.
    { re: series('waterfall'), types: ['waterfall'] },
    { re: series('box-plot'), types: ['box-plot'] },
    { re: series('heatmap'), types: ['heatmap'] },
    { re: series('radar-line'), types: ['radar-line'] },
    { re: series('radar-area'), types: ['radar-area'] },
    { re: series('radar'), types: ['radar-line', 'radar-area'] },
    { re: series('nightingale'), types: ['nightingale'] },
    { re: series('radial-bar'), types: ['radial-bar'] },
    { re: series('radial-column'), types: ['radial-column'] },
    { re: series('pie'), types: ['pie'] },
    { re: series('donut'), types: ['donut'] },
    { re: series('sunburst'), types: ['sunburst'] },
    { re: series('treemap'), types: ['treemap'] },
    { re: series('sankey'), types: ['sankey'] },
    { re: series('chord'), types: ['chord'] },
    { re: series('funnel'), types: ['funnel'] },
    { re: series('cone-funnel'), types: ['cone-funnel'] },
    { re: series('pyramid'), types: ['pyramid'] },
    { re: series('organization'), types: ['organization'] },
    { re: series('map-line'), types: ['map-line'] },
    { re: series('map-marker'), types: ['map-marker'] },
    { re: series('map-shape'), types: ['map-shape'] },
    { re: series('linear-gauge'), types: ['linear-gauge'] },
    { re: series('radial-gauge'), types: ['radial-gauge'] },

    // Scales — match the example's axis type. The specialised time scales are
    // exclusive: a unitTimeScale change must not also recommend the time-axis example.
    { re: /unitTimeScale/i, types: ['unit-time'] },
    { re: /ordinalTimeScale/i, types: ['ordinal-time'] },
    { re: /(?<!unit|ordinal)timeScale|\/time\//i, types: ['time'] },
    { re: /logScale/i, types: ['log'] },
    { re: /(continuousScale|linearScale)/i, types: ['number'] },
    { re: /(bandScale|ordinalScale|categoryAxis)/i, types: ['category'] },

    // Shared series bases — no concrete series in the path, but every scaled
    // example runs them, so the workflow must still name something to measure.
    {
        re: /\/chart\/series\/[a-z][a-zA-Z]*\.ts$|cartesianSeries|dataModelSeries|polarSeries|abstractBarSeries/,
        names: ['high-perf-bar', 'high-perf-line', 'high-perf-area', 'large-dataset', 'enterprise-1M-line-series'],
    },

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
        // Series rules are kebab-case; scale and subsystem rules are camelCase.
        const forms = [p, kebab(p)];
        for (const rule of RULES) {
            if (!forms.some((f) => rule.re.test(f))) continue;
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
    const examples = allExamples();
    const allScored = examples
        .map((ex) => {
            let score = 0;
            const why = [];
            if (tags.names.includes(ex.name)) {
                score += 3;
                why.push('subsystem');
            }
            // A declared type runs in the example's measured default configuration; a
            // variant only runs in the case that swaps it in, so it scores lower.
            const declaredHits = ex.types.filter((t) => tags.types.includes(t));
            const variantHits = ex.variants.filter((t) => tags.types.includes(t) && !declaredHits.includes(t));
            if (declaredHits.length + variantHits.length > 0) {
                score += 2 * declaredHits.length + variantHits.length;
                why.push(`type:${[...declaredHits, ...variantHits].join('+')}`);
            }
            // A dynamic example's case ids are series names, but its directory name
            // says which interaction it measures — `data-selection-zoom-*` is a zoom
            // example, and a zoom-tagged change must be able to select it.
            const caseHits = [
                ...new Set([
                    ...ex.testCases.filter((c) => tags.cases.includes(c)),
                    ...tags.cases.filter((c) => ex.name.includes(c)),
                ]),
            ];
            if (caseHits.length > 0) {
                score += 1;
                why.push(`case:${caseHits.join('+')}`);
            }
            return { ...ex, score, why };
        })
        .filter((ex) => ex.score > 0)
        .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

    // Cover every changed type before filling the remaining slots by score. A
    // straight top-N lets the highest-scoring type fill every slot, leaving another
    // changed series with no example in the command and no warning either.
    const covers = (ex, t) => ex.types.includes(t) || ex.variants.includes(t);
    const scored = [];
    for (const type of tags.types) {
        if (scored.length >= MAX_RECOMMENDED) break;
        if (scored.some((ex) => covers(ex, type))) continue;
        const best = allScored.find((ex) => covers(ex, type) && !scored.includes(ex));
        if (best) scored.push(best);
    }
    for (const ex of allScored) {
        if (scored.length >= MAX_RECOMMENDED) break;
        if (!scored.includes(ex)) scored.push(ex);
    }
    scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

    // A series with no example cannot be evidenced by the browser suite. Say so
    // rather than falling back to a benchmark that never runs the changed code.
    const inCatalogue = new Set(examples.flatMap((ex) => [...ex.types, ...ex.variants]));
    const uncovered = tags.types.filter((t) => !inCatalogue.has(t));
    const notes = [...tags.notes];
    if (uncovered.length > 0) {
        notes.push(
            `No benchmark example exercises ${uncovered.join(', ')} — the browser suite cannot evidence this change. ` +
                'Profile locally with `/ag-charts:benchmark-profile` instead.'
        );
    }
    // More changed types than slots: name what the command leaves unmeasured.
    const dropped = tags.types.filter((t) => !uncovered.includes(t) && !scored.some((ex) => covers(ex, t)));
    if (dropped.length > 0) {
        notes.push(
            `The ${MAX_RECOMMENDED}-example cap leaves ${dropped.join(', ')} unmeasured; ` +
                'run those separately if the change touches them.'
        );
    }

    return {
        tags,
        examples: scored.map(({ name, score, why, testCases }) => ({ name, score, why, testCases })),
        command: scored.length > 0 ? `/benchmarks ${scored.map((e) => e.name).join(' ')}` : null,
        notes,
    };
}

/**
 * Everything piped in. `readFileSync(0)` fails with EAGAIN here: a pipe from
 * another process is opened non-blocking, so the first read can arrive before
 * any data does. Consuming the stream waits instead.
 */
async function readStdin() {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    return Buffer.concat(chunks).toString('utf8');
}

async function main() {
    const argv = process.argv.slice(2);
    if (argv.includes('--list')) {
        for (const ex of allExamples()) {
            console.log(
                [
                    ex.name.padEnd(30),
                    ex.enterprise ? 'ent' : 'com',
                    ([...new Set([...ex.types, ...ex.variants])].join(',') || '-').padEnd(34),
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
        paths = (await readStdin()).split(/\s+/).filter(Boolean);
    }
    if (paths.length === 0) {
        console.error('Usage: benchmark-map.js --list | --for <path>[,<path>...] | <paths on stdin>');
        process.exit(2);
    }
    console.log(JSON.stringify(recommend(paths), null, 2));
}

if (require.main === module) {
    main().catch((err) => {
        console.error(err.message);
        process.exit(1);
    });
}

module.exports = { allExamples, recommend, tagsFor };
