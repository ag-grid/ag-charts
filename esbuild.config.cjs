const esbuild = require('esbuild');
const { umdWrapper } = require('esbuild-plugin-umd-wrapper');
const fs = require('fs/promises');
const path = require('path');

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
                const minifiedFile = path.resolve(
                    path.dirname(outputFile),
                    `${path.basename(outputFile)}.min${path.extname(outputFile)}`
                );
                await Promise.all([
                    fs.writeFile(minifiedFile, minified.code, { signal }),
                    fs.writeFile(`${minifiedFile}.map`, minified.map, { signal }),
                ]);
            } catch (e) {
                if (e.name !== 'AbortError') throw e;
            }
        };

        build.onEnd(async (result) => {
            await Promise.all(Object.keys(result.metafile.outputs).map(minifyFile));
        });
    },
};

const exportedNames = {
    'ag-charts-community': 'agCharts',
    'ag-charts-enterprise': 'agCharts',
    'ag-charts-react': 'AgChartsReact',
};
const exportedName = exportedNames[process.env.NX_TASK_TARGET_PROJECT];

const plugins = [];
let outExtension = {};
if (process.env.NX_TASK_TARGET_TARGET?.endsWith('umd')) {
    plugins.push(umdWrapper({ libraryName: exportedName }));
    outExtension = {
        '.cjs': '.js',
    };
} else {
    outExtension = {
        '.cjs': '.cjs.js',
        '.js': '.esm.mjs',
    };
}

plugins.push(postBuildMinificationPlugin);

/** @type {import('esbuild').BuildOptions} */
const options = {
    outExtension,
    plugins,
};

module.exports = options;
