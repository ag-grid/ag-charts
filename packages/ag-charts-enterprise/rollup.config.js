module.exports = ({ output, ...config }) => {
    if (!Array.isArray(output)) {
        output = [output];
    }

    return {
        ...config,
        output: [
            ...output.map((o) => ({
                ...o,
                name: 'agChartsEnterprise',
            })),
            ...output.map(({ entryFileNames, chunkFileNames, ...opts }) => ({
                ...opts,
                name: 'agChartsEnterprise',
                entryFileNames: entryFileNames.replace('[name]', '[name].umd'),
                chunkFileNames: chunkFileNames.replace('[name]', '[name].umd'),
                format: 'umd',
            })),
        ],
    };
};
