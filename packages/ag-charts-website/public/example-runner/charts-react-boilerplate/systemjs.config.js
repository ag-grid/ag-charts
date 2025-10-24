(function (global) {
    process = { env: { NODE_ENV: 'development' } };

    const reactConfig = {
        map: {
            react: 'npm:react@19.2.0/cjs/react.production.min.js',
            'react-dom': 'npm:react-dom@19.2.0/cjs/react-dom.production.min.js',
            'react-dom/client': 'npm:react-dom@19.2.0/cjs/react-dom-client.production.min.js',
            scheduler: 'npm:scheduler@0.26.0/cjs/scheduler.production.min.js',
        },
        packages: {
            react: {
                format: 'cjs',
            },
            'react-dom': {
                format: 'cjs',
            },
            scheduler: {
                format: 'cjs',
            },
        },
    };

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
            css: (boilerplatePath.length === 0 ? `./` : `${boilerplatePath}/`) + 'css.js',

            // react
            ...reactConfig.map,

            clone: 'npm:clone@2.1.2',

            ts: 'npm:plugin-typescript@8.0.0/lib/plugin.js',
            typescript: 'npm:typescript@5.4.5/lib/typescript.min.js',

            app: appLocation,
            ...systemJsMap,
        },

        packages: {
            css: {},
            ...reactConfig.packages,

            app: {
                main: './index.jsx',
                defaultExtension: 'jsx',
            },
            'ag-charts-react': {
                main: './dist/package/index.cjs.js',
                defaultExtension: 'js',
            },
            'ag-charts-community/modules': {
                main: '../dist/package/main-modules.cjs.js',
                defaultExtension: 'js',
            },
            'ag-charts-enterprise/modules': {
                main: '../dist/package/main-modules.cjs.js',
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
