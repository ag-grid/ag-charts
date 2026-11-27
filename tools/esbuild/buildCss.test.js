const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { VERSION_PLACEHOLDER } = require('../../esbuild.config.css.cjs');
const { buildCss } = require('./build-css');

const COMMUNITY = 'packages/ag-charts-community';
const ENTERPRISE = 'packages/ag-charts-enterprise';
const ROOT = path.resolve(__dirname, '../..');
const version = /'([^']+)'/.exec(
    fs.readFileSync(path.join(ROOT, COMMUNITY, 'src/version.ts'), 'utf8').split('VERSION')[1]
)[1];

const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'build-css-'));
const read = (name) => fs.readFileSync(path.join(outDir, name, `${name}.css`), 'utf8');

test.before(async () => {
    await buildCss(COMMUNITY, path.join(outDir, 'ag-charts-community'));
    await buildCss(ENTERPRISE, path.join(outDir, 'ag-charts-enterprise'));
});
test.after(() => fs.rmSync(outDir, { recursive: true, force: true }));

test('the community stylesheet carries its marker and the JS version', () => {
    const css = read('ag-charts-community');
    assert.match(css, /--ag-charts-css-loaded:\s*1/);
    assert.ok(css.includes(`--ag-charts-css-version: "${version}"`));
    assert.ok(!css.includes(VERSION_PLACEHOLDER));
    assert.ok(!css.includes('--ag-charts-enterprise-css-loaded'));
});

test('the enterprise stylesheet is the community one, a newline, then its own rules', () => {
    const community = read('ag-charts-community');
    const enterprise = read('ag-charts-enterprise');
    assert.ok(enterprise.startsWith(`${community}\n`));
    assert.match(enterprise.slice(community.length), /--ag-charts-enterprise-css-loaded:\s*1/);
});

test('the enterprise stylesheet inlines every import', () => {
    const enterprise = read('ag-charts-enterprise');
    assert.ok(!enterprise.includes('@import'));
    assert.match(enterprise, /\.ag-watermark/);
    assert.match(enterprise, /\.ag-charts-chart-toolbar__menu/);
});

test('neither stylesheet leaves an @import behind', () => {
    assert.ok(!read('ag-charts-community').includes('@import'));
});

test('the loading spinner keyframes are in the community stylesheet', () => {
    const css = read('ag-charts-community');
    assert.match(css, /@keyframes ag-charts-loading\b/);
    assert.match(css, /@keyframes ag-charts-loading-matrix\b/);
});
