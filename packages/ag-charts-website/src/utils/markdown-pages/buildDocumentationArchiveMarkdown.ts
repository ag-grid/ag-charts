import { markdownTable } from '@ag-website-shared/markdoc/markdownTable';
import { toAbsoluteUrl } from '@ag-website-shared/markdoc/toAbsoluteUrl';
import { getDocumentationArchiveUrl } from '@ag-website-shared/utils/getArchiveUrl';
import { getChangelogUrl } from '@ag-website-shared/utils/getChangelogUrl';
import { parseVersion } from '@ag-website-shared/utils/parseVersion';

import versionsData from '../../content/versions/ag-charts-versions.json';

const TABLE_HEADERS = ['Version', 'Date', 'Type', 'Documentation', 'Changelog'];

interface VersionEntry {
    version: string;
    date?: string;
    noDocs?: boolean;
}

// Mirrors documentation-archive.astro: one section per major, every non-`noDocs` release.
function majorTable(versions: VersionEntry[], siteRoot?: string): string {
    const rows = versions.map((entry) => {
        const docsUrl = toAbsoluteUrl(getDocumentationArchiveUrl({ site: 'charts', version: entry.version }), siteRoot);
        const changelogUrl = toAbsoluteUrl(getChangelogUrl({ site: 'charts', version: entry.version }), siteRoot);
        return [
            entry.version,
            entry.date ?? '',
            parseVersion(entry.version).versionType,
            `[${entry.version} Documentation](${docsUrl})`,
            `[Changelog](${changelogUrl})`,
        ];
    });
    return markdownTable(TABLE_HEADERS, rows);
}

/**
 * Build the markdown twin of the /documentation-archive/ page: archived documentation and
 * changelog links for every past AG Charts release, grouped by major version (newest first).
 * Reads the same `versions` collection JSON the page renders, so the two cannot drift.
 */
export function buildDocumentationArchiveMarkdown({ siteRoot }: { siteRoot?: string } = {}): string {
    const versions = versionsData as VersionEntry[];

    // Majors newest-first, mirroring documentation-archive.astro.
    const majors = versions
        .filter((entry) => parseVersion(entry.version).isMajor)
        .map((entry) => parseVersion(entry.version).major);

    const frontmatter = [
        '---',
        'title: "AG Charts Documentation Archive"',
        'description: "Browse archived documentation for previous AG Charts versions, from version 9 onwards. View changelogs for every minor and major release."',
        '---',
    ].join('\n');

    const sections = [frontmatter, '# Documentation Archive', 'Review documentation for previous AG Charts versions.'];

    for (const major of majors) {
        const majorVersions = versions.filter((entry) => parseVersion(entry.version).major === major && !entry.noDocs);
        sections.push(`## Version ${major}`);
        sections.push(majorTable(majorVersions, siteRoot));
    }

    return `${sections.filter(Boolean).join('\n\n').trimEnd()}\n`;
}
