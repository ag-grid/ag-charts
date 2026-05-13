// A/B smoke-test runner — exercises every example in the matrix on each side
// and records per-phase outcomes. Product-agnostic orchestration; product-specific
// selectors, phases, and wait logic are loaded from a profile (see profiles/).
//
// Inputs:
//   SIDES_FILE   (default: ./sides.json)   { left, right, framework, product }
//   MATRIX_FILE  (default: ./matrix.json)  output of discover.mjs
//   OUTPUT_DIR   (default: ./)
//   CONCURRENCY  (default: 4)
//   PRODUCT      (default: from sides.json or auto-detect)
//
// Env overrides:
//   LEFT_BASE_URL, LEFT_NAME, RIGHT_BASE_URL, RIGHT_NAME, FRAMEWORK

import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadProfile, resolveProduct } from './load-profile.mjs';
import {
    sleep, newPhase, pushException, snapshotErrorCounts,
    pushErrorExceptionsSince, dismissCookieBanner,
} from './profiles/shared.mjs';

process.stderr._handle?.setBlocking?.(true);
process.stdout._handle?.setBlocking?.(true);

const OUTPUT_DIR = resolve(process.env.OUTPUT_DIR ?? '.');
const SCREENSHOT_ROOT = `${OUTPUT_DIR}/screenshots`;
const RESULTS_PATH = `${OUTPUT_DIR}/results.json`;
const SIDES_FILE = resolve(process.env.SIDES_FILE ?? `${OUTPUT_DIR}/sides.json`);
const MATRIX_FILE = resolve(process.env.MATRIX_FILE ?? `${OUTPUT_DIR}/matrix.json`);
const CONCURRENCY = parseInt(process.env.CONCURRENCY ?? '4', 10);
const RERUN_EXCEPTIONS = process.env.RERUN_EXCEPTIONS === '1';

mkdirSync(SCREENSHOT_ROOT, { recursive: true });

if (!existsSync(SIDES_FILE)) {
    console.error(`SIDES_FILE not found: ${SIDES_FILE}`);
    process.exit(2);
}
if (!existsSync(MATRIX_FILE)) {
    console.error(`MATRIX_FILE not found: ${MATRIX_FILE} (run discover.mjs first)`);
    process.exit(2);
}

const sidesRaw = JSON.parse(readFileSync(SIDES_FILE, 'utf8'));
const matrix = JSON.parse(readFileSync(MATRIX_FILE, 'utf8'));

function applySideEnv(side, prefix) {
    return {
        name: process.env[`${prefix}_NAME`] ?? side.name,
        baseUrl: process.env[`${prefix}_BASE_URL`] ?? side.baseUrl,
    };
}

const sides = {
    left: applySideEnv(sidesRaw.left, 'LEFT'),
    right: applySideEnv(sidesRaw.right, 'RIGHT'),
};
const framework = process.env.FRAMEWORK ?? sidesRaw.framework;

for (const [k, s] of Object.entries(sides)) {
    if (!s.baseUrl) {
        console.error(`Side ${k} is missing baseUrl`);
        process.exit(2);
    }
}
if (!framework) {
    console.error('framework missing — set sides.json `framework` or FRAMEWORK env var');
    process.exit(2);
}

const productSlug = resolveProduct({
    sidesJson: sidesRaw,
    envProduct: process.env.PRODUCT,
});
if (!productSlug) {
    console.error('Could not determine product — set PRODUCT env var or add "product" to sides.json');
    process.exit(2);
}

const profile = await loadProfile(productSlug);

function buildUrl(side, entry) {
    return `${profile.buildExampleUrl(side.baseUrl, entry)}#e2e=true`;
}

async function captureOne(browser, side, entry) {
    const url = buildUrl(side, entry);
    const sideKey = side.name;
    const screenshotDir = `${SCREENSHOT_ROOT}/${sideKey}`;
    const result = {
        side: sideKey,
        page: entry.page,
        example: entry.example,
        framework: entry.framework,
        url,
        consoleErrors: [],
        consoleWarnings: [],
        pageErrors: [],
        contentReady: false,
        phases: {},
        notes: [],
    };

    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();

    page.on('console', (msg) => {
        const type = msg.type();
        const text = msg.text();
        const location = msg.location?.();
        if (profile.isNoise(text, location)) return;
        if (type === 'error') result.consoleErrors.push(text);
        else if (type === 'warning' || type === 'warn') result.consoleWarnings.push(text);
    });
    page.on('pageerror', (err) => result.pageErrors.push(err.message));

    const initialErrBefore = snapshotErrorCounts(result);

    try {
        const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
        if (resp && !resp.ok() && resp.status() !== 304) {
            result.notes.push(`HTTP ${resp.status()}`);
            const phase = newPhase('initial');
            pushException(phase, 'navigation-error', { httpStatus: resp.status() });
            result.phases.initial = phase;
            await context.close();
            return result;
        }
    } catch (err) {
        const phase = newPhase('initial');
        pushException(phase, 'navigation-error', { error: err.message });
        result.phases.initial = phase;
        await context.close();
        return result;
    }

    await dismissCookieBanner(page);

    const contentReady = await profile.waitForContent(page);
    result.contentReady = contentReady;
    // For backwards compat with Charts reports that check canvasFound.
    result.canvasFound = contentReady;
    await profile.waitForReady(page);

    const skipCheck = await profile.shouldSkipPhases(page, result);
    if (skipCheck.skip) {
        const initial = newPhase('initial');
        const out = `${screenshotDir}/${entry.page}-${entry.example}-${entry.framework}-initial.png`;
        mkdirSync(screenshotDir, { recursive: true });
        try {
            await page.screenshot({ path: out, fullPage: false, timeout: 10000 });
            initial.screenshots.push({ phase: 'initial', path: out });
        } catch (err) {
            pushException(initial, 'screenshot-error', { error: err.message });
        }
        initial.notes.push(skipCheck.reason);
        result.phases.initial = initial;
        result.notes.push(skipCheck.reason);
        await context.close();
        return result;
    }

    const ctx = {
        page, entry, side, sideKey, result, profile, screenshotDir,
        initialErrBefore,
        helpers: {
            newPhase, pushException, snapshotErrorCounts,
            pushErrorExceptionsSince, sleep, dismissCookieBanner,
        },
        state: {},
    };

    if (profile.prepareState) {
        await profile.prepareState(ctx);
    }

    for (const phaseDef of profile.PHASES) {
        if (phaseDef.guard && !phaseDef.guard(ctx)) continue;
        const phase = await phaseDef.run(ctx);
        if (phase) result.phases[phaseDef.name] = phase;
    }

    await context.close();
    return result;
}

async function captureBoth(browser, entry) {
    const [left, right] = await Promise.all([
        captureOne(browser, sides.left, entry),
        captureOne(browser, sides.right, entry),
    ]);

    // Flag legend-visibility asymmetry (Charts-specific but harmless for other products).
    const legendAsymmetry = !!left.legendVisible !== !!right.legendVisible
        && (left.phases || right.phases);
    if (legendAsymmetry) {
        const target = left.legendVisible ? left : right;
        const phaseName = target.phases?.['legend-hover'] ? 'legend-hover' : 'legend-toggle';
        const phase = target.phases?.[phaseName];
        if (phase) {
            phase.exceptions = phase.exceptions ?? [];
            phase.exceptions.push({
                type: 'legend-asymmetry',
                leftVisible: !!left.legendVisible,
                rightVisible: !!right.legendVisible,
            });
        }
    }

    return {
        page: entry.page,
        example: entry.example,
        framework: entry.framework,
        randomData: entry.randomData,
        left,
        right,
    };
}

async function runPool(items, fn) {
    const results = new Array(items.length);
    let next = 0;
    let done = 0;
    const workers = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
        while (true) {
            const i = next++;
            if (i >= items.length) return;
            try {
                results[i] = await fn(items[i], i);
            } catch (err) {
                results[i] = {
                    page: items[i].page,
                    example: items[i].example,
                    framework: items[i].framework,
                    error: err.message,
                };
            }
            done++;
            const e = items[i];
            process.stderr.write(`   [${done}/${items.length}] ${e.page}/${e.example} (${e.framework})\n`);
        }
    });
    await Promise.all(workers);
    return results;
}

async function fetchSideMetadata(side) {
    if (!profile.META_ENDPOINT) return { meta: null, error: 'no endpoint' };
    const baseUrl = side.baseUrl.replace(/\/$/, '');
    try {
        const res = await fetch(`${baseUrl}${profile.META_ENDPOINT}`);
        if (!res.ok) return { meta: null, error: `HTTP ${res.status}` };
        return { meta: await res.json(), error: null };
    } catch (err) {
        return { meta: null, error: err.message };
    }
}

function resultHasFailure(r) {
    if (!r) return true;
    if (r.error) return true;
    let sawAnySide = false;
    for (const side of ['left', 'right']) {
        const s = r[side];
        if (!s) continue;
        sawAnySide = true;
        if (s.error) return true;
        for (const phase of Object.values(s.phases ?? {})) {
            if (phase.exceptions?.length) return true;
            for (const d of phase.imageDiffs ?? []) {
                if (typeof d.percent === 'number' && d.percent > 0) return true;
            }
        }
    }
    return !sawAnySide;
}

(async () => {
    const browser = await chromium.launch({ headless: true });
    let filtered = matrix.filter((e) => e.framework === framework);
    const dropped = matrix.length - filtered.length;

    let priorBundle = null;
    if (RERUN_EXCEPTIONS) {
        if (!existsSync(RESULTS_PATH)) {
            process.stderr.write(`RERUN_EXCEPTIONS=1 requires existing ${RESULTS_PATH} — run a full sweep first.\n`);
            await browser.close();
            process.exit(2);
        }
        priorBundle = JSON.parse(readFileSync(RESULTS_PATH, 'utf8'));
        const failingKeys = new Set();
        for (const r of priorBundle.results ?? []) {
            if (resultHasFailure(r)) failingKeys.add(`${r.page}/${r.example}/${r.framework}`);
        }
        const before = filtered.length;
        filtered = filtered.filter((e) => failingKeys.has(`${e.page}/${e.example}/${e.framework}`));
        process.stderr.write(
            `>> RERUN_EXCEPTIONS=1: ${filtered.length} of ${before} matrix entries had prior exceptions or pixel diffs\n`
        );
    }

    process.stderr.write(
        `>> ${filtered.length} examples × 2 sides @ concurrency=${CONCURRENCY}\n` +
            `   product=${profile.PRODUCT}, framework=${framework}\n` +
            `   left=${sides.left.name} (${sides.left.baseUrl})\n` +
            `   right=${sides.right.name} (${sides.right.baseUrl})\n`
    );
    if (dropped > 0) {
        process.stderr.write(`   skipped ${dropped} matrix entries with a different framework\n`);
    }
    if (filtered.length === 0) {
        process.stderr.write(
            RERUN_EXCEPTIONS
                ? `   no prior failures to rerun; clean state.\n`
                : `   no matrix entries match framework=${framework}; re-run discover.mjs with --framework ${framework}\n`
        );
        await browser.close();
        process.exit(RERUN_EXCEPTIONS ? 0 : 2);
    }
    const [leftMeta, rightMeta] = await Promise.all([fetchSideMetadata(sides.left), fetchSideMetadata(sides.right)]);
    const sideMetadata = { left: leftMeta, right: rightMeta };
    for (const [k, m] of Object.entries(sideMetadata)) {
        if (m.error) process.stderr.write(`   ${k} metadata fetch failed: ${m.error}\n`);
        else if (m.meta?.git?.shortHash)
            process.stderr.write(
                `   ${k}: ${profile.PRODUCT_SHORT} ${m.meta?.versions?.[profile.PRODUCT_SHORT] ?? m.meta?.versions?.charts ?? '?'} @ ${m.meta.git.shortHash} (${m.meta.git.date ?? '?'})\n`
            );
    }

    const fresh = await runPool(filtered, async (entry) => captureBoth(browser, entry));
    await browser.close();

    if (RERUN_EXCEPTIONS && priorBundle) {
        const idx = new Map();
        priorBundle.results.forEach((r, i) => idx.set(`${r.page}/${r.example}/${r.framework}`, i));
        let replaced = 0;
        for (const f of fresh) {
            const i = idx.get(`${f.page}/${f.example}/${f.framework}`);
            if (i != null) {
                priorBundle.results[i] = f;
                replaced++;
            }
        }
        priorBundle.sides = sides;
        priorBundle.framework = framework;
        priorBundle.product = profile.PRODUCT;
        priorBundle.sideMetadata = sideMetadata;
        writeFileSync(RESULTS_PATH, JSON.stringify(priorBundle, null, 2));
        console.log(`Merged ${replaced} fresh results into ${RESULTS_PATH} (total ${priorBundle.results.length})`);
    } else {
        writeFileSync(
            RESULTS_PATH,
            JSON.stringify({ sides, framework, product: profile.PRODUCT, sideMetadata, results: fresh }, null, 2)
        );
        console.log(`Wrote ${fresh.length} results to ${RESULTS_PATH}`);
    }

    if (process.env.SKIP_AUTO_CHAIN === '1') {
        process.stderr.write(`SKIP_AUTO_CHAIN=1 — not running diff.mjs / triage-queue.mjs\n`);
        return;
    }
    const scriptDir = dirname(fileURLToPath(import.meta.url));
    for (const next of ['diff.mjs', 'triage-queue.mjs']) {
        process.stderr.write(`>> auto-chaining ${next}\n`);
        const res = spawnSync(process.execPath, [resolve(scriptDir, next)], {
            stdio: 'inherit',
            env: { ...process.env, OUTPUT_DIR },
        });
        if (res.status !== 0) {
            process.stderr.write(`!! ${next} exited with status ${res.status}; stopping auto-chain\n`);
            process.exit(res.status ?? 1);
        }
    }
    process.stderr.write(`>> data-gathering complete. Next: launch the AI classification step (see SKILL.md step 6b/6c).\n`);
})();
