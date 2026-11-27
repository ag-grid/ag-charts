/*
 * Browser-side runtime for documentation examples, exposed as `window.agExampleRunner`.
 * Served as a file rather than inlined, so an export shows the example's own code.
 */
/* global ts */
(function () {
    /** The page cannot serialise a TypeScript enum, so it names the member instead */
    const COMPILER_OPTION_ENUMS = { module: 'ModuleKind', target: 'ScriptTarget', jsx: 'JsxEmit' };

    function setUpPage() {
        // Examples read `process.env.NODE_ENV` to guard dev-only validations
        window.process = { env: { NODE_ENV: 'development' } };

        window.addEventListener('error', function (e) {
            console.error('ERROR', e.message, e.filename);
        });
    }

    /**
     * Transpiles the example in the page, for an export that has no build step. Modules become
     * blob URLs, so relative specifiers and `import.meta.url` are patched back in per module.
     */
    function runTranspiled(options) {
        const specifierRegex = () => new RegExp(options.specifierRegex, 'g');
        const cssImportRegex = () => new RegExp(options.cssImportRegex, 'gm');
        const assetRegex = new RegExp(options.assetRegex, 'i');
        const moduleExtensionRegex = new RegExp(options.moduleExtensionRegex, 'i');
        const moduleExtensions = options.moduleExtensions;
        const loader = options.stylesheetLoaderName;

        const compilerOptions = Object.fromEntries(
            Object.entries(options.compilerOptions).map(([name, value]) => [
                name,
                COMPILER_OPTION_ENUMS[name] ? ts[COMPILER_OPTION_ENUMS[name]][value] : value,
            ])
        );

        // Each module is its own blob, so the loader has to be reachable from all of them
        window[loader] = (href) =>
            new Promise((resolve) => {
                const { pathname } = new URL(href, document.baseURI);
                const linked = (link) => new URL(link.href, document.baseURI).pathname === pathname;
                if (Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(linked)) {
                    resolve();
                    return;
                }
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;
                link.addEventListener('load', () => resolve());
                link.addEventListener('error', () => resolve());
                document.head.appendChild(link);
            });

        const isRelative = (specifier) => specifier.startsWith('./') || specifier.startsWith('../');

        /** Modules are keyed by their real URL, so a module shared by two others is compiled once */
        const blobUrls = new Map();

        // Native resolution has no default extension, and neither do the sources: Angular
        // examples import './app.component'
        const fetchModule = async (url) => {
            const candidates = moduleExtensionRegex.test(url) ? [url] : moduleExtensions.map((ext) => url + ext);

            for (const candidate of candidates) {
                const response = await fetch(candidate);
                if (response.ok) {
                    return { url: candidate, source: await response.text() };
                }
            }

            throw new Error('Could not resolve example module: ' + url);
        };

        /** As server-side, but resolving relative hrefs here rather than in the module */
        const rewriteCssImports = (source, url) => {
            const rewritten = source.replace(cssImportRegex(), (match, quote, specifier) => {
                if (!isRelative(specifier)) {
                    return match;
                }
                return 'await window.' + loader + '(' + JSON.stringify(new URL(specifier, url).href) + ');';
            });

            return rewritten.replace(cssImportRegex(), (_match, _quote, specifier) => {
                return 'await window.' + loader + '(import.meta.resolve(' + JSON.stringify(specifier) + '));';
            });
        };

        const rewriteSpecifiers = async (source, url) => {
            const rewrites = new Map();

            for (const [, , , specifier] of source.matchAll(specifierRegex())) {
                if (!isRelative(specifier) || rewrites.has(specifier)) {
                    continue;
                }

                const resolved = new URL(specifier, url).href;
                rewrites.set(specifier, assetRegex.test(specifier) ? resolved : await toBlobUrl(resolved));
            }

            return source.replace(specifierRegex(), (match, prefix, quote, specifier) =>
                rewrites.has(specifier) ? prefix + quote + rewrites.get(specifier) + quote : match
            );
        };

        const toBlobUrl = async (requestedUrl) => {
            if (blobUrls.has(requestedUrl)) {
                return blobUrls.get(requestedUrl);
            }

            const pending = (async () => {
                const { url, source } = await fetchModule(requestedUrl);
                const { outputText } = ts.transpileModule(rewriteCssImports(source, url), {
                    fileName: url,
                    compilerOptions: compilerOptions,
                });
                const withRealUrl = outputText.replaceAll('import.meta.url', JSON.stringify(url));
                const code = await rewriteSpecifiers(withRealUrl, url);

                return URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
            })();

            blobUrls.set(requestedUrl, pending);

            return pending;
        };

        return toBlobUrl(new URL(options.entry, document.baseURI).href)
            .then((entryUrl) => import(entryUrl))
            .catch((error) => {
                console.error('ERROR', error && error.message);
            });
    }

    window.agExampleRunner = {
        setUpPage: setUpPage,
        runTranspiled: runTranspiled,
    };
})();
