(function (global) {
    System.config({
        transpiler: 'ts',
        typescriptOptions: {
            module: 'system',
            moduleResolution: 'node',
            target: 'es5',
            noImplicitAny: false,
            sourceMap: true,
            jsx: 'react',
            lib: ['es2015', 'dom'],
        },
        paths: {
            // paths serve as alias
            'npm:': 'https://cdn.jsdelivr.net/npm/',
            ...systemJsPaths
        },
        map: {
            css: boilerplatePath + "css.js",

            // react
            react: 'npm:react@18.2.0',
            'react-dom': 'npm:react-dom@18.2.0',
            'react-dom/client': 'npm:react-dom@18.2.0',
            'prop-types': 'npm:prop-types@15.8.1',

            ts: "npm:plugin-typescript@8.0.0/lib/plugin.js",
            typescript: "npm:typescript@4.3.5/lib/typescript.min.js",

            app: appLocation,
            // systemJsMap comes from index.html
            ...systemJsMap
        },
        packages: {
            css: {
            },
            react: {
                main: './umd/react.profiling.min.js'
            },
            'react-dom': {
                main: './umd/react-dom.profiling.min.js'
            },
            'react-dom/server': {
                main: '../umd/react-dom-server.browser.production.min.js'
            },
            'prop-types': {
                main: './prop-types.min.js',
                defaultExtension: 'js',
            },

            app: {
                main: './index.tsx',
                defaultExtension: 'tsx'
            },
            'ag-charts-react': {
                main: './main.js',
                defaultExtension: 'js'
            },
            'ag-charts-community': {
                main: './dist/esm/es6/main.js',
                defaultExtension: 'js'
            },
            'ag-charts-enterprise': {
                main: './dist/esm/es6/main.js',
                defaultExtension: 'js'
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

window.addEventListener('error', e => {
    console.error('ERROR', e.message, e.filename)
});
