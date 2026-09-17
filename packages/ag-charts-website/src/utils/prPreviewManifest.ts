import { agChartsVersion } from '@constants';
import { type ExampleFramework, getImportMap } from '@utils/example-modules/getImportMap';

/**
 * Derives what a per-PR preview publishes, and the `manifest.json` that describes it, from the
 * site's own import-map builder rather than a hand-maintained list — so the preview cannot drift
 * from the URLs an exported Plunker actually asks for.
 *
 * Design and the wider pin flow: ag-dev-prompts docs/pr-plnkr-v2-plan.md.
 *
 * Pure: every path here is derived, nothing is read from disk. Existence checking and the copy
 * itself belong to `scripts/pr-preview-manifest.ts`.
 */

export const MANIFEST_VERSION = 1;
export const MANIFEST_FILENAME = 'manifest.json';

/** Every framework an example can run as, which is every import map the site can emit. */
export const ALL_EXAMPLE_FRAMEWORKS: ExampleFramework[] = ['typescript', 'react', 'angular', 'vue3'];

/**
 * The flat UMD bundles published at the root of `pr-<N>/`, which the sticky PR comment and the
 * legacy (pre-manifest) pin path link directly by filename.
 *
 * Not read from `PUBLISHED_UMD_URLS`, which names the unminified `dist/umd/<pkg>.js` the docs
 * site loads: the preview has always carried the minified bundle under these exact names, and
 * anything already linking them breaks if the name changes.
 */
const UMD_BUNDLES: Record<string, string> = {
    'ag-charts-community': 'packages/ag-charts-community/dist/umd/ag-charts-community.min.js',
    'ag-charts-enterprise': 'packages/ag-charts-enterprise/dist/umd/ag-charts-enterprise.min.js',
};

/**
 * Where each package's published root sits on disk, relative to the repo root. An import-map
 * value's path is relative to the published package root, which for most packages is the package
 * directory itself; `ag-charts-angular` is an Angular library, so ng-packagr assembles its
 * publishable root one level down.
 *
 * `prPreviewManifest.test.ts` checks each entry against the package's own `package.json`, so a
 * changed build output fails there rather than as a preview of missing files.
 */
const PACKAGE_ROOT_OVERRIDES: Record<string, string> = {
    'ag-charts-angular': 'packages/ag-charts-angular/dist/ag-charts-angular',
};

export interface ManifestPackage {
    version: string;
    /**
     * Package-relative path (as it appears after `<pkg>@<version>/` in a published URL) → the
     * path it is published at, relative to `pr-<N>/`. A key ending in `/` is a directory prefix
     * and matches by longest prefix; AG Charts publishes only entry points, so none do today.
     */
    paths: Record<string, string>;
}

export interface PrPreviewManifest {
    version: number;
    repo: string;
    pr: number;
    sha: string;
    base: string;
    /** Package → the flat UMD filename published at the root of `pr-<N>/`. */
    umd: Record<string, string>;
    packages: Record<string, ManifestPackage>;
}

export interface StagedEntry {
    /** Path relative to `pr-<N>/`. */
    target: string;
    /** Repo-root-relative source path. */
    source: string;
}

export interface PrPreviewPlan {
    manifest: PrPreviewManifest;
    entries: StagedEntry[];
}

/** `ag-charts-community/styles/` → `ag-charts-community`; `@scope/name/x` → `@scope/name`. */
export const packageNameOf = (specifier: string): string =>
    specifier
        .split('/')
        .slice(0, specifier.startsWith('@') ? 2 : 1)
        .join('/');

const isAgSpecifier = (specifier: string) => specifier.startsWith('ag-') || specifier.startsWith('@ag-');

/** Every AG package the import map names is built in this repo; nothing here comes from npm. */
const isBuiltHere = (packageName: string) => packageName.startsWith('ag-charts-');

const escapeForRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The package-relative path an import-map value points at, independent of which mode built the
 * map: published values carry `<pkg>@<version>/`, local ones plain `<pkg>/`. Greedy, so the
 * package segment matched is the last one — `ag-charts-angular/fesm2022/ag-charts-angular.mjs`
 * keeps its filename.
 */
export const packageRelativePath = (packageName: string, url: string): string | undefined =>
    url.match(new RegExp(`^(?:.*/)?${escapeForRegExp(packageName)}(?:@[^/]+)?/(.+)$`))?.[1];

/** The repo-root-relative source of a package-relative published path. */
export const sourcePathOf = (packageName: string, relativePath: string): string =>
    `${PACKAGE_ROOT_OVERRIDES[packageName] ?? `packages/${packageName}`}/${relativePath}`;

export interface BuildPrPreviewPlanArgs {
    /** `owner/repo`, as `GITHUB_REPOSITORY` gives it. */
    repo: string;
    pr: number;
    sha: string;
    /**
     * The version to record for a package. Defaults to the version the site is built with, which
     * is read from `PUBLIC_PACKAGE_VERSION` and so is `unknown` outside an Astro build — the
     * staging script passes each package's own `package.json` version instead.
     */
    versionOf?: (packageName: string) => string;
}

export const previewBaseUrl = ({ repo, pr }: { repo: string; pr: number }): string => {
    const [owner, name] = repo.split('/');
    if (!owner || !name) {
        throw new Error(`Expected repo as 'owner/name', got '${repo}'.`);
    }
    return `https://${owner}.github.io/${name}/pr-${pr}/`;
};

export const buildPrPreviewPlan = ({
    repo,
    pr,
    sha,
    versionOf = () => agChartsVersion,
}: BuildPrPreviewPlanArgs): PrPreviewPlan => {
    const packages: Record<string, ManifestPackage> = {};
    const entries = new Map<string, StagedEntry>();

    for (const framework of ALL_EXAMPLE_FRAMEWORKS) {
        const importMap = getImportMap({ framework });
        for (const specifier of Object.keys(importMap)) {
            const url = importMap[specifier];
            if (!isAgSpecifier(specifier)) {
                continue; // react, vue, @angular/*, rxjs, tslib, clone — not ours to publish.
            }
            const packageName = packageNameOf(specifier);
            if (!isBuiltHere(packageName)) {
                throw new Error(
                    `Import map entry '${specifier}' names AG package '${packageName}', which this ` +
                        `repo does not build. Classify it in src/utils/prPreviewManifest.ts.`
                );
            }
            const relativePath = packageRelativePath(packageName, url);
            if (!relativePath) {
                throw new Error(`Could not read a '${packageName}'-relative path out of '${url}'.`);
            }
            const target = `${packageName}/${relativePath}`;
            entries.set(target, { target, source: sourcePathOf(packageName, relativePath) });
            packages[packageName] ??= { version: versionOf(packageName), paths: {} };
            packages[packageName].paths[relativePath] = target;
        }
    }

    const umd: Record<string, string> = {};
    for (const packageName of Object.keys(UMD_BUNDLES)) {
        const source = UMD_BUNDLES[packageName];
        const filename = source.split('/').pop()!;
        entries.set(filename, { target: filename, source });
        umd[packageName] = filename;
    }

    return {
        manifest: {
            version: MANIFEST_VERSION,
            repo,
            pr,
            sha,
            base: previewBaseUrl({ repo, pr }),
            umd,
            packages: Object.fromEntries(
                Object.keys(packages)
                    .sort()
                    .map((packageName) => [packageName, packages[packageName]])
            ),
        },
        entries: [...entries.values()].sort((a, b) => (a.target < b.target ? -1 : 1)),
    };
};
