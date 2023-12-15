(function (global) {
    System.addImportMap({
        imports: {
            react: 'https://cdn.jsdelivr.net/npm/react@18.2.0',
            'react-dom': 'https://cdn.jsdelivr.net/npm/react-dom@18.2.0',
            'react-dom/client': 'https://cdn.jsdelivr.net/npm/react-dom@18.2.0',
            'prop-types': 'https://cdn.jsdelivr.net/npm/prop-types@15.8.1',

            // app: {
            //     defaultExtension: 'jsx',
            // },
            'ag-charts-react': 'https://localhost:4600/dev/ag-charts-react/dist/index.cjs',
            ...systemJsPaths,
        },
    });

    return;
    System.config({
        defaultExtension: 'js',
        paths: {
            'npm:': 'https://cdn.jsdelivr.net/npm/',
        },
        map: {
            // css plugin
            css: boilerplatePath + 'css.js',

            // react
            react: 'npm:react@18.2.0',
            'react-dom': 'npm:react-dom@18.2.0',
            'react-dom/client': 'npm:react-dom@18.2.0',
            'prop-types': 'npm:prop-types@15.8.1',

            app: 'app',
            // systemJsMap comes from index.html
            ...systemJsMap,
        },
        packages: {
            react: {
                main: './umd/react.production.min.js',
            },
            'react-dom': {
                main: './umd/react-dom.production.min.js',
            },
            'prop-types': {
                main: './prop-types.min.js',
                defaultExtension: 'js',
            },

            app: {
                defaultExtension: 'jsx',
            },
            'ag-charts-react': {
                main: './dist/index.cjs',
                defaultExtension: 'cjs',
            },
            'ag-charts-community': {
                main: './dist/package/main.cjs.js',
                defaultExtension: 'js',
            },
            'ag-charts-enterprise': {
                main: './dist/package/main.cjs.js',
                defaultExtension: 'js',
            },
        },
        meta: {
            '*.css': { loader: 'css' },
        },
    });
})(this);

window.addEventListener('error', (e) => {
    console.error('ERROR', e.message, e.filename);
});
