(function (global) {
    var sjsPaths = {};
    if (typeof systemJsPaths !== 'undefined') {
        sjsPaths = systemJsPaths;
    }

    System.config({
        transpiler: 'ts',
        typescriptOptions: {
            module: 'system',
            moduleResolution: 'node',
            target: 'es2020',
            noImplicitAny: false,
            sourceMap: true,
            jsx: 'react',
            lib: ['es2020', 'dom'],
        },
        defaultExtension: 'js',
        paths: {
            // paths serve as alias
            'npm:': 'https://cdn.jsdelivr.net/npm/',
            ...sjsPaths,
        },
        map: {
            css: boilerplatePath + 'css.js',

            // vuejs
            vue: 'npm:vue@3.2.29/dist/vue.esm-browser.js',
            '@vue/reactivity': 'npm:@vue/reactivity@3.0.0/dist/reactivity.esm-browser.prod.js',
            // vue class component
            'vue-class-component': 'npm:vue-class-component@^8.0.0-beta.3/dist/vue-class-component.cjs.js',

            ts: 'npm:plugin-typescript@8.0.0/lib/plugin.js',
            typescript: 'npm:typescript@4.3.5/lib/typescript.min.js',

            app: appLocation + 'app',
            // systemJsMap comes from index.html
            ...systemJsMap,
        },

        packages: {
            vue: {
                defaultExtension: 'js',
            },
            'vue-class-component': {
                defaultExtension: 'js',
            },
            'vue-property-decorator': {
                defaultExtension: 'js',
            },
            app: {
                defaultExtension: 'js',
            },
            'ag-charts-vue3': {
                main: './lib/AgChartsVue.js',
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
