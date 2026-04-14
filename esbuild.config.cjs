const esbuild = require('esbuild');
const { umdWrapper } = require('esbuild-plugin-umd-wrapper');
const acorn = require('acorn');
const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const htmlMinifier = require('html-minifier-terser');

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
                if (annotated !== code) {
                    await fs.writeFile(file, annotated);
                }
            }
        });
    },
};

function hasSideEffect(node) {
    if (!node) return false;
    if (node.type === 'CallExpression' || node.type === 'NewExpression' || node.type === 'TaggedTemplateExpression') {
        return true;
    }
    for (const key of Object.keys(node)) {
        const val = node[key];
        if (val && typeof val === 'object') {
            if (Array.isArray(val)) {
                for (const item of val) {
                    if (item?.type && hasSideEffect(item)) return true;
                }
            } else if (val.type && hasSideEffect(val)) {
                return true;
            }
        }
    }
    return false;
}

const CALL_LIKE = new Set(['CallExpression', 'NewExpression', 'TaggedTemplateExpression']);

// Bare side-effect imports from AG Charts packages are artefacts of esbuild bundling
// type-only imports from external dependencies. Safe to remove.
const AG_PACKAGES = new Set(['ag-charts-core', 'ag-charts-community', 'ag-charts-locale', 'ag-charts-types']);

// NOTE: Expression statements must NOT be wrapped in #__PURE__ IIFEs — Rollup treats
// #__PURE__ on expression statements as "always droppable" regardless of whether the
// referenced symbols are live. Only variable declaration initialisers can use #__PURE__
// safely (dropped only when the declared variable is unused).

function annotatePureToplevel(code) {
    let ast;
    try {
        ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
    } catch {
        return code;
    }

    const edits = [];

    for (const node of ast.body) {
        // 0. Bare side-effect imports of AG Charts packages — artefacts of esbuild bundling
        //    type-only imports. These trigger warnings in downstream bundlers.
        if (node.type === 'ImportDeclaration' && node.specifiers.length === 0) {
            if (AG_PACKAGES.has(node.source.value)) {
                edits.push({ pos: node.start, end: node.end, replace: '' });
            }
            continue;
        }

        // 1. Expression statements — intentionally NOT annotated. Rollup treats #__PURE__
        //    on expression statements as "always droppable" even when the statement mutates
        //    live objects (e.g. __decorateClass, static property assignments, __export).

        // 2. Variable declarations whose initialisers contain calls / new / tagged templates.
        if (node.type === 'VariableDeclaration') {
            for (const decl of node.declarations) {
                if (!decl.init || !hasSideEffect(decl.init)) continue;

                if (CALL_LIKE.has(decl.init.type)) {
                    edits.push({ pos: decl.init.start, text: '/*#__PURE__*/ ' });
                } else {
                    const initCode = code.slice(decl.init.start, decl.init.end);
                    edits.push({
                        pos: decl.init.start,
                        end: decl.init.end,
                        replace: `/*#__PURE__*/ (() => (${initCode}))()`,
                    });
                }
            }
        }
    }

    if (edits.length === 0) return code;

    // Apply in reverse source-position order so earlier edits don't shift later positions.
    let result = code;
    edits.sort((a, b) => b.pos - a.pos);
    for (const edit of edits) {
        if (edit.replace !== undefined) {
            result = result.slice(0, edit.pos) + edit.replace + result.slice(edit.end);
        } else {
            result = result.slice(0, edit.pos) + edit.text + result.slice(edit.pos);
        }
    }
    return result;
}

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
let outExtension = {};
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
