module.exports = function buildConfig(name, { output, ...config }, { umdOutput = 'add', umd = {} } = {}) {
    if (!Array.isArray(output)) {
        output = [output];
    }

    const sourcemap = process.env.NX_TASK_TARGET_CONFIGURATION !== 'production';

    const result = {
        ...config,
        cache: false,
        output: output.map((opts) => ({ ...opts, name, sourcemap })),
    };

    const { entryFileNames, chunkFileNames, format, ...opts } = result.output[0];
    const umdOutputConfig = {
        ...opts,
        name,
        sourcemap,
        format: 'umd',
        entryFileNames: entryFileNames.replace(format, 'umd'),
        chunkFileNames: chunkFileNames.replace(format, 'umd'),
        ...umd,
    };

    if (umdOutput === 'add' && format === 'cjs') {
        // Generate module-only UMD output in addition to CJS output.
        result.output.push(umdOutputConfig);
    } else if (umdOutput === 'only') {
        // Only output UMD, with referenced AG Charts modules included.
        result.plugins = result.plugins.filter((p) => p.name !== 'dts-bundle');
        result.output = [umdOutputConfig];

        const { external } = result;
        result.external = (moduleName) => {
            if (moduleName.startsWith('ag-')) return false;

            return external(moduleName);
        };
    } else if (umdOutput === 'none') {
        // Don't include UMD output.
    }

    return result;
};
