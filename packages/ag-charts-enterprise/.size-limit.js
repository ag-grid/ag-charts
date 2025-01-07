const defaultConfig = {
    path: './src/main-modules.ts',
    brotli: false,
};

module.exports = [
    {
        name: 'Full package',
        import: '*',
        limit: '200 kB',
        ...defaultConfig,
    },
    // {
    //     name: 'Testing EventEmitter',
    //     import: '{ EventEmitter }',
    //     limit: '20 kB',
    //     ...defaultConfig,
    // },
];
