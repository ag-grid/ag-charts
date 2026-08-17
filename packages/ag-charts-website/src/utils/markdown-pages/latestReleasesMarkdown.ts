import whatsNewData from '@ag-website-shared/content/whats-new/data.json';
import { parseVersion } from '@ag-website-shared/utils/parseVersion';

const { blogPrefix } = whatsNewData['charts'];

export interface ReleaseVersion {
    version: string;
    date?: string;
    highlights?: Array<{ text: string }>;
}

export interface LatestReleasesOptions {
    /** The `versions` collection, newest first, as the pages receive it. */
    versionsData: ReleaseVersion[];
    /** How many feature releases to list — the page's own cap. */
    count: number;
}

/**
 * The latest feature releases as markdown: a heading per version linking its release blog, then its
 * highlights as bullets.
 *
 * Mirrors how both the homepage and the landing pages' What's New section pick versions — `.0`
 * releases only, newest first, capped, and only those carrying highlights — and how they derive the
 * blog URL from the parsed version, so the twins show the same releases as the pages.
 */
export function latestReleasesMarkdown({ versionsData, count }: LatestReleasesOptions): string {
    return versionsData
        .filter((version) => version.version.endsWith('.0'))
        .slice(0, count)
        .filter((version) => version.highlights)
        .map((version) => {
            const { major, minor } = parseVersion(version.version);
            const blogUrl = `${minor ? `${blogPrefix}${major}-${minor}` : `${blogPrefix}${major}`}/`;
            const date = version.date ? ` — ${version.date}` : '';
            const highlights = version.highlights!.map((highlight) => `- ${highlight.text}`).join('\n');
            return `### [${version.version}${date}](${blogUrl})\n\n${highlights}`;
        })
        .join('\n\n');
}
