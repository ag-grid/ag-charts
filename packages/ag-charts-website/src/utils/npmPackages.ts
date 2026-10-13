/**
 * The AG Charts package tarballs a deploying docs site build serves from its own output, so a
 * seed can install the build that site was built from before (or instead of) it reaches npm.
 *
 * The names are fixed and carry no version: every deploy overwrites them, which is also why the
 * `.htaccess` rule for this folder disables caching (see `getNpmPackagesRules`).
 *
 * Kept free of imports so the Astro config, the integration and the `.htaccess` generator can
 * all share it.
 */

/** Folder, relative to the site base, the tarballs are published under. */
export const NPM_PACKAGES_DIR = 'npm-packages';

/** The packages a seed can depend on, in dependency order. */
export const NPM_PACKAGE_NAMES = [
    'ag-charts-types',
    'ag-charts-core',
    'ag-charts-locale',
    'ag-charts-community',
    'ag-charts-enterprise',
    'ag-charts-react',
    'ag-charts-angular',
    'ag-charts-vue3',
] as const;

export type NpmPackageName = (typeof NPM_PACKAGE_NAMES)[number];

/** Path of a package's tarball relative to the site base, e.g. `npm-packages/ag-charts-react.tgz`. */
export const npmPackageTarballPath = (name: NpmPackageName) => `${NPM_PACKAGES_DIR}/${name}.tgz`;
