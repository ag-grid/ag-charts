// Discovers the (page, example, framework) matrix for the A/B smoke test.
// Product-agnostic — loads a product profile to determine content paths,
// options, and framework lists.
//
// Run from repo root:
//   node plans/examples-ab-smoke/discover.mjs --product ag-charts --framework vanilla > matrix.json
//   node plans/examples-ab-smoke/discover.mjs --product ag-grid --framework vanilla --filter "page=getting-started"

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { glob } from 'node:fs/promises';

import { loadProfile, resolveProduct } from './load-profile.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function parseArgs(argv) {
    const args = { filter: null, framework: null, product: null };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--filter') args.filter = argv[++i];
        else if (a === '--framework') args.framework = argv[++i];
        else if (a === '--product') args.product = argv[++i];
    }
    return args;
}

function findRepoRoot(start, fingerprint) {
    let cur = start;
    while (cur !== '/') {
        try {
            statSync(resolve(cur, 'package.json'));
            if (fingerprint) statSync(resolve(cur, fingerprint));
            return cur;
        } catch {}
        cur = dirname(cur);
    }
    throw new Error(`could not locate repo root from ${start}` +
        (fingerprint ? ` (looking for ${fingerprint})` : ''));
}

async function main() {
    const args = parseArgs(process.argv.slice(2));

    const productSlug = resolveProduct({
        cliProduct: args.product,
        envProduct: process.env.PRODUCT,
    });
    if (!productSlug) {
        process.stderr.write('discover.mjs requires --product <name> or PRODUCT env (one of: ag-charts, ag-grid, ag-studio)\n');
        process.exit(2);
    }

    const profile = await loadProfile(productSlug);

    if (!profile.DISCOVERY) {
        process.stderr.write(`product "${productSlug}" does not support example discovery yet\n`);
        process.exit(2);
    }

    if (!args.framework) {
        process.stderr.write(`discover.mjs requires --framework <name> (one of: ${profile.FRAMEWORKS.join(', ')})\n`);
        process.exit(2);
    }
    if (!profile.FRAMEWORKS.includes(args.framework)) {
        process.stderr.write(`unknown framework "${args.framework}" for ${productSlug}; expected one of ${profile.FRAMEWORKS.join(', ')}\n`);
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

    const ROOT = findRepoRoot(__dirname, profile.DISCOVERY.repoFingerprint);
    const CONTENT_DIR = profile.DISCOVERY.getContentDir(ROOT);

    // Drift check against upstream e2e configs.
    if (profile.DOCS_OPTIONS && profile.GALLERY_OPTIONS) {
        const mirrorKeys = new Set([
            ...Object.keys(profile.DOCS_OPTIONS),
            ...Object.keys(profile.GALLERY_OPTIONS),
        ]);
        for (const rel of profile.DISCOVERY.driftCheckSources) {
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
                    process.stderr.write(`drift: ${rel} has '${m[1]}' missing from example-options — please sync.\n`);
                }
            }
        }
    }

    const matrix = [];
    const skipped = { hidden: 0, ignored: 0, filtered: 0, unsupported: 0 };

    for await (const file of glob(profile.DISCOVERY.contentGlob, { cwd: CONTENT_DIR })) {
        const [pagePath, examplePath] = file.split('/_examples/');
        const example = examplePath.replace(/\/[a-zA-Z-]+\.ts$/, '');
        const page = pagePath.replace(/^docs\//, '');

        if (profile.IGNORE_PAGES.includes(page)) {
            skipped.ignored++;
            continue;
        }
        if (filterRe && !filterRe.test(page)) {
            skipped.filtered++;
            continue;
        }

        const options = profile.resolveOptions(page, example);
        if (options.status === '404') {
            skipped.hidden++;
            continue;
        }
        if (profile.isUnsupportedGeneric(page, example)) {
            skipped.unsupported++;
            continue;
        }

        const galleryPage = profile.DISCOVERY.galleryPage;
        const allowedFrameworks = (galleryPage && page === galleryPage)
            ? (profile.DISCOVERY.galleryFrameworks ?? [args.framework])
            : (options.frameworks?.length ? options.frameworks : profile.FRAMEWORKS);
        if (!allowedFrameworks.includes(args.framework)) {
            continue;
        }

        const exampleDir = resolve(CONTENT_DIR, pagePath, '_examples', example);
        const randomScan = scanForRandomness(exampleDir);

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
            randomData: randomScan,
        });
    }

    process.stderr.write(
        `Discovered ${matrix.length} ${productSlug} examples for framework=${args.framework} ` +
        `(skipped ${skipped.hidden} hidden, ${skipped.ignored} ignored, ${skipped.filtered} filtered, ${skipped.unsupported} unsupported-generic).\n`
    );

    process.stdout.write(JSON.stringify(matrix, null, 2) + '\n');
}

function scanForRandomness(dir) {
    const out = { unseeded: false, seeded: false, files: [] };
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
    for (const e of entries) {
        if (!e.isFile()) continue;
        if (!/\.(ts|js|mts|mjs|cts|cjs|tsx|jsx)$/.test(e.name)) continue;
        let src;
        try { src = readFileSync(resolve(dir, e.name), 'utf8'); } catch { continue; }
        const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\/])\/\/[^\n]*/g, '$1');
        const hits = [];
        if (/\bMath\.random\s*\(/.test(code)) { out.unseeded = true; hits.push('Math.random'); }
        if (/\bseededRandom\b/.test(code)) { out.seeded = true; hits.push('seededRandom'); }
        if (hits.length) out.files.push({ file: e.name, markers: hits });
    }
    return out;
}

main().catch((err) => {
    process.stderr.write(`discover.mjs failed: ${err.stack ?? err.message}\n`);
    process.exit(1);
});
