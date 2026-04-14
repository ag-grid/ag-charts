import { JSDOM } from 'jsdom';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { Canvas, DOMMatrix, Image, Path2D } from 'skia-canvas';

import { bundleWithEsbuild } from './bundlers/esbuild.mjs';
import { bundleWithVite } from './bundlers/vite.mjs';
import { bundleWithWebpack } from './bundlers/webpack.mjs';
import { scenarios } from './scenarios.mjs';

const bundlers = [
    { name: 'esbuild', fn: bundleWithEsbuild },
    { name: 'vite', fn: bundleWithVite },
    { name: 'webpack', fn: bundleWithWebpack },
];

const { values: args } = parseArgs({
    options: {
        update: { type: 'boolean', default: false },
        'snapshots-path': { type: 'string' },
    },
});

const localSnapshotsDir = resolve('e2e', 'render-snapshots');
const outputDir = resolve('output');
const workDir = resolve('.entries');

mkdirSync(outputDir, { recursive: true });

// ---------------------------------------------------------------------------
// SSR environment (replicates ag-charts-server-side internals)
// ---------------------------------------------------------------------------

function createEnvironment() {
    const dom = new JSDOM('<!DOCTYPE html><html><body><div id="container"></div></body></html>', {
        url: 'http://localhost/',
    });
    const win = dom.window;
    win.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
    win.cancelAnimationFrame = (handle) => clearTimeout(handle);
    win.OffscreenCanvas = Canvas;
    win.DOMMatrix = DOMMatrix;
    win.Image = Image;
    win.Path2D = Path2D;

    return {
        window: win,
        document: win.document,
        dispose: () => dom.window.close(),
    };
}

function patchCreateElement(document, getCanvas) {
    const real = document.createElement.bind(document);
    document.createElement = (tag, opts) => {
        if (tag === 'canvas') {
            const canvas = getCanvas();
            const el = real(tag, opts);
            const origGetCtx = el.getContext.bind(el);
            Object.defineProperty(el, 'getContext', {
                value: (id, o) => (id === '2d' ? canvas.getContext('2d') : origGetCtx(id, o)),
                writable: true,
                configurable: true,
            });
            Object.defineProperty(el, 'toDataURL', {
                value: (mime = 'image/png') => canvas.toDataURL(mime.split('/')[1]),
                writable: true,
                configurable: true,
            });
            return el;
        }
        if (tag === 'img') {
            return new Image();
        }
        return real(tag, opts);
    };
}

// ---------------------------------------------------------------------------
// Entry file generation
// ---------------------------------------------------------------------------

function generateEntry(scenario) {
    const { package: pkg, modules, chartOptions } = scenario;

    const allImports = new Set([...modules, 'ModuleRegistry', 'AgCharts']);
    const importLine = `import { ${[...allImports].join(', ')} } from '${pkg}';`;

    return `${importLine}
ModuleRegistry.registerModules([${modules.join(', ')}]);
const options = ${JSON.stringify(chartOptions, null, 2)};
export function createChart(container, document, window) {
    return AgCharts.create({ ...options, container, document, window, skipCss: true, width: 400, height: 300 });
}
`;
}

// ---------------------------------------------------------------------------
// Snapshot helpers
// ---------------------------------------------------------------------------

function compareSnapshot(actualBuffer, snapshotName) {
    const snapshotsDir = args['snapshots-path'] || localSnapshotsDir;
    const snapshotPath = join(snapshotsDir, `${snapshotName}.png`);
    const actualPath = join(outputDir, `${snapshotName}.png`);

    writeFileSync(actualPath, actualBuffer);

    if (args.update) {
        mkdirSync(snapshotsDir, { recursive: true });
        writeFileSync(snapshotPath, actualBuffer);
        return { status: 'updated' };
    }

    if (!existsSync(snapshotPath)) {
        return { status: 'missing', error: `Snapshot not found: ${snapshotPath}. Run with -u to create.` };
    }

    const actual = PNG.sync.read(actualBuffer);
    const expected = PNG.sync.read(readFileSync(snapshotPath));

    if (actual.width !== expected.width || actual.height !== expected.height) {
        return {
            status: 'fail',
            error: `Dimension mismatch: ${actual.width}x${actual.height} vs ${expected.width}x${expected.height}`,
        };
    }

    const { width, height } = actual;
    const diff = new PNG({ width, height });
    const numDiff = pixelmatch(actual.data, expected.data, diff.data, width, height, { threshold: 0.1 });
    const diffPct = (numDiff * 100) / (width * height);

    if (diffPct > 0.5) {
        writeFileSync(join(outputDir, `${snapshotName}-diff.png`), PNG.sync.write(diff));
        return { status: 'fail', error: `${diffPct.toFixed(2)}% pixels different` };
    }

    return { status: 'pass' };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const RENDER_TIMEOUT = 30_000;
const results = [];

for (const scenario of scenarios) {
    const safeName = scenario.name.replace(/\//g, '_');

    // Generate entry once (shared across bundlers)
    const entryDir = join(workDir, safeName);
    mkdirSync(entryDir, { recursive: true });
    const entryFile = join(entryDir, 'entry.mjs');
    writeFileSync(entryFile, generateEntry(scenario));

    for (const bundler of bundlers) {
        const bundlerDir = join(entryDir, bundler.name);
        mkdirSync(bundlerDir, { recursive: true });
        const outFile = join(bundlerDir, 'output.mjs');
        const testName = `${scenario.name} [${bundler.name}]`;
        const snapshotKey = `${safeName}_${bundler.name}`;

        // Phase 1: bundle
        let bundleError;
        try {
            await bundler.fn({ entry: entryFile, outFile });
        } catch (err) {
            bundleError = err.message;
        }

        if (bundleError) {
            results.push({ name: testName, status: 'ERROR', error: `Bundle: ${bundleError}` });
            continue;
        }

        // Phase 2: render via SSR
        const env = createEnvironment();
        const mainCanvas = new Canvas(400, 300);
        const canvasStack = [mainCanvas];
        patchCreateElement(env.document, () => canvasStack.shift() ?? new Canvas(400, 300));

        try {
            const bundleUrl = new URL(`file://${resolve(outFile)}`).href;
            const { createChart } = await import(bundleUrl);
            const container = env.document.getElementById('container');
            const chart = createChart(container, env.document, env.window);

            await new Promise((ok, fail) => {
                const timeout = setTimeout(
                    () => fail(new Error(`Render timeout (${RENDER_TIMEOUT}ms)`)),
                    RENDER_TIMEOUT
                );
                chart.waitForUpdate().then(() => {
                    clearTimeout(timeout);
                    ok();
                }, fail);
            });

            const buffer = mainCanvas.toBufferSync('png');
            chart.destroy();

            // Phase 3: snapshot comparison
            const result = compareSnapshot(buffer, snapshotKey);
            results.push({ name: testName, ...result });
        } catch (err) {
            const renderError = err.stack || err.message;
            results.push({ name: testName, status: 'ERROR', error: `Render: ${renderError}` });
        } finally {
            env.dispose();
        }
    }
}

// ---------------------------------------------------------------------------
// Results table
// ---------------------------------------------------------------------------

console.log();
console.log('Bundle Render Test Results');
console.log('='.repeat(90));

const pad = (s, n) => String(s).padEnd(n);

let hasFailure = false;
for (const r of results) {
    const ok = r.status === 'pass' || r.status === 'updated';
    if (!ok) hasFailure = true;
    const statusStr = r.status === 'pass' ? 'PASS' : r.status === 'updated' ? 'UPDATED' : `FAIL: ${r.error}`;
    console.log(`${pad(r.name, 55)} ${statusStr}`);
}

console.log('='.repeat(90));
const passed = results.filter((r) => r.status === 'pass' || r.status === 'updated').length;
console.log(`\n${passed}/${results.length} passed, ${results.length - passed} failed`);

if (hasFailure) process.exit(1);
