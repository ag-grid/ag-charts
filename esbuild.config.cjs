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
        build.initialOptions.metafile = true;

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
                    sourcemap: true,
                });

                if (signal.aborted) return;
                const { name, ext } = path.parse(outputFile);
                const minifiedFile = path.resolve(path.dirname(outputFile), `${name}.min${ext}`);
                await Promise.all([
                    fs.writeFile(minifiedFile, minified.code, { signal }),
                    fs.writeFile(`${minifiedFile}.map`, minified.map, { signal }),
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
 * in the ESM bundle. This allows downstream bundlers to tree-shake unused code from
 * the single-file bundle output.
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

        // Creates UMD banner + footer config.
        const exportedName = exportedNames[process.env.NX_TASK_TARGET_PROJECT];
        const umdWrapperInstance = umdWrapper({ libraryName: exportedName });
        umdWrapperInstance.setup(build);

        // Correct global variable name references.
        const { banner } = build.initialOptions;
        for (const external of initialOptions.external ?? []) {
            const globalName = exportedNames[external];
            if (globalName) {
                banner.js = banner.js.replaceAll(`g["${external}"]`, `g["${globalName}"]`);
            }
        }

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
    plugins.push(pureTopLevelSideEffectsPlugin);
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
