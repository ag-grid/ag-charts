module.exports = function buildConfig(name, { output, ...config }, { umd = {} } = {}) {
    if (!Array.isArray(output)) {
        output = [output];
    }

    const result = {
        ...config,
        cache: false,
        output: [
            ...output.map(({ entryFileNames, chunkFileNames, format, ...opts }) => ({
                ...opts,
                format,
                name,
                entryFileNames,
                chunkFileNames,
                sourcemap: process.env.NX_TASK_TARGET_CONFIGURATION !== 'production',
            })),
        ],
    };

    const { entryFileNames, chunkFileNames, format, ...opts } = result.output[0];
    if (format === 'cjs') {
        result.output.push({
            ...opts,
            name,
            entryFileNames: entryFileNames.replace('cjs', 'umd'),
            chunkFileNames: chunkFileNames.replace('cjs', 'umd'),
            sourcemap: process.env.NX_TASK_TARGET_CONFIGURATION !== 'production',
            format: 'umd',
            ...umd,
        });
    }

    return result;
};
