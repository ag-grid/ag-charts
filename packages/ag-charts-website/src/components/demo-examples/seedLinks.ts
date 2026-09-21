import type { DemoPageOpenIn } from '@ag-website-shared/components/demo-page/types';
import { parseVersion } from '@ag-website-shared/utils/parseVersion';
import { agChartsVersion } from '@constants';

/**
 * Frameworks a demo can be seeded in, as the folder names under
 * `packages/ag-charts-demos/seeds/<demo>/`. Only the React seed exists so far; the ports are
 * listed here as they land.
 */
export type SeedFramework = 'react' | 'angular' | 'vue' | 'typescript';

export const SEED_FRAMEWORK_DISPLAY_TEXT: Record<SeedFramework, string> = {
    react: 'React',
    angular: 'Angular',
    vue: 'Vue',
    typescript: 'TypeScript',
};

/** The seeds the site offers links for, in display order. */
export const AVAILABLE_SEED_FRAMEWORKS: readonly SeedFramework[] = ['react'];

const REPOSITORY = 'ag-grid/ag-charts';
const SEEDS_PATH = 'packages/ag-charts-demos/seeds';

interface SeedLinkParams {
    /** Demo app id, as registered in `ag-charts-demos` and used for its seed folder. */
    demoId: string;
    framework: SeedFramework;
    /** The package version the site displays; defaults to the build's `PUBLIC_PACKAGE_VERSION`. */
    version?: string;
}

/**
 * The git tag a seed link targets for a given package version. A beta such as
 * `14.2.0-beta.20260920` links to the released `release-14.2.0`: release tags carry no
 * pre-release suffix, and the seeds pinned there are the ones npm can install.
 */
export function getSeedReleaseTag(version: string): string {
    const { major, minor, patchNum } = parseVersion(version);
    if ([major, minor, patchNum].some((part) => Number.isNaN(part))) {
        throw new Error(`Cannot derive a release tag from version "${version}"`);
    }
    return `release-${major}.${minor}.${patchNum}`;
}

/** Folder of the seed inside the repository, relative to its root. */
export function getSeedPath(demoId: string, framework: SeedFramework): string {
    return `${SEEDS_PATH}/${demoId}/${framework}`;
}

/** The seed's source folder on GitHub at the release tag. */
export function getSeedGithubUrl({ demoId, framework, version = agChartsVersion }: SeedLinkParams): string {
    return `https://github.com/${REPOSITORY}/tree/${getSeedReleaseTag(version)}/${getSeedPath(demoId, framework)}`;
}

/**
 * Opens the seed in StackBlitz straight from GitHub. StackBlitz imports only the sub-folder,
 * runs `npm install` and starts the `dev` script; `title` names the resulting project.
 */
export function getSeedStackBlitzUrl({
    demoId,
    framework,
    title,
    version = agChartsVersion,
}: SeedLinkParams & { title: string }): string {
    const projectTitle = `AG Charts ${title} (${SEED_FRAMEWORK_DISPLAY_TEXT[framework]})`;
    return `https://stackblitz.com/github/${REPOSITORY}/tree/${getSeedReleaseTag(version)}/${getSeedPath(demoId, framework)}?title=${encodeURIComponent(projectTitle)}`;
}

/** The demo page's "open in" entries, one per available seed framework. */
export function getDemoOpenInLinks({
    demoId,
    title,
    version = agChartsVersion,
}: Omit<SeedLinkParams, 'framework'> & { title: string }): DemoPageOpenIn[] {
    return AVAILABLE_SEED_FRAMEWORKS.map((framework) => ({
        framework: SEED_FRAMEWORK_DISPLAY_TEXT[framework],
        href: getSeedStackBlitzUrl({ demoId, framework, title, version }),
        sourceHref: getSeedGithubUrl({ demoId, framework, version }),
    }));
}
