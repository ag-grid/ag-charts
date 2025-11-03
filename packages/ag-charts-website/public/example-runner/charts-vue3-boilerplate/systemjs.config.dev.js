(function (global) {
    System.config({
        transpiler: 'ts',
        typescriptOptions: {
            target: 'es2020',
        },
        meta: {
            typescript: {
                exports: 'ts',
            },
            '*.css': { loader: 'css' },
        },
        defaultExtension: 'js',
        paths: {
            'npm:': 'https://cdn.jsdelivr.net/npm/',
        },
        map: {
            css: 'npm:systemjs-plugin-css@0.1.37/css.js',

            clone: 'npm:clone@2.1.2',

            ts: 'npm:plugin-typescript@8.0.0/lib/plugin.js',
            tslib: 'npm:tslib@2.3.1/tslib.js',
            typescript: 'npm:typescript@5.4.5/lib/typescript.min.js',

            vue: 'npm:vue@3.5.0/dist/vue.esm-browser.js',

            app: appLocation,
            // systemJsMap comes from index.html
            ...systemJsMap,
        },
        packages: {
            'css.js': {
                defaultExtension: 'js',
            },
            vue: {
                defaultExtension: 'js',
            },
            app: {
                defaultExtension: 'ts',
            },
            'ag-charts-vue3': {
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
