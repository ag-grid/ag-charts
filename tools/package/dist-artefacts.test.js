const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { afterEach, describe, it } = require('node:test');

const { checkPackage, validateContentsDir } = require('./dist-artefacts');

const CLI = path.join(__dirname, '../release/validateDistArtefacts.js');

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

function summarise(errors) {
    return errors.map(({ kind, file }) => `${kind} ${file}`);
}

describe('checkPackage', () => {
    it('accepts a package whose artefacts match its exports', () => {
        assert.deepEqual(checkPackage(createPackage(STANDARD_EXPORTS, STANDARD_FILES)), []);
    });

    it('reports a missing export target', () => {
        const files = STANDARD_FILES.filter((f) => f !== 'dist/package/main.esm.mjs');
        assert.deepEqual(summarise(checkPackage(createPackage(STANDARD_EXPORTS, files))), [
            'missing-target dist/package/main.esm.mjs',
        ]);
    });

    it('reports a missing minified twin', () => {
        const files = STANDARD_FILES.filter((f) => f !== 'dist/package/main.cjs.min.js');
        assert.deepEqual(summarise(checkPackage(createPackage(STANDARD_EXPORTS, files))), [
            'missing-twin dist/package/main.cjs.min.js',
        ]);
    });

    it('reports a bundle that no export references', () => {
        const files = [...STANDARD_FILES, 'dist/package/scene.cjs.js'];
        assert.deepEqual(summarise(checkPackage(createPackage(STANDARD_EXPORTS, files))), [
            'unexported dist/package/scene.cjs.js',
        ]);
    });

    it('follows an export removal without edits, flagging any bundle left behind', () => {
        const withScene = {
            ...STANDARD_EXPORTS,
            exports: {
                ...STANDARD_EXPORTS.exports,
                './scene': { require: './dist/package/scene.cjs.js', import: './dist/package/scene.esm.mjs' },
            },
        };
        const sceneFiles = [
            'dist/package/scene.cjs.js',
            'dist/package/scene.cjs.min.js',
            'dist/package/scene.esm.mjs',
            'dist/package/scene.esm.min.mjs',
        ];
        assert.deepEqual(checkPackage(createPackage(withScene, [...STANDARD_FILES, ...sceneFiles])), []);
        assert.deepEqual(summarise(checkPackage(createPackage(STANDARD_EXPORTS, [...STANDARD_FILES, ...sceneFiles]))), [
            'unexported dist/package/scene.cjs.js',
            'unexported dist/package/scene.cjs.min.js',
            'unexported dist/package/scene.esm.min.mjs',
            'unexported dist/package/scene.esm.mjs',
        ]);
    });

    it('accepts flat export conditions', () => {
        const packageJson = {
            main: './dist/package/index.cjs.js',
            module: './dist/package/index.esm.mjs',
            types: './dist/types/src/index.d.ts',
            exports: {
                import: './dist/package/index.esm.mjs',
                require: './dist/package/index.cjs.js',
                types: './dist/types/src/index.d.ts',
                default: './dist/package/index.cjs.js',
            },
        };
        const files = [
            'dist/package/index.cjs.js',
            'dist/package/index.cjs.min.js',
            'dist/package/index.esm.mjs',
            'dist/package/index.esm.min.mjs',
            'dist/types/src/index.d.ts',
        ];
        assert.deepEqual(checkPackage(createPackage(packageJson, files), { release: true }), []);
    });

    describe('wildcard exports', () => {
        const localeExports = {
            ...STANDARD_EXPORTS,
            exports: {
                ...STANDARD_EXPORTS.exports,
                './*.js': {
                    types: './dist/types/src/*.d.ts',
                    require: './dist/package/*.cjs.js',
                    import: './dist/package/*.esm.mjs',
                },
            },
        };
        const localeFiles = ['en-US', 'fr-FR'].flatMap((locale) => [
            `dist/package/${locale}.cjs.js`,
            `dist/package/${locale}.cjs.min.js`,
            `dist/package/${locale}.esm.mjs`,
            `dist/package/${locale}.esm.min.mjs`,
            `dist/types/src/${locale}.d.ts`,
        ]);

        it('accepts every file a pattern matches', () => {
            const pkgDir = createPackage(localeExports, [...STANDARD_FILES, ...localeFiles]);
            assert.deepEqual(checkPackage(pkgDir, { release: true }), []);
        });

        it('reports a minified file without its source', () => {
            const files = [...STANDARD_FILES, ...localeFiles, 'dist/package/de-DE.cjs.min.js'];
            assert.deepEqual(summarise(checkPackage(createPackage(localeExports, files))), [
                'unexported dist/package/de-DE.cjs.min.js',
            ]);
        });

        it('rejects a pattern outside the final path segment', () => {
            const packageJson = { exports: { './*': './dist/*/index.js' } };
            assert.deepEqual(summarise(checkPackage(createPackage(packageJson, []))), ['bad-pattern dist/*/index.js']);
        });
    });

    it('accepts the Angular package shape', () => {
        const packageJson = {
            module: 'fesm2022/ag-charts-angular.mjs',
            typings: 'index.d.ts',
            exports: {
                './package.json': { default: './package.json' },
                '.': { types: './index.d.ts', default: './fesm2022/ag-charts-angular.mjs' },
            },
        };
        const files = ['fesm2022/ag-charts-angular.mjs', 'fesm2022/ag-charts-angular.mjs.map', 'index.d.ts'];
        const contents = { 'fesm2022/ag-charts-angular.mjs': '//# sourceMappingURL=ag-charts-angular.mjs.map\n' };
        const pkgDir = createPackage(packageJson, files, contents);
        assert.deepEqual(checkPackage(pkgDir), []);
        assert.deepEqual(checkPackage(pkgDir, { release: true }), []);
    });

    it('reports a missing or invalid package.json', () => {
        assert.deepEqual(summarise(checkPackage(tempDir())), ['unreadable package.json']);
        assert.deepEqual(summarise(checkPackage(writePackage(tempDir(), '', []))), ['unreadable package.json']);
    });

    describe('release checks', () => {
        it('reports a source map reference to a file that is not shipped', () => {
            const contents = { 'dist/package/main.cjs.js': '//# sourceMappingURL=main.cjs.js.map\n' };
            const pkgDir = createPackage(STANDARD_EXPORTS, STANDARD_FILES, contents);
            assert.deepEqual(checkPackage(pkgDir), []);
            assert.deepEqual(summarise(checkPackage(pkgDir, { release: true })), [
                'dangling-source-map dist/package/main.cjs.js',
            ]);
        });

        it('accepts a source map reference to a shipped file', () => {
            const contents = { 'dist/package/main.cjs.js': '//# sourceMappingURL=main.cjs.js.map\n' };
            const files = [...STANDARD_FILES, 'dist/package/main.cjs.js.map'];
            assert.deepEqual(checkPackage(createPackage(STANDARD_EXPORTS, files, contents), { release: true }), []);
        });

        it('reports missing type definitions', () => {
            const files = STANDARD_FILES.filter((f) => !f.endsWith('.d.ts'));
            assert.deepEqual(summarise(checkPackage(createPackage(STANDARD_EXPORTS, files), { release: true })), [
                'missing-types dist/types/src/main.d.ts',
            ]);

            const { types, exports, ...untyped } = STANDARD_EXPORTS;
            assert.deepEqual(summarise(checkPackage(createPackage(untyped, STANDARD_FILES), { release: true })), [
                'missing-types package.json',
            ]);
        });
    });
});

describe('validateContentsDir', () => {
    it('checks every package, including those after a broken one', () => {
        const contentsDir = tempDir();
        writePackage(path.join(contentsDir, 'a/package'), '', []);
        writePackage(path.join(contentsDir, 'b/package'), JSON.stringify(STANDARD_EXPORTS), STANDARD_FILES);

        assert.deepEqual(
            validateContentsDir(contentsDir).map(({ name, errors }) => [name, summarise(errors)]),
            [
                ['a', ['unreadable package.json']],
                ['b', []],
            ]
        );
    });
});

describe('validateDistArtefacts.js', () => {
    function run(contentsDir) {
        return spawnSync(process.execPath, [CLI, contentsDir], { encoding: 'utf8' });
    }

    it('reports every failing package in one run', () => {
        const contentsDir = tempDir();
        const missingFile = STANDARD_FILES.filter((f) => f !== 'dist/package/main.cjs.min.js');
        writePackage(path.join(contentsDir, 'first/package'), JSON.stringify(STANDARD_EXPORTS), missingFile);
        const extraFile = [...STANDARD_FILES, 'dist/package/extra.cjs.js'];
        writePackage(path.join(contentsDir, 'second/package'), JSON.stringify(STANDARD_EXPORTS), extraFile);
        writePackage(path.join(contentsDir, 'third/package'), JSON.stringify(STANDARD_EXPORTS), STANDARD_FILES);

        const result = run(contentsDir);
        assert.equal(result.status, 1);
        assert.match(result.stderr, /\[first\] minified file is missing: dist\/package\/main\.cjs\.min\.js/);
        assert.match(
            result.stderr,
            /\[second\] file is not referenced by package\.json exports: dist\/package\/extra\.cjs\.js/
        );
        assert.match(result.stdout, /\[third\] dist artefacts OK/);
    });

    it('fails when the contents directory does not exist', () => {
        const result = run(path.join(tempDir(), 'missing'));
        assert.equal(result.status, 1);
        assert.match(result.stderr, /does not exist/);
    });

    it('passes when every package is valid', () => {
        const contentsDir = tempDir();
        writePackage(path.join(contentsDir, 'only/package'), JSON.stringify(STANDARD_EXPORTS), STANDARD_FILES);
        assert.equal(run(contentsDir).status, 0);
    });
});
