module.exports = function buildConfig(name, { output, ...config }, { umd = {} } = {}) {
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
    if (format === 'cjs') {
        result.output.push({
            ...opts,
            name,
            sourcemap,
            format: 'umd',
            entryFileNames: entryFileNames.replace('cjs', 'umd'),
            chunkFileNames: chunkFileNames.replace('cjs', 'umd'),
            ...umd,
        });
    }

    return result;
};
