const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { afterEach } = require('node:test');

// Temporary packages for the dist-artefact and stylesheet packaging tests.
const STANDARD_EXPORTS = {
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
    },
};
const STANDARD_FILES = [
    'dist/package/main.cjs.js',
    'dist/package/main.cjs.min.js',
    'dist/package/main.esm.mjs',
    'dist/package/main.esm.min.mjs',
    'dist/types/src/main.d.ts',
];

const tempDirs = [];
afterEach(() => {
    for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

function tempDir() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dist-artefacts-'));
    tempDirs.push(dir);
    return dir;
}

function writePackage(pkgDir, packageJson, files, contents = {}) {
    fs.mkdirSync(pkgDir, { recursive: true });
    if (packageJson !== undefined) fs.writeFileSync(path.join(pkgDir, 'package.json'), packageJson);
    for (const file of files) {
        fs.mkdirSync(path.dirname(path.join(pkgDir, file)), { recursive: true });
        fs.writeFileSync(path.join(pkgDir, file), contents[file] ?? '');
    }
    return pkgDir;
}

function createPackage(packageJson, files, contents) {
    return writePackage(tempDir(), JSON.stringify(packageJson), files, contents);
}

module.exports = { STANDARD_EXPORTS, STANDARD_FILES, createPackage, tempDir, writePackage };
