(function (global) {
    process = { env: { NODE_ENV: 'development' } };

    const reactConfig = {
        map: {
            react: 'npm:react@19.2.0/cjs/react.development.js',
            'react-dom': 'npm:react-dom@19.2.0/cjs/react-dom.development.js',
            'react-dom/client': 'npm:react-dom@19.2.0/cjs/react-dom-client.development.js',
            scheduler: 'npm:scheduler@0.26.0/cjs/scheduler.development.js',
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

    System.config({
        transpiler: 'ts',
        typescriptOptions: {
            target: 'es2020',
            jsx: 'react',
        },
        paths: {
            // paths serve as alias
            'npm:': 'https://cdn.jsdelivr.net/npm/',
            ...systemJsPaths,
        },
        map: {
            css: (boilerplatePath.length === 0 ? `./` : `${boilerplatePath}/`) + 'css.js',

            // react
            ...reactConfig.map,

            clone: 'npm:clone@2.1.2',

            ts: 'npm:plugin-typescript@8.0.0/lib/plugin.js',
            typescript: 'npm:typescript@5.4.5/lib/typescript.min.js',

            app: appLocation,
            // systemJsMap comes from index.html
            ...systemJsMap,
        },
        packages: {
            css: {},
            ...reactConfig.packages,

            app: {
                main: './index.tsx',
                defaultExtension: 'tsx',
            },
            'ag-charts-react': {
                main: './dist/package/index.cjs.js',
                defaultExtension: 'js',
            },
            'ag-charts-community': {
                main: './dist/package/main.cjs.js',
                defaultExtension: 'js',
            },
            'ag-charts-core': {
                main: './dist/package/main.cjs.js',
                defaultExtension: 'js',
            },
            'ag-charts-enterprise': {
                main: './dist/package/main.cjs.js',
                defaultExtension: 'js',
            },
            'ag-charts-types': {
                main: './dist/package/main.cjs.js',
                defaultExtension: 'js',
            },
            'ag-charts-locale': {
                main: './dist/package/main.cjs.js',
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
