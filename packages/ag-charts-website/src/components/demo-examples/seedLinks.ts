import type { DemoPageOpenIn } from '@ag-website-shared/components/demo-page/types';
import { parseVersion } from '@ag-website-shared/utils/parseVersion';
import { agChartsVersion } from '@constants';
import { getIsProduction } from '@utils/env';
import { getRootUrl } from '@utils/pages';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Frameworks a demo can be seeded in, as the folder names under
 * `packages/ag-charts-demos/seeds/<demo>/`. Which of them a demo offers is read from the seed
 * manifests at build time (`readSeedManifests`), so a port shows up on its page once its manifest
 * is committed.
 */
export type SeedFramework = 'react' | 'angular' | 'vue' | 'typescript';

export const SEED_FRAMEWORK_DISPLAY_TEXT: Record<SeedFramework, string> = {
    react: 'React',
    angular: 'Angular',
    vue: 'Vue',
    typescript: 'TypeScript',
};

/** Every framework a seed can be written in, in the order the page lists them. */
export const SEED_FRAMEWORK_ORDER: readonly SeedFramework[] = ['react', 'angular', 'vue', 'typescript'];

/**
 * The repository the seed links open. `.github/workflows/demo-seeds-mirror.yml` copies every seed
 * there as the folder `<demo>/<framework>`, with the same refs as this repository. StackBlitz
 * imports a folder by downloading its whole repository, so a small mirror opens in seconds where
 * this monorepo takes minutes.
 */
const SEED_REPOSITORY = 'ag-grid/ag-charts-demos';
/** Where the seeds live in this checkout; only used to find them on disk. */
const SEEDS_PATH = 'packages/ag-charts-demos/seeds';
const MANIFEST_FILENAME = '.seed-manifest.json';

/**
 * The committed seeds in this checkout. Resolved from the monorepo root (`getRootUrl`) rather than
 * `import.meta.url`, which points at the bundled chunk at build time and so depends on how deep
 * Astro nests its output.
 */
function defaultSeedsDir(): string {
    return join(fileURLToPath(getRootUrl()), SEEDS_PATH);
}

/** The branch every non-production build links to: it always carries the current seeds. */
export const SEED_DEVELOPMENT_REF = 'latest';

/** One committed seed, as its `.seed-manifest.json` declares it. */
export interface SeedManifestEntry {
    demo: string;
    framework: SeedFramework;
}

interface SeedRefParams {
    /** The package version the site displays; defaults to the build's `PUBLIC_PACKAGE_VERSION`. */
    version?: string;
    /** Whether this is a production build; defaults to the build's own environment. */
    isProduction?: boolean;
}

interface SeedLinkParams extends SeedRefParams {
    /** Demo app id, as registered in `ag-charts-demos` and used for its seed folder. */
    demoId: string;
    framework: SeedFramework;
}

function isSeedFramework(value: string): value is SeedFramework {
    return (SEED_FRAMEWORK_ORDER as readonly string[]).includes(value);
}

function listDirectories(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();
}

/**
 * Every committed seed, found by its `seeds/<demo>/<framework>/.seed-manifest.json`. A folder
 * without a manifest is not a seed and is skipped; a manifest that does not parse, that names a
 * different demo or framework from the folder it lives in, or whose framework this site cannot
 * label fails the build rather than quietly dropping or mislabelling a link.
 *
 * Runs at build time only: the demo page renders these links in its Astro frontmatter, and
 * nothing client-side imports this module.
 */
export function readSeedManifests(seedsDir: string = defaultSeedsDir()): SeedManifestEntry[] {
    if (!existsSync(seedsDir)) {
        throw new Error(`Demo seeds folder not found at ${seedsDir}`);
    }
    const entries: SeedManifestEntry[] = [];
    for (const demo of listDirectories(seedsDir)) {
        for (const framework of listDirectories(join(seedsDir, demo))) {
            const manifestPath = join(seedsDir, demo, framework, MANIFEST_FILENAME);
            if (!existsSync(manifestPath)) continue;

            let manifest: Partial<Record<'demo' | 'framework', unknown>>;
            try {
                manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
            } catch (error) {
                throw new Error(`${manifestPath} is not valid JSON: ${(error as Error).message}`);
            }
            if (manifest.demo !== demo || manifest.framework !== framework) {
                throw new Error(
                    `${manifestPath} names ${String(manifest.demo)}/${String(manifest.framework)} but lives at ${demo}/${framework}`
                );
            }
            if (!isSeedFramework(framework)) {
                throw new Error(
                    `${manifestPath}: "${framework}" is not a seed framework the site can link (known: ${SEED_FRAMEWORK_ORDER.join(', ')})`
                );
            }
            entries.push({ demo, framework });
        }
    }
    return entries;
}

/** The frameworks `demoId` has a seed for, in display order; empty when it has none. */
export function getAvailableSeedFrameworks(demoId: string, manifests: readonly SeedManifestEntry[]): SeedFramework[] {
    const available = new Set(manifests.filter((entry) => entry.demo === demoId).map((entry) => entry.framework));
    return SEED_FRAMEWORK_ORDER.filter((framework) => available.has(framework));
}

/**
 * The git tag a production seed link targets for a given package version. A beta such as
 * `14.2.0-beta.20260920` maps to the released `release-14.2.0`: release tags carry no
 * pre-release suffix, and the seeds pinned there are the ones npm can install.
 */
export function getSeedReleaseTag(version: string): string {
    const { major, minor, patchNum } = parseVersion(version);
    if ([major, minor, patchNum].some((part) => Number.isNaN(part))) {
        throw new Error(`Cannot derive a release tag from version "${version}"`);
    }
    return `release-${major}.${minor}.${patchNum}`;
}

/**
 * The git ref of the mirror a seed link targets. Production links the release tag matching the
 * site's version, so the seed a reader opens is the one that shipped. Every other build (dev,
 * staging, preview) links the `latest` branch, which the mirror syncs on every push to this
 * repository's `latest`, so those links never 404 while a release is still pending.
 */
export function getSeedGitRef({ version, isProduction }: Required<SeedRefParams>): string {
    return isProduction ? getSeedReleaseTag(version) : SEED_DEVELOPMENT_REF;
}

function resolveSeedGitRef({ version = agChartsVersion, isProduction = getIsProduction() }: SeedRefParams): string {
    return getSeedGitRef({ version, isProduction });
}

/** Folder of the seed inside the mirror, relative to its root. */
export function getSeedPath(demoId: string, framework: SeedFramework): string {
    return `${demoId}/${framework}`;
}

/** The seed's folder in the mirror on GitHub, at the ref for this build. */
export function getSeedGithubUrl({ demoId, framework, ...ref }: SeedLinkParams): string {
    return `https://github.com/${SEED_REPOSITORY}/tree/${resolveSeedGitRef(ref)}/${getSeedPath(demoId, framework)}`;
}

/**
 * Opens the seed in StackBlitz straight from the mirror on GitHub. StackBlitz imports the
 * sub-folder, runs `npm install` and starts the `dev` script; `title` names the resulting project.
 */
export function getSeedStackBlitzUrl({ demoId, framework, title, ...ref }: SeedLinkParams & { title: string }): string {
    const projectTitle = `AG Charts ${title} (${SEED_FRAMEWORK_DISPLAY_TEXT[framework]})`;
    return `https://stackblitz.com/github/${SEED_REPOSITORY}/tree/${resolveSeedGitRef(ref)}/${getSeedPath(demoId, framework)}?title=${encodeURIComponent(projectTitle)}`;
}

/**
 * The demo page's "open in" entries, one per framework the demo has a committed seed for, in
 * display order. `manifests` defaults to the seeds in this checkout.
 */
export function getDemoOpenInLinks({
    demoId,
    title,
    manifests = readSeedManifests(),
    ...ref
}: Omit<SeedLinkParams, 'framework'> & { title: string; manifests?: readonly SeedManifestEntry[] }): DemoPageOpenIn[] {
    return getAvailableSeedFrameworks(demoId, manifests).map((framework) => ({
        framework: SEED_FRAMEWORK_DISPLAY_TEXT[framework],
        href: getSeedStackBlitzUrl({ demoId, framework, title, ...ref }),
        sourceHref: getSeedGithubUrl({ demoId, framework, ...ref }),
    }));
}
