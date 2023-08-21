module.exports = function buildConfig(name, { output, ...config }, { umd = {} } = {}) {
    if (!Array.isArray(output)) {
        output = [output];
    }

    const rename = (name, format) => {
        // Workaround @nx/rollup:rollup package.json update assuming entry point is named 'index'.
        // name = name.replace('[name]', 'index');

        // if (format === 'esm') {
        //     name = name.replace('.js', '.mjs');
        // }

        return name;
    };

    const result = {
        ...config,
        output: [
            ...output.map(({ entryFileNames, chunkFileNames, format, ...opts }) => ({
                ...opts,
                format,
                name,
                entryFileNames: rename(entryFileNames, format),
                chunkFileNames: rename(chunkFileNames, format),
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
