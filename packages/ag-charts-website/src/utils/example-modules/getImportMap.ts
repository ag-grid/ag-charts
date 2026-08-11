import { DEV_FILE_BASE_PATH, NPM_CDN, SITE_BASE_URL, agChartsVersion } from '@constants';
import { isUsingPublishedPackages } from '@utils/pages';
import { pathJoin } from '@utils/pathJoin';

/**
 * Module resolution for examples: every bare specifier an example (or a package it loads)
 * imports needs an entry here, pointing at a browser-ready ES module.
 *
 * AG Charts packages resolve to the local build, or to the published CDN build when the site
 * is built against published packages. Third-party frameworks always come from a CDN.
 */

export type ImportMap = Record<string, string>;

/**
 * The framework an example runs as. Narrower than `InternalFramework`, because the two React
 * variants produce the same page and so need the same map.
 */
export type ExampleFramework = 'typescript' | 'react' | 'angular' | 'vue3';

/**
 * The framework versions examples run against, deliberately independent of the versions the
 * docs site itself is built with. Kept in step with what the SystemJS boilerplate loaded.
 */
const ANGULAR_VERSION = '20.0.0';
const REACT_VERSION = '19.2.4';
const RXJS_VERSION = '7.8.1';
const TSLIB_VERSION = '2.3.1';
const VUE_VERSION = '3.5.0';

/**
 * React and React DOM have no ES module build on npm, so they resolve through esm.sh.
 * `external=react` keeps React DOM from bundling a second copy of React, which would give
 * the page two renderers and break hooks.
 *
 * The trailing-slash entries look malformed but are not: an import map appends the unmatched
 * suffix to the target verbatim, so `react-dom/client` has to become a URL esm.sh accepts with
 * the subpath last -- `esm.sh/react-dom@19.2.4&external=react/client`, its build-query-before-
 * subpath form. A `?query` would end up before the subpath and 404.
 */
const REACT_IMPORTS: ImportMap = {
    react: `https://esm.sh/react@${REACT_VERSION}`,
    'react/': `https://esm.sh/react@${REACT_VERSION}/`,
    'react-dom': `https://esm.sh/react-dom@${REACT_VERSION}?external=react`,
    'react-dom/': `https://esm.sh/react-dom@${REACT_VERSION}&external=react/`,
};

/** `esm-browser` is the build that ships Vue's runtime template compiler */
const VUE_IMPORTS: ImportMap = {
    vue: `${NPM_CDN}/vue@${VUE_VERSION}/dist/vue.esm-browser.js`,
};

const angularPackage = (name: string, entryPoint = name) =>
    `${NPM_CDN}/@angular/${name}@${ANGULAR_VERSION}/fesm2022/${entryPoint}.mjs`;

const ANGULAR_IMPORTS: ImportMap = {
    '@angular/animations': angularPackage('animations'),
    '@angular/animations/browser': angularPackage('animations', 'browser'),
    '@angular/common': angularPackage('common'),
    '@angular/common/http': angularPackage('common', 'http'),
    '@angular/compiler': angularPackage('compiler'),
    '@angular/core': angularPackage('core'),
    '@angular/core/primitives/di': angularPackage('core', 'primitives/di'),
    '@angular/core/primitives/event-dispatch': angularPackage('core', 'primitives/event-dispatch'),
    '@angular/core/primitives/signals': angularPackage('core', 'primitives/signals'),
    '@angular/forms': angularPackage('forms'),
    '@angular/platform-browser': angularPackage('platform-browser'),
    '@angular/platform-browser/animations': angularPackage('platform-browser', 'animations'),
    '@angular/platform-browser-dynamic': angularPackage('platform-browser-dynamic'),
    // rxjs' own ESM build imports its internals without file extensions, which native
    // resolution cannot follow, so it comes from esm.sh with those specifiers resolved
    rxjs: `https://esm.sh/rxjs@${RXJS_VERSION}`,
    'rxjs/': `https://esm.sh/rxjs@${RXJS_VERSION}&external=rxjs/`,
    tslib: `${NPM_CDN}/tslib@${TSLIB_VERSION}/tslib.es6.js`,
};

const getFrameworkImports = (framework: ExampleFramework): ImportMap => {
    switch (framework) {
        case 'react':
            return REACT_IMPORTS;
        case 'angular':
            return ANGULAR_IMPORTS;
        case 'vue3':
            return VUE_IMPORTS;
        default:
            return {};
    }
};

/** Package root for AG packages: either the locally served build or the published CDN build */
const getPackageRoot = (packageName: string) =>
    isUsingPublishedPackages()
        ? `${NPM_CDN}/${packageName}@${agChartsVersion}`
        : pathJoin(import.meta.env?.PUBLIC_SITE_URL, SITE_BASE_URL, DEV_FILE_BASE_PATH, packageName);

const esmEntryPoint = (packageName: string, entryPoint = 'dist/package/main.esm.mjs') =>
    `${getPackageRoot(packageName)}/${entryPoint}`;

/**
 * The library packages every example resolves, whichever framework it runs as. Enterprise is
 * included unconditionally, as the SystemJS configuration it replaces did the same: a
 * community example never imports it, so the entry is unused rather than wrong.
 */
const LIBRARY_IMPORTS = (): ImportMap => ({
    'ag-charts-types': esmEntryPoint('ag-charts-types'),
    'ag-charts-core': esmEntryPoint('ag-charts-core'),
    'ag-charts-community': esmEntryPoint('ag-charts-community'),
    'ag-charts-enterprise': esmEntryPoint('ag-charts-enterprise'),
    'ag-charts-locale': esmEntryPoint('ag-charts-locale'),
});

/** The framework wrapper's ES module entry point, which differs per package */
const FRAMEWORK_WRAPPERS: Record<Exclude<ExampleFramework, 'typescript'>, [string, string]> = {
    react: ['ag-charts-react', 'dist/package/index.esm.mjs'],
    angular: ['ag-charts-angular', 'fesm2022/ag-charts-angular.mjs'],
    vue3: ['ag-charts-vue3', 'dist/package/index.esm.mjs'],
};

export const getImportMap = ({ framework }: { framework: ExampleFramework }): ImportMap => {
    const imports: ImportMap = {
        ...LIBRARY_IMPORTS(),
        ...getFrameworkImports(framework),
    };

    const wrapper = framework === 'typescript' ? undefined : FRAMEWORK_WRAPPERS[framework];
    if (wrapper) {
        const [packageName, entryPoint] = wrapper;
        imports[packageName] = esmEntryPoint(packageName, entryPoint);
    }

    // Sorted so the emitted import map is byte-stable across builds
    const sorted: ImportMap = {};
    for (const specifier of Object.keys(imports).sort()) {
        sorted[specifier] = imports[specifier];
    }

    return sorted;
};
