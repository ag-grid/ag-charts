module.exports = function buildConfig(name, { output, input, ...config }, { umd = {}, all = {} } = {}) {
    if (!Array.isArray(output)) {
        output = [output];
    }

    const multiModule = Object.keys(input).length > 1;

    const result = {
        ...config,
        input,
        cache: false,
        output: [
            ...output.map(({ entryFileNames, chunkFileNames, format, ...opts }) => ({
                ...opts,
                format,
                name,
                entryFileNames,
                chunkFileNames: `lib/_[hash].[format]`,
                sourcemap: process.env.NX_TASK_TARGET_CONFIGURATION !== 'production',
                ...all,
            })),
        ],
    };

    const { entryFileNames, chunkFileNames, format, ...opts } = result.output[0];
    if (format === 'cjs' && !multiModule) {
        result.output.push({
            ...opts,
            name,
            entryFileNames: entryFileNames.replace('cjs', 'umd'),
            chunkFileNames: chunkFileNames.replace('cjs', 'umd'),
            sourcemap: process.env.NX_TASK_TARGET_CONFIGURATION !== 'production',
            format: 'umd',
            ...all,
            ...umd,
        });
    }

    return result;
};
