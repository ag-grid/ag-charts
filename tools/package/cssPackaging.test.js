// D-17: the packed chart packages ship their stylesheet, `pack:verify` allows it, and it resolves through `exports`.
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const os = require('node:os');
const path = require('node:path');
const { afterEach, describe, it } = require('node:test');

const ROOT = path.resolve(__dirname, '../..');
const SANITY_CHECK = path.join(__dirname, 'sanity-check-package.js');
const PACKAGES = ['ag-charts-community', 'ag-charts-enterprise'];

const readJson = (file) => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));

const tempDirs = [];
afterEach(() => {
    for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

function writePackage(name, files) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'css-packaging-'));
    tempDirs.push(dir);
    const { exports } = readJson(`packages/${name}/package.json`);
    const packageJson = {
        name,
        version: readJson('package.json').version,
        main: './dist/package/main.cjs.js',
        module: './dist/package/main.esm.mjs',
        types: './dist/types/src/main.d.ts',
        exports: {
            '.': {
                types: './dist/types/src/main.d.ts',
                require: './dist/package/main.cjs.js',
                import: './dist/package/main.esm.mjs',
                default: './dist/package/main.cjs.js',
            },
            './css/*.css': exports['./css/*.css'],
        },
    };
    const all = [
        'README.md',
        'LICENSE.txt',
        'dist/package/main.cjs.js',
        'dist/package/main.cjs.min.js',
        'dist/package/main.esm.mjs',
        'dist/package/main.esm.min.mjs',
        'dist/types/src/main.d.ts',
        ...files,
    ];
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(packageJson));
    for (const file of all) {
        fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
        fs.writeFileSync(path.join(dir, file), '');
    }
    return dir;
}

function packVerify(dir, ...extra) {
    return spawnSync('node', [SANITY_CHECK, dir, ...extra], { cwd: ROOT, encoding: 'utf8' });
}

for (const name of PACKAGES) {
    describe(name, () => {
        it('exports its stylesheet from dist/css', () => {
            assert.equal(readJson(`packages/${name}/package.json`).exports['./css/*.css'], './dist/css/*.css');
        });

        it('runs pack:verify with the css extension allowed', () => {
            const { options } = readJson(`packages/${name}/project.json`).targets['pack:verify'];
            assert.ok(options.commands.every((command) => /--allowed-ext css\b/.test(command)), options.commands);
        });

        it('resolves the stylesheet through exports', () => {
            const dir = writePackage(name, [`dist/css/${name}.css`]);
            const resolved = createRequire(path.join(dir, 'index.js')).resolve(`${name}/css/${name}.css`);
            assert.equal(resolved, fs.realpathSync(path.join(dir, `dist/css/${name}.css`)));
        });

        it('passes pack:verify when css is allowed', () => {
            const dir = writePackage(name, [`dist/css/${name}.css`]);
            const result = packVerify(dir, '--allowed-ext', 'css');
            assert.equal(result.status, 0, result.stdout + result.stderr);
        });

        it('fails pack:verify on the stylesheet when css is not allowed', () => {
            const dir = writePackage(name, [`dist/css/${name}.css`]);
            const result = packVerify(dir);
            assert.equal(result.status, 1);
            assert.match(result.stdout, new RegExp(`Unexpected file extension: dist/css/${name}\\.css`));
        });

        it('fails pack:verify when the stylesheet is missing from the package', () => {
            const dir = writePackage(name, []);
            const result = packVerify(dir, '--allowed-ext', 'css');
            assert.equal(result.status, 1);
        });
    });
}
