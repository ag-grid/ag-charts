import { toAbsoluteUrl } from '@ag-website-shared/markdoc/toAbsoluteUrl';
import { GALLERY_HUB_COPY } from '@components/gallery/galleryCopy';
import { GALLERY_CTAS } from '@components/gallery/galleryCtas';
import { galleryFamilyHeading, resolveGalleryH1 } from '@components/gallery/utils/gallerySeo';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';

import galleryData from '../../content/gallery/data.json';
import { buildChartsFrontmatter } from './chartsFrontmatter';
import { withDefaultFramework } from './withDefaultFramework';

// The slice of the gallery collection this twin consumes; shaped to how gallery.astro iterates.
interface GalleryExampleEntry {
    title: string;
    name: string;
    hidden?: boolean;
}
interface GallerySeries {
    title: string;
    enterprise: boolean;
    examples: GalleryExampleEntry[];
}
interface GalleryContent {
    series: GallerySeries[][];
}

// Must match the /gallery/<name>/ URLs the page builds via getPageUrl.
function galleryExampleUrl(name: string, siteRoot?: string): string {
    return toAbsoluteUrl(urlWithBaseUrl(`/gallery/${name}/`), siteRoot);
}

/**
 * Build the markdown twin of the /gallery/ page: every AG Charts gallery example grouped by
 * its chart type, each linking to its live, interactive demo. Reads the same `gallery`
 * collection JSON the page renders, so the two cannot drift.
 */
export function buildGalleryMarkdown({ siteRoot }: { siteRoot?: string } = {}): string {
    const { series } = galleryData as GalleryContent;

    const frontmatter = buildChartsFrontmatter({
        pageUrl: '/gallery/',
        siteRoot,
        title: GALLERY_HUB_COPY.title,
        description: GALLERY_HUB_COPY.description,
    });

    const sections = [
        frontmatter,
        `# ${GALLERY_HUB_COPY.h1}`,
        GALLERY_HUB_COPY.intro,
        GALLERY_CTAS.map(
            (cta) => `[${cta.title}](${toAbsoluteUrl(urlWithBaseUrl(withDefaultFramework(cta.url)), siteRoot)})`
        ).join(' | '),
    ];

    for (const chartType of series.flat()) {
        const familyHeading = galleryFamilyHeading(chartType.title);
        const heading = chartType.enterprise ? `${familyHeading} (Enterprise)` : familyHeading;
        const links = chartType.examples
            .filter((example) => !example.hidden)
            .map((example) => `- [${resolveGalleryH1(example)}](${galleryExampleUrl(example.name, siteRoot)})`);

        if (links.length === 0) {
            continue;
        }

        sections.push(`## ${heading}`);
        sections.push(links.join('\n'));
    }

    return `${sections.join('\n\n').trimEnd()}\n`;
}
