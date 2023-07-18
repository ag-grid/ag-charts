module.exports = function buildConfig(name, { output, ...config }, { umd = {} } = {}) {
    if (!Array.isArray(output)) {
        output = [output];
    }

    return {
        ...config,
        output: [
            ...output.map((o) => ({
                ...o,
                name,
                sourcemap: true,
            })),
            ...output.map(({ entryFileNames, chunkFileNames, ...opts }) => ({
                ...opts,
                name,
                entryFileNames: entryFileNames.replace('[name]', '[name].umd'),
                chunkFileNames: chunkFileNames.replace('[name]', '[name].umd'),
                sourcemap: true,
                format: 'umd',
                ...umd,
            })),
        ],
    };
};
