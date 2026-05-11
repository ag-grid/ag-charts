// Discovers the (page, example, framework) matrix for the A/B smoke test.
// Walks packages/ag-charts-website/src/content/**/_examples/*/main.ts,
// applies the merged EXAMPLE_OPTIONS config (gallery + docs), and emits a
// JSON list to stdout.
//
// Run from repo root:
//   node plans/examples-ab-smoke/discover.mjs --framework vanilla > matrix.json
//   node plans/examples-ab-smoke/discover.mjs --filter "page=gallery" --framework reactFunctional

import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { glob } from 'node:fs/promises';

import { resolveOptions, IGNORE_PAGES, FRAMEWORKS, isUnsupportedGeneric } from './example-options.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function parseArgs(argv) {
    const args = { filter: null, framework: null };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--filter') args.filter = argv[++i];
        else if (a === '--framework') args.framework = argv[++i];
    }
    return args;
}

function findRepoRoot(start) {
    let cur = start;
    while (cur !== '/') {
        try {
            statSync(resolve(cur, 'package.json'));
            statSync(resolve(cur, 'packages/ag-charts-website'));
            return cur;
        } catch {}
        cur = dirname(cur);
    }
    throw new Error('could not locate ag-charts repo root from ' + start);
}

const ROOT = findRepoRoot(__dirname);
const CONTENT_DIR = resolve(ROOT, 'packages/ag-charts-website/src/content');

async function main() {
    const args = parseArgs(process.argv.slice(2));

    if (!args.framework) {
        process.stderr.write('discover.mjs requires --framework <name> (one of: vanilla, typescript, reactFunctional, reactFunctionalTs, angular, vue3)\n');
        process.exit(2);
    }
    if (!FRAMEWORKS.includes(args.framework)) {
        process.stderr.write(`unknown framework "${args.framework}"; expected one of ${FRAMEWORKS.join(', ')}\n`);
        process.exit(2);
    }

    let filterRe = null;
    if (args.filter) {
        const m = /^page=(.+)$/.exec(args.filter);
        if (!m) {
            process.stderr.write('--filter must look like page=<regex>\n');
            process.exit(2);
        }
        filterRe = new RegExp(`^(${m[1]})$`);
    }

    // Drift check (synchronous part — done inline for simplicity).
    const sources = [
        'packages/ag-charts-website/e2e/example-options.ts',
        'packages/ag-charts-website/e2e/gallery-examples.spec.ts',
    ];
    const { DOCS_OPTIONS, GALLERY_OPTIONS } = await import('./example-options.mjs');
    const mirrorKeys = new Set([...Object.keys(DOCS_OPTIONS), ...Object.keys(GALLERY_OPTIONS)]);
    for (const rel of sources) {
        let src;
        try {
            src = readFileSync(resolve(ROOT, rel), 'utf8');
        } catch {
            continue;
        }
        const re = /^ {4}'([a-z0-9-]+)'\s*:\s*\{/gm;
        let m;
        while ((m = re.exec(src)) != null) {
            if (!mirrorKeys.has(m[1])) {
                process.stderr.write(`drift: ${rel} has '${m[1]}' missing from config/example-options.mjs — please sync.\n`);
            }
        }
    }

    const matrix = [];
    const skipped = { hidden: 0, ignored: 0, filtered: 0, unsupported: 0 };

    for await (const file of glob('**/_examples/*/main.ts', { cwd: CONTENT_DIR })) {
        const astroPath = file; // e.g. 'docs/legend/_examples/legend-position/main.ts'
        const [pagePath, examplePath] = astroPath.split('/_examples/');
        const example = examplePath.replace(/\/[a-zA-Z-]+\.ts$/, '');
        const page = pagePath.replace(/^docs\//, '');

        if (IGNORE_PAGES.includes(page)) {
            skipped.ignored++;
            continue;
        }
        if (filterRe && !filterRe.test(page)) {
            skipped.filtered++;
            continue;
        }

        const options = resolveOptions(page, example);
        if (options.status === '404') {
            skipped.hidden++;
            continue;
        }
        if (isUnsupportedGeneric(page, example)) {
            skipped.unsupported++;
            continue;
        }

        const allowedFrameworks = page === 'gallery'
            ? ['vanilla'] // gallery uses vanilla URL only
            : (options.frameworks?.length ? options.frameworks : FRAMEWORKS);
        if (!allowedFrameworks.includes(args.framework)) {
            continue;
        }

        matrix.push({
            page,
            pagePath,
            example,
            framework: args.framework,
            options: {
                clickOrder: options.clickOrder,
                skipCanvasUpdateCheck: options.skipCanvasUpdateCheck,
                ignoreConsoleWarnings: options.ignoreConsoleWarnings,
            },
        });
    }

    process.stderr.write(
        `Discovered ${matrix.length} examples for framework=${args.framework} (skipped ${skipped.hidden} hidden, ${skipped.ignored} ignored, ${skipped.filtered} filtered, ${skipped.unsupported} unsupported-generic).\n`
    );

    process.stdout.write(JSON.stringify(matrix, null, 2) + '\n');
}

main().catch((err) => {
    process.stderr.write(`discover.mjs failed: ${err.stack ?? err.message}\n`);
    process.exit(1);
});
