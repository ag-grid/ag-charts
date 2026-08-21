import { toAbsoluteUrl } from '@ag-website-shared/markdoc/toAbsoluteUrl';
import { GALLERY_CTAS } from '@components/gallery/galleryCtas';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';

import galleryData from '../../content/gallery/data.json';
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

    const frontmatter = [
        '---',
        'title: "Gallery"',
        'description: "Gallery of JavaScript Charts and JavaScript Graphs created with AG Charts. View source code and interact with Charts; live edit examples with CodeSandbox and Plunker."',
        '---',
    ].join('\n');

    const sections = [
        frontmatter,
        '# AG Charts Gallery',
        'Browse the AG Charts gallery of chart examples, grouped by chart type. Each example links to a live, interactive demo.',
        GALLERY_CTAS.map(
            (cta) => `[${cta.title}](${toAbsoluteUrl(urlWithBaseUrl(withDefaultFramework(cta.url)), siteRoot)})`
        ).join(' | '),
    ];

    for (const chartType of series.flat()) {
        const heading = chartType.enterprise ? `${chartType.title} (Enterprise)` : chartType.title;
        const links = chartType.examples
            .filter((example) => !example.hidden)
            .map((example) => `- [${example.title}](${galleryExampleUrl(example.name, siteRoot)})`);

        if (links.length === 0) {
            continue;
        }

        sections.push(`## ${heading}`);
        sections.push(links.join('\n'));
    }

    return `${sections.join('\n\n').trimEnd()}\n`;
}
