(function (global) {
    var sjsPaths = {};
    if (typeof systemJsPaths !== 'undefined') {
        sjsPaths = systemJsPaths;
    }
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
            // paths serve as alias
            'npm:': 'https://cdn.jsdelivr.net/npm/',
            ...sjsPaths,
        },
        map: {
            css: 'npm:systemjs-plugin-css@0.1.37/css.js',

            ts: 'npm:plugin-typescript@8.0.0/lib/plugin.js',
            tslib: 'npm:tslib@2.3.1/tslib.js',
            typescript: 'npm:typescript@5.4.5/lib/typescript.min.js',

            clone: 'npm:clone@2.1.2',

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
            'ag-charts-community/modules': {
                main: './dist/package/main-modules.cjs.js',
                defaultExtension: 'js',
            },
            'ag-charts-enterprise/modules': {
                main: './dist/package/main-modules.cjs.js',
                defaultExtension: 'js',
            },
        },
    });
})(this);

window.addEventListener('error', (e) => {
    console.error('ERROR', e.message, e.filename);
});
