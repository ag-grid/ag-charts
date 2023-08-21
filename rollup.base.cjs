module.exports = function buildConfig(name, { output, ...config }, { umd = {} } = {}) {
    if (!Array.isArray(output)) {
        output = [output];
    }

    const result = {
        ...config,
        output: [
            ...output.map(({ entryFileNames, chunkFileNames, format, ...opts }) => ({
                ...opts,
                format,
                name,
                entryFileNames,
                chunkFileNames,
                sourcemap: true,
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
            sourcemap: true,
            format: 'umd',
            ...umd,
        });
    }

    return result;
};
