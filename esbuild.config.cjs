const { umdWrapper } = require('esbuild-plugin-umd-wrapper');

const exportedNames = {
    'ag-charts-community': 'agCharts',
    'ag-charts-enterprise': 'agCharts',
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

/** @type {import('esbuild').BuildOptions} */
const options = {
    outExtension,
    plugins,
};

module.exports = options;
