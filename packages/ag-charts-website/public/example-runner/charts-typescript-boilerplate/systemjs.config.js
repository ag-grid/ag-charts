(function (global) {

    var sjsPaths = {};
    if (typeof systemJsPaths !== "undefined") {
        sjsPaths = systemJsPaths;
    }

    System.config({
        // DEMO ONLY! REAL CODE SHOULD NOT TRANSPILE IN THE BROWSER
        transpiler: "ts",
        typescriptOptions: {
            // Copy of compiler options in standard tsconfig.json
            target: "es5",
            module: "system", //gets rid of console warning
            moduleResolution: "node",
            sourceMap: false,
            emitDecoratorMetadata: true,
            experimentalDecorators: true,
            lib: ["es2015", "dom"],
            noImplicitAny: true,
            suppressImplicitAnyIndexErrors: true
        },
        meta: {
            typescript: {
                exports: "ts"
            },
            '*.css': { loader: 'css' }
        },
        paths:
                {
                    // paths serve as alias
                    "npm:": "https://cdn.jsdelivr.net/npm/",
            ...sjsPaths
        },
        // map tells the System loader where to look for things
        map: {
            css: boilerplatePath + "css.js",

            ts: "npm:plugin-typescript@8.0.0/lib/plugin.js",
            tslib: "npm:tslib@2.3.1/tslib.js",
            typescript: "npm:typescript@4.3.5/lib/typescript.min.js",

            // appLocation comes from index.html
            app: appLocation,

            ...systemJsMap
        },
        // packages tells the System loader how to load when no filename and/or no extension
        packages: {
            app: {
                main: "./main.ts",
                defaultExtension: "ts"
            }
        }
    });
})(this);

window.addEventListener('error', e => {
    console.error('ERROR', e.message, e.filename)
});