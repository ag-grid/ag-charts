// The packed chart packages ship their stylesheet, `pack:verify` allows it, and it resolves through `exports`.
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const path = require('node:path');
const { describe, it } = require('node:test');

const { STANDARD_EXPORTS, STANDARD_FILES, createPackage } = require('./packageFixture');

const ROOT = path.resolve(__dirname, '../..');
const SANITY_CHECK = path.join(__dirname, 'sanity-check-package.js');
const PACKAGES = ['ag-charts-community', 'ag-charts-enterprise'];

const readJson = (file) => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));

// The package's real `exports`, so the resolution below is checked against what ships.
function createPackageWithStylesheet(name, files) {
    const { exports } = readJson(`packages/${name}/package.json`);
    const packageJson = {
        ...STANDARD_EXPORTS,
        name,
        version: readJson('package.json').version,
        exports: { ...STANDARD_EXPORTS.exports, './css/*.css': exports['./css/*.css'] },
    };
    return createPackage(packageJson, [...STANDARD_FILES, ...files, 'README.md', 'LICENSE.txt']);
}

function packVerify(dir, ...extra) {
    return spawnSync('node', [SANITY_CHECK, dir, ...extra], { cwd: ROOT, encoding: 'utf8' });
}

for (const name of PACKAGES) {
    describe(name, () => {
        it('resolves the stylesheet through exports', () => {
            const dir = createPackageWithStylesheet(name, [`dist/css/${name}.css`]);
            const resolved = createRequire(path.join(dir, 'index.js')).resolve(`${name}/css/${name}.css`);
            assert.equal(resolved, fs.realpathSync(path.join(dir, `dist/css/${name}.css`)));
        });

        it('passes pack:verify when css is allowed', () => {
            const dir = createPackageWithStylesheet(name, [`dist/css/${name}.css`]);
            const result = packVerify(dir, '--allowed-ext', 'css');
            assert.equal(result.status, 0, result.stdout + result.stderr);
        });

        it('fails pack:verify on the stylesheet when css is not allowed', () => {
            const dir = createPackageWithStylesheet(name, [`dist/css/${name}.css`]);
            const result = packVerify(dir);
            assert.equal(result.status, 1);
            assert.match(result.stdout, new RegExp(`Unexpected file extension: dist/css/${name}\\.css`));
        });

        it('fails pack:verify when the stylesheet is missing from the package', () => {
            const dir = createPackageWithStylesheet(name, []);
            const result = packVerify(dir, '--allowed-ext', 'css');
            assert.equal(result.status, 1);
            assert.match(result.stdout, /dist\/css\/\*\.css/);
        });
    });
}
