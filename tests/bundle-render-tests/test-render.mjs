import { JSDOM } from 'jsdom';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
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

function generateEntry(pkg, modules, chartOptions) {
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
// Rendering
// ---------------------------------------------------------------------------

const RENDER_TIMEOUT = 30_000;

async function bundleAndRender(entryCode, entryFile, bundler, outFile) {
    writeFileSync(entryFile, entryCode);
    await bundler.fn({ entry: entryFile, outFile });

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
            const timeout = setTimeout(() => fail(new Error(`Render timeout (${RENDER_TIMEOUT}ms)`)), RENDER_TIMEOUT);
            chart.waitForUpdate().then(() => {
                clearTimeout(timeout);
                ok();
            }, fail);
        });

        const buffer = mainCanvas.toBufferSync('png');
        chart.destroy();
        return buffer;
    } finally {
        env.dispose();
    }
}

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------

function compareBuffers(actualBuffer, expectedBuffer, name) {
    const actual = PNG.sync.read(actualBuffer);
    const expected = PNG.sync.read(expectedBuffer);

    if (actual.width !== expected.width || actual.height !== expected.height) {
        return `Dimension mismatch: ${actual.width}x${actual.height} vs ${expected.width}x${expected.height}`;
    }

    const { width, height } = actual;
    const diff = new PNG({ width, height });
    const numDiff = pixelmatch(actual.data, expected.data, diff.data, width, height, { threshold: 0.1 });
    const diffPct = (numDiff * 100) / (width * height);

    if (diffPct > 0.5) {
        writeFileSync(join(outputDir, `${name}-diff.png`), PNG.sync.write(diff));
        return `${diffPct.toFixed(2)}% pixels different`;
    }

    return null;
}

function assertNonBlank(buffer) {
    const png = PNG.sync.read(buffer);
    const { data, width, height } = png;
    let nonWhite = 0;
    for (let i = 0; i < data.length; i += 4) {
        if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) nonWhite++;
    }
    const pct = (nonWhite * 100) / (width * height);
    if (pct < 1) return `Rendered image is blank (${pct.toFixed(2)}% non-white pixels)`;
    return null;
}

// ---------------------------------------------------------------------------
// Main
//
// For each partial scenario × bundler:
//   1. Render the scenario's chart options using the FULL bundle (baseline)
//   2. Render the same chart options using the PARTIAL bundle
//   3. Compare — if they match, tree-shaking didn't break the chart
//
// Both renders happen in the same environment and run, eliminating
// cross-platform font rendering differences.
// ---------------------------------------------------------------------------

const results = [];

// Determine the full module name per package
const FULL_MODULES = {
    'ag-charts-community': ['AllCommunityModule'],
    'ag-charts-enterprise': ['AllEnterpriseModule'],
};

// Track per-bundler entry counters to avoid import() cache collisions
let entryCounter = 0;

for (const scenario of scenarios) {
    const safeName = scenario.name.replace(/\//g, '_');
    const isFullScenario = scenario.name.endsWith('/full');

    for (const bundler of bundlers) {
        const testName = `${scenario.name} [${bundler.name}]`;

        try {
            if (isFullScenario) {
                // Full scenarios: just assert non-blank render
                const dir = join(workDir, safeName, bundler.name);
                mkdirSync(dir, { recursive: true });
                const entry = join(dir, `entry_${entryCounter++}.mjs`);
                const out = join(dir, `output_${entryCounter}.mjs`);

                const code = generateEntry(scenario.package, scenario.modules, scenario.chartOptions);
                const buffer = await bundleAndRender(code, entry, bundler, out);
                writeFileSync(join(outputDir, `${safeName}_${bundler.name}.png`), buffer);

                const blankErr = assertNonBlank(buffer);
                results.push({ name: testName, status: blankErr ? 'FAIL' : 'pass', error: blankErr });
            } else {
                // Partial scenarios: render with full bundle, then with partial, compare
                const fullModules = FULL_MODULES[scenario.package];
                const dir = join(workDir, safeName, bundler.name);
                mkdirSync(dir, { recursive: true });

                // Baseline: full bundle, same chart options
                const fullEntry = join(dir, `full_${entryCounter++}.mjs`);
                const fullOut = join(dir, `full_output_${entryCounter}.mjs`);
                const fullCode = generateEntry(scenario.package, fullModules, scenario.chartOptions);
                const fullBuffer = await bundleAndRender(fullCode, fullEntry, bundler, fullOut);
                writeFileSync(join(outputDir, `${safeName}_${bundler.name}_full.png`), fullBuffer);

                // Partial bundle, same chart options
                const partialEntry = join(dir, `partial_${entryCounter++}.mjs`);
                const partialOut = join(dir, `partial_output_${entryCounter}.mjs`);
                const partialCode = generateEntry(scenario.package, scenario.modules, scenario.chartOptions);
                const partialBuffer = await bundleAndRender(partialCode, partialEntry, bundler, partialOut);
                writeFileSync(join(outputDir, `${safeName}_${bundler.name}_partial.png`), partialBuffer);

                // Compare
                const blankErr = assertNonBlank(partialBuffer);
                if (blankErr) {
                    results.push({ name: testName, status: 'FAIL', error: blankErr });
                    continue;
                }
                const diffErr = compareBuffers(partialBuffer, fullBuffer, `${safeName}_${bundler.name}`);
                results.push({ name: testName, status: diffErr ? 'FAIL' : 'pass', error: diffErr });
            }
        } catch (err) {
            results.push({ name: testName, status: 'ERROR', error: err.stack || err.message });
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
    const ok = r.status === 'pass';
    if (!ok) hasFailure = true;
    const statusStr = r.status === 'pass' ? 'PASS' : `FAIL: ${r.error}`;
    console.log(`${pad(r.name, 55)} ${statusStr}`);
}

console.log('='.repeat(90));
const passed = results.filter((r) => r.status === 'pass').length;
console.log(`\n${passed}/${results.length} passed, ${results.length - passed} failed`);

if (hasFailure) process.exit(1);
