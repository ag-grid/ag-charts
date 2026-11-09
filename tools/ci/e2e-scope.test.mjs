import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
    classifyPath,
    computeScope,
    crossBrowserSpecsFromConfig,
    pagesLoadedBySpec,
    sweepFileForPage,
} from './e2e-scope.mjs';

const WEBSITE = 'packages/ag-charts-website';
const DOCS = `${WEBSITE}/src/content/docs`;
const websiteDir = join(dirname(fileURLToPath(import.meta.url)), '../..', WEBSITE);

const SPECS = {
    'docs-page-nav.spec.ts': "toPageUrl('options/')",
    'dynamic.spec.ts': 'toExamplePageUrl(pageName, exampleName, "vanilla")',
    'highlight.spec.ts': "toExamplePageUrl('highlight-e2e', 'one', 'vanilla')",
    'legend.spec.ts': "toExamplePageUrl('legend', 'two', 'vanilla')",
    'zoom.spec.ts': "toExamplePageUrl('zoom-e2e', 'three', 'vanilla')",
    'generated/examples-legend.spec.ts': '',
    'generated/examples-zoom.spec.ts': '',
};
const CROSS_BROWSER = new Set(['zoom.spec.ts']);
const scope = (...files) => computeScope(files, SPECS, CROSS_BROWSER);

test('keeps everything when any file is outside the website', () => {
    for (const path of [
        'packages/ag-charts-community/src/chart/chart.ts',
        '.github/workflows/ci.yml',
        'yarn.lock',
        `${WEBSITE}/package.json`,
        `${WEBSITE}/astro.config.mjs`,
        'external/ag-website-shared/plugins/agLinkChecker.ts',
    ]) {
        assert.equal(scope(`${DOCS}/legend/index.mdoc`, path).scope, 'all', path);
    }
});

test('keeps everything when the e2e harness changes', () => {
    for (const file of ['util.ts', 'fixture.ts', 'a11y/axe-examples.ts', 'shard-timings.pr.json']) {
        assert.equal(scope(`${WEBSITE}/e2e/${file}`).scope, 'all', file);
    }
});

test('keeps everything when there is nothing to classify', () => {
    assert.equal(scope().scope, 'all');
    assert.equal(scope('README.md').scope, 'all');
});

test('a docs example change keeps its page, its sweep and the specs not tied to a page', () => {
    const decision = scope(`${DOCS}/legend/_examples/two/main.ts`);
    assert.equal(decision.scope, 'scoped');
    assert.equal(decision.crossBrowser, false);
    assert.deepEqual(decision.specs, [
        'docs-page-nav.spec.ts',
        'dynamic.spec.ts',
        'generated/examples-legend.spec.ts',
        'legend.spec.ts',
    ]);
});

test('an internal e2e page maps to its base sweep and keeps the specs that load it', () => {
    const { specs, crossBrowser } = scope(`${DOCS}/zoom-e2e/_examples/three/main.ts`);
    assert.ok(specs.includes('zoom.spec.ts'));
    assert.ok(specs.includes('generated/examples-zoom.spec.ts'));
    assert.equal(crossBrowser, true);
});

test('a changed example whose sweep is missing keeps everything', () => {
    assert.equal(scope(`${DOCS}/unknown/_examples/one/main.ts`).scope, 'all');
});

test('a page edit with no examples does not need a sweep', () => {
    const { specs } = scope(`${DOCS}/unknown/index.mdoc`);
    assert.deepEqual(specs, ['docs-page-nav.spec.ts', 'dynamic.spec.ts']);
});

test('a website source change keeps every sweep and the cross-browser job', () => {
    const decision = scope(`${WEBSITE}/src/components/Foo.tsx`);
    assert.equal(decision.crossBrowser, true);
    assert.ok(decision.specs.includes('generated/examples-legend.spec.ts'));
    assert.ok(decision.specs.includes('generated/examples-zoom.spec.ts'));
    assert.ok(!decision.specs.includes('highlight.spec.ts'));
});

test('a changed spec or committed snapshot keeps the spec that owns it', () => {
    assert.ok(scope(`${WEBSITE}/e2e/highlight.spec.ts`).specs.includes('highlight.spec.ts'));
    const snapshot = `${WEBSITE}/e2e/highlight.spec.ts-snapshots/one-chromium-linux.png`;
    assert.ok(scope(snapshot).specs.includes('highlight.spec.ts'));
});

test('a deleted spec is not passed to Playwright', () => {
    assert.ok(!scope(`${WEBSITE}/e2e/gone.spec.ts`).specs.includes('gone.spec.ts'));
});

test('a spec that builds its page at runtime runs on every website PR', () => {
    assert.equal(pagesLoadedBySpec(SPECS['dynamic.spec.ts']), undefined);
    assert.equal(pagesLoadedBySpec("toPageUrl('options/')"), undefined);
    assert.equal(pagesLoadedBySpec("toExamplePageUrl('legend', 'a', 'vanilla'); toPageUrl('options/')"), undefined);
    assert.equal(
        pagesLoadedBySpec("toExamplePageUrl('legend', 'a', 'vanilla'); toExamplePageUrl(page, 'b', 'vanilla')"),
        undefined
    );
    assert.deepEqual(pagesLoadedBySpec("toExamplePageUrls(\n    'legend',\n    'a'\n)"), new Set(['legend']));
});

test('classifies documentation outside the website as irrelevant', () => {
    assert.equal(classifyPath('docs/one-page-designs/x/design.html').kind, 'ignore');
    assert.equal(classifyPath('.rulesync/rules/foo.md').kind, 'ignore');
});

// The checks below read the repo, so a renamed spec or changed generator fails here rather than
// silently narrowing or widening what a PR runs.

test('every page a spec names exists, so a typo cannot hide a dependency', () => {
    const pages = new Set(readdirSync(join(websiteDir, 'src/content/docs')));
    for (const file of readdirSync(join(websiteDir, 'e2e')).filter((f) => f.endsWith('.spec.ts'))) {
        const loaded = pagesLoadedBySpec(readFileSync(join(websiteDir, 'e2e', file), 'utf8'));
        for (const page of loaded ?? []) assert.ok(pages.has(page), `${file} names ${page}`);
    }
});

test('the sweep name matches the test-file generator', () => {
    const generator = readFileSync(join(websiteDir, 'e2e/generate-test-files.ts'), 'utf8');
    assert.ok(generator.includes("const INTERNAL_PAGE_SUFFIXES = ['-test', '-e2e'];"));
    assert.ok(generator.includes('const fileName = `examples-${category.name}.spec.ts`;'));
    assert.equal(sweepFileForPage('legend-test'), 'generated/examples-legend.spec.ts');
    assert.equal(sweepFileForPage('legend-e2e'), 'generated/examples-legend.spec.ts');
});

test('reads the cross-browser spec names from the Playwright config', () => {
    const config = readFileSync(join(websiteDir, 'playwright.cross-browser.config.ts'), 'utf8');
    const specs = crossBrowserSpecsFromConfig(config);
    assert.ok(specs.has('zoom.spec.ts'));
    assert.ok(specs.has('cross-browser.spec.ts'));
});
