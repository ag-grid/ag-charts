(function (global) {
    var sjsPaths = {};
    if (typeof systemJsPaths !== 'undefined') {
        sjsPaths = systemJsPaths;
    }

    System.config({
        transpiler: 'ts',
        typescriptOptions: {
            target: 'es2020',
            jsx: 'react',
        },
        paths: {
            // paths serve as alias
            'npm:': 'https://cdn.jsdelivr.net/npm/',
            ...sjsPaths,
        },
        map: {
            css: boilerplatePath + 'css.js',

            // react
            react: 'npm:react@18.2.0',
            'react-dom': 'npm:react-dom@18.2.0',
            'react-dom/client': 'npm:react-dom@18.2.0',

            deepclone: 'npm:deepclone@1.0.2',

            ts: 'npm:plugin-typescript@8.0.0/lib/plugin.js',
            typescript: 'npm:typescript@4.3.5/lib/typescript.min.js',

            app: appLocation,
            ...systemJsMap,
        },

        packages: {
            css: {},
            react: {
                main: './umd/react.profiling.min.js',
            },
            'react-dom': {
                main: './umd/react-dom.profiling.min.js',
            },
            'react-dom/server': {
                main: '../umd/react-dom-server.browser.production.min.js',
            },

            app: {
                main: './index.jsx',
                defaultExtension: 'jsx',
            },
            'ag-charts-react': {
                main: './dist/package/index.cjs.js',
                defaultExtension: 'js',
            },
        },
        meta: {
            typescript: {
                exports: 'ts',
            },
            '*.css': { loader: 'css' },
        },
    });
})(this);

window.addEventListener('error', (e) => {
    console.error('ERROR', e.message, e.filename);
});
