const { umdWrapper } = require('esbuild-plugin-umd-wrapper');

const plugins = [];
let outExtension = {};
if (process.env.NX_TASK_TARGET_TARGET.endsWith('umd')) {
    plugins.push(umdWrapper());
    outExtension = {
        '.cjs': '.js',
    };
} else {
    outExtension = {
        '.cjs': '.cjs.js',
        '.js': '.esm.js',
    };
}

/** @type {import('esbuild').BuildOptions} */
const options = {
    outExtension,
    plugins,
};

module.exports = options;
