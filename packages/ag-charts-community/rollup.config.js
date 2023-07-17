module.exports = ({ output, ...config }) => {
    if (!Array.isArray(output)) {
        output = [output];
    }

    return {
        ...config,
        output: [
            ...output.map((o) => ({
                ...o,
                name: 'agCharts',
            })),
            ...output.map(({ entryFileNames, chunkFileNames, ...opts }) => ({
                ...opts,
                name: 'agCharts',
                entryFileNames: entryFileNames.replace('[name]', '[name].umd'),
                chunkFileNames: chunkFileNames.replace('[name]', '[name].umd'),
                format: 'umd',
            })),
        ],
    };
};
