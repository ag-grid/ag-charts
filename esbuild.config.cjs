const esbuild = require('esbuild');
const { umdWrapper } = require('esbuild-plugin-umd-wrapper');
const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const htmlMinifier = require('html-minifier-terser');

const { annotatePureToplevel } = require('./esbuild.config.pure-toplevel.cjs');

const exportedNames = {
    react: 'React',
    'react-dom': 'ReactDOM',
    'ag-charts-community': 'agCharts',
    'ag-charts-enterprise': 'agCharts',
    'ag-charts-react': 'AgCharts',
    'ag-charts-locale': 'agChartsLocale',
    'ag-charts-core': 'agChartsCore',
};

/** @type {import('esbuild').Plugin} */
const cssPlugin = {
    name: 'css',
    setup(build) {
        build.onLoad({ filter: /\.css$/ }, async (args) => {
            const result = await esbuild.build({
                entryPoints: [args.path],
                bundle: true,
                minify: true,
                sourcemap: false,
                outdir: 'null',
                write: false,
            });
            if (result.outputFiles.length !== 1) {
                throw new Error('Invalid CSS bundle');
            }

            const css = result.outputFiles[0].text;
            return { contents: css, loader: 'text' };
        });
    },
};

/** @type {import('esbuild').Plugin} */
const htmlPlugin = {
    name: 'html',
    setup(build) {
        build.onLoad({ filter: /\.html$/ }, async (args) => {
            const html = await htmlMinifier.minify(await fs.readFile(args.path, 'utf8'), {
                collapseWhitespace: true,
            });
            return { contents: html, loader: 'text' };
        });
    },
};

/** @type {import('esbuild').Plugin} */
const postBuildMinificationPlugin = {
    name: 'minification-plugin',
    setup(build) {
        // Per-module ESM output is for consumers' bundlers, which minify it themselves.
        if (isUnbundledEsm(build.initialOptions)) return;
        build.initialOptions.metafile = true;
        const sourcemap = Boolean(build.initialOptions.sourcemap);

        /** @type {Map<string, AbortController>} */
        const writeState = new Map();

        /** @param {string} outputFile */
        const minifyFile = async (outputFile) => {
            try {
                if (outputFile.endsWith('.map')) return;

                writeState.get(outputFile)?.abort();
                const abortController = new AbortController();
                writeState.set(outputFile, abortController);

                const { signal } = abortController;

                const contents = await fs.readFile(path.resolve(outputFile), 'utf-8');

                if (signal.aborted) return;
                const minified = await esbuild.transform(contents, {
                    minify: true,
                    sourcemap,
                });

                if (signal.aborted) return;
                const { name, ext } = path.parse(outputFile);
                const minifiedFile = path.resolve(path.dirname(outputFile), `${name}.min${ext}`);
                await Promise.all([
                    fs.writeFile(minifiedFile, minified.code, { signal }),
                    sourcemap && fs.writeFile(`${minifiedFile}.map`, minified.map, { signal }),
                ]);
            } catch (e) {
                if (e.name !== 'AbortError') throw e;
            }
        };

        build.onEnd(async (result) => {
            if (result.errors?.length !== 0) return;
            await Promise.all(Object.keys(result.metafile.outputs).map(minifyFile));
        });
    },
};

/**
 * Post-build plugin that adds /*#__PURE__* / annotations to top-level side effects
 * in the ESM output. `sideEffects` lets downstream bundlers drop a whole unused module,
 * and these annotations let them drop the unused declarations inside a module they keep.
 *
 * Covers:
 *   - Expression statements (calls like __decorateClass, assignments like _Foo.bar = …)
 *   - Variable declaration initialisers with nested calls (object literals with .bind(), etc.)
 *
 * @type {import('esbuild').Plugin}
 */
const pureTopLevelSideEffectsPlugin = {
    name: 'pure-toplevel-side-effects',
    setup(build) {
        build.initialOptions.metafile = true;

        build.onEnd(async (result) => {
            if (result.errors?.length !== 0) return;
            for (const file of Object.keys(result.metafile.outputs)) {
                if (!file.endsWith('.esm.mjs')) continue;

                const code = fsSync.readFileSync(file, 'utf8');
                const annotated = annotatePureToplevel(code);
                const corrupted = annotated.match(/\.className = "_c\$\d+"/);
                if (corrupted) {
                    throw new Error(
                        `pure-toplevel-side-effects rewrote a className literal in ${file}: ${corrupted[0]}`
                    );
                }
                if (annotated !== code) {
                    await fs.writeFile(file, annotated);
                }
            }
        });
    },
};

/** @type {import('esbuild').Plugin} */
const umdWrapperAdaptorPlugin = {
    name: 'umd-wrapper-adaptor',
    setup(build) {
        const { initialOptions } = build;

        build.onResolve({ filter: /\.cjs\.js$/ }, (args) => ({
            path: path.join(args.resolveDir, args.path.replace('.cjs.js', '.esm.mjs')),
        }));

        // Creates UMD banner + footer config, mapping externals to their published global names.
        const exportedName = exportedNames[process.env.NX_TASK_TARGET_PROJECT];
        const umdWrapperInstance = umdWrapper({ libraryName: exportedName, globals: exportedNames });
        umdWrapperInstance.setup(build);

        // Add `require()` function which uses resolved module references.
        const externalsMap =
            initialOptions.external?.map((e, i) => {
                return `if (name === '${e}') return __d${String.fromCharCode(97 + i)};`;
            }) ?? [];

        build.initialOptions.banner.js += `
if (typeof require === 'undefined') {
    function require(name) {
        ${externalsMap.join('\n        ')}
        throw new Error('Unknown module: ' + name);
    }
}
        `;
    },
};

const UNBUNDLED_ESM_PROJECTS = new Set([
    'ag-charts-core',
    'ag-charts-community',
    'ag-charts-enterprise',
    'ag-charts-locale',
]);
const isUnbundledEsm = (initialOptions) =>
    initialOptions.format === 'esm' &&
    process.env.NX_TASK_TARGET_TARGET === 'build:package' &&
    UNBUNDLED_ESM_PROJECTS.has(process.env.NX_TASK_TARGET_PROJECT);

const toPosix = (filePath) => filePath.split(path.sep).join('/');
const RESOLVING = Symbol('unbundled-esm-resolving');
const MODULE_EXTENSION = /\.(ts|css|html)$/;
/** `chart/foo.ts` becomes `chart/foo`, while `styles.css` keeps its extension so it cannot collide with `styles.ts`. */
const outputStem = (file) => file.replace(/\.ts$/, '');

/**
 * Emits the ESM build as one file per source module, so that consumers' bundlers drop unused modules by
 * file. Each module is still bundled on its own: relative imports of other modules stay external and point
 * at their `.esm.mjs` outputs. CSS and HTML files become modules exporting their text, so importers share one copy.
 *
 * @type {import('esbuild').Plugin}
 */
const unbundledEsmPlugin = {
    name: 'unbundled-esm',
    async setup(build) {
        const { initialOptions } = build;
        if (!isUnbundledEsm(initialOptions)) return;

        const { entryPoints, outfile } = initialOptions;
        const srcDir = path.resolve(path.dirname(entryPoints[0]));
        const outdir = initialOptions.outdir ?? path.dirname(outfile);
        const outExtension = initialOptions.outExtension['.js'];
        const bundleOptions = {
            bundle: true,
            format: 'esm',
            platform: initialOptions.platform,
            target: initialOptions.target,
            tsconfig: initialOptions.tsconfig,
            external: initialOptions.external,
            define: initialOptions.define,
            logLevel: 'silent',
        };

        // Ship only the modules reachable from the entry points, not every file under `src`.
        const { metafile } = await esbuild.build({
            ...bundleOptions,
            entryPoints,
            write: false,
            metafile: true,
            outdir,
            loader: { '.css': 'empty', '.html': 'empty' },
        });
        const modules = new Set(
            Object.keys(metafile.inputs)
                .map((input) => path.resolve(input))
                .filter((input) => input.startsWith(srcDir + path.sep) && MODULE_EXTENSION.test(input))
        );

        initialOptions.entryPoints = [...modules].map((file) => ({
            in: file,
            out: outputStem(path.relative(srcDir, file)),
        }));
        initialOptions.outdir = outdir;
        delete initialOptions.outfile;

        // Browsers loading the package through an import map would otherwise fetch every module separately.
        build.onEnd(async (result) => {
            if (result.errors.length > 0) return;
            await esbuild.build({
                ...bundleOptions,
                entryPoints: [path.join(srcDir, 'main.ts')],
                outfile: path.join(outdir, `main.bundle${outExtension}`),
                sourcemap: initialOptions.sourcemap,
                plugins: [cssPlugin, htmlPlugin],
                logLevel: 'error',
            });
        });

        // Inlining a dependency would give every importing module its own copy, so leave them to the consumer.
        const { dependencies = {}, peerDependencies = {} } = JSON.parse(
            fsSync.readFileSync(path.join(srcDir, '..', 'package.json'), 'utf8')
        );
        const packages = new Set([...Object.keys(dependencies), ...Object.keys(peerDependencies)]);
        build.onResolve({ filter: /^[^./]/ }, ({ path: specifier }) => {
            if (packages.has(specifier)) return { path: specifier, external: true };
        });

        build.onResolve({ filter: /^\.\.?\// }, async (args) => {
            if (args.pluginData === RESOLVING) return;
            const { kind, resolveDir, importer } = args;
            const resolved = await build.resolve(args.path, { kind, resolveDir, importer, pluginData: RESOLVING });
            // A module missing from the set (e.g. added during watch) is inlined until the next full build.
            if (resolved.errors.length > 0 || !modules.has(resolved.path)) return;

            const target = outputStem(path.relative(path.dirname(importer), resolved.path)) + outExtension;
            const specifier = toPosix(target.startsWith('.') ? target : `./${target}`);
            // Without `sideEffects: false`, an import used only as a type is kept as a bare `import "./x.esm.mjs"`.
            return { path: specifier, external: true, sideEffects: false };
        });
    },
};

const plugins = [cssPlugin, htmlPlugin];
let outExtension;
if (process.env.NX_TASK_TARGET_TARGET?.endsWith('umd')) {
    plugins.push(umdWrapperAdaptorPlugin);
    outExtension = {
        '.cjs': '.js',
    };
} else {
    outExtension = {
        '.cjs': '.cjs.js',
        '.js': '.esm.mjs',
    };
}

if (!process.env.NX_TASK_TARGET_TARGET?.endsWith('umd')) {
    plugins.push(unbundledEsmPlugin, pureTopLevelSideEffectsPlugin);
}

if (process.env.NX_TASK_TARGET_CONFIGURATION !== 'watch') {
    plugins.push(postBuildMinificationPlugin);
}

/** @type {import('esbuild').BuildOptions} */
const options = {
    outExtension,
    plugins,
};

if (!process.env.NX_TASK_TARGET_TARGET?.endsWith('umd') && process.env.NX_TASK_TARGET_PROJECT === 'ag-charts-locale') {
    options.outdir = path.join(__dirname, 'packages/ag-charts-locale/dist/package');
}

module.exports = options;
