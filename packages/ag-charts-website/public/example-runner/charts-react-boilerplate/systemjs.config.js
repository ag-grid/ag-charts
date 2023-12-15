(function (global) {
    var sjsPaths = {};
    if (typeof systemJsPaths !== 'undefined') {
        sjsPaths = systemJsPaths;
    }

    System.config({
        defaultExtension: 'js',
        paths: {
            // paths serve as alias
            'npm:': 'https://cdn.jsdelivr.net/npm/',
            ...sjsPaths,
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
        },
        meta: {
            '*.css': { loader: 'css' },
        },
    });
})(this);

window.addEventListener('error', (e) => {
    console.error('ERROR', e.message, e.filename);
});
