import { toAbsoluteUrl } from '@ag-website-shared/markdoc/toAbsoluteUrl';
import { getGeneratedContents } from '@components/example-generator';
import { stripOutExampleGeneratorCode } from '@components/example-runner/components/stripOutExampleGeneratorCode';
import { resolveGallerySeo } from '@components/gallery/utils/gallerySeo';
import { getExampleFileUrl, getExampleLinkUrl, getPageUrl } from '@components/gallery/utils/urlPaths';
import { toTitle } from '@utils/toTitle';
import { urlWithPrefix } from '@utils/urlWithPrefix';
import GithubSlugger from 'github-slugger';

/** A gallery example as `getGalleryExamples` hands it to the page (and to this builder). */
export interface GalleryExamplePage {
    title: string;
    name: string;
    seriesTitle: string;
    /** Chart family key, used to resolve the page's copy. */
    chartSeriesName: string;
    /** Docs page for the chart type. Absent for series whose docs page follows the default slug. */
    seriesLink?: string;
    enterprise?: boolean;
}

/** A neighbouring example, as the page's "More from the charts gallery" links render it. */
export interface GalleryExampleNeighbour {
    title: string;
    name: string;
}

export interface BuildGalleryExampleMarkdownOptions {
    page: GalleryExamplePage;
    exampleName: string;
    /** The three neighbours the page links to, in page order. */
    neighbours: GalleryExampleNeighbour[];
    siteRoot?: string;
}

/** Matches GallerySeriesLink: an explicit `seriesLink`, else the chart type's default docs slug. */
function seriesDocsUrl(page: GalleryExamplePage): string {
    const slugger = new GithubSlugger();
    const url = page.seriesLink ?? `./${slugger.slug(page.seriesTitle)}-series`;
    return urlWithPrefix({ url, framework: 'javascript' });
}

/**
 * Build the markdown twin of a `/gallery/<example>` page. Reads the same gallery entry the page
 * renders and the same generated example the page's code viewer shows — the vanilla build, with the
 * generator's dark-mode and e2e harness stripped, as on the page.
 *
 * The chart itself is a live iframe on the page; here it is the example's own source, which is what
 * a reader without a browser needs. Data and topology files are linked rather than inlined: several
 * run to tens of kilobytes of raw coordinates and say nothing about how the chart is configured.
 */
export async function buildGalleryExampleMarkdown({
    page,
    exampleName,
    neighbours,
    siteRoot,
}: BuildGalleryExampleMarkdownOptions): Promise<string> {
    const contents = await getGeneratedContents({ type: 'gallery', exampleName });
    const seo = resolveGallerySeo(page);

    const document: string[] = [
        ['---', `title: ${JSON.stringify(seo.title)}`, `description: ${JSON.stringify(seo.description)}`, '---'].join(
            '\n'
        ),
        `# ${seo.h1}`,
        seo.intro,
    ];

    const chartType = page.enterprise ? `${page.seriesTitle} (Enterprise)` : page.seriesTitle;
    document.push(`Chart type: ${chartType}`);
    document.push(
        `[View ${toTitle(page.seriesTitle)} Charts Documentation](${toAbsoluteUrl(seriesDocsUrl(page), siteRoot)})`
    );
    document.push(`[Run this example](${toAbsoluteUrl(getExampleLinkUrl({ exampleName }), siteRoot)})`);

    const entryFileName = contents?.entryFileName;
    if (entryFileName && contents?.files?.[entryFileName]) {
        const files = { ...contents.files };
        stripOutExampleGeneratorCode(files);
        document.push('## Source', `\`\`\`js\n${files[entryFileName].trim()}\n\`\`\``);

        // Data and topology modules the source imports, linked to the files the example serves.
        const dataFiles = Object.keys(contents.files).filter(
            (fileName) => fileName !== entryFileName && fileName.endsWith('.js')
        );
        if (dataFiles.length) {
            const links = dataFiles
                .map(
                    (fileName) =>
                        `- [${fileName}](${toAbsoluteUrl(getExampleFileUrl({ exampleName, fileName }), siteRoot)})`
                )
                .join('\n');
            document.push('The source above reads its data from:', links);
        }
    }

    if (neighbours.length) {
        const links = neighbours
            .map(({ title, name }) => `- [${title}](${toAbsoluteUrl(getPageUrl(name), siteRoot)})`)
            .join('\n');
        document.push('## More from the charts gallery', links);
    }

    return `${document.join('\n\n').trimEnd()}\n`;
}
