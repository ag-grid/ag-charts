// cspell:ignore whats
import type { HeroSection, LandingPageContent } from '@ag-website-shared/components/landing-pages/types';
import { htmlInlineToMarkdown } from '@ag-website-shared/markdoc/htmlInlineToMarkdown';
import { toAbsoluteUrl } from '@ag-website-shared/markdoc/toAbsoluteUrl';
import type {
    LandingPageVersion,
    Resolve,
} from '@ag-website-shared/markdown-pages/landing-pages/buildLandingPageMarkdown';
import {
    link,
    sectionBody,
    sectionHeader,
} from '@ag-website-shared/markdown-pages/landing-pages/buildLandingPageMarkdown';
import type {
    ChartTypesShowcaseSection,
    ChartsLandingPageSection,
    CodeExampleSection,
    FeatureGridSection,
    MapChartsSection,
    WhatsNewSection,
} from '@components/landing-pages/types';
import { getFrameworkFromInternalFramework } from '@utils/framework';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import { urlWithPrefix } from '@utils/urlWithPrefix';

import { type ReleaseVersion, latestReleasesMarkdown } from './latestReleasesMarkdown';

/** The `landingPages` entry as this builder needs it: the shared shape, narrowed to charts sections. */
export type ChartsLandingPageContent = Omit<LandingPageContent, 'sections'> & {
    sections: ChartsLandingPageSection[];
};

export interface BuildChartsLandingPageMarkdownOptions {
    content: ChartsLandingPageContent;
    /** The `versions` collection, for the hero's version badge and the What's New section. */
    versions?: Array<LandingPageVersion & ReleaseVersion>;
    siteRoot?: string;
}

/** Default number of releases the What's New section lists, matching WhatsNewSection.astro. */
const DEFAULT_VERSIONS_TO_SHOW = 3;

/** A section's own call to action, as `LandingPageSection` renders it beneath the heading. */
function ctaBlock(cta: { text: string; url: string } | undefined, resolve: Resolve, siteRoot?: string): string[] {
    return cta ? [link(cta.text, cta.url, resolve, siteRoot)] : [];
}

function featureGridBody(section: FeatureGridSection, resolve: Resolve, siteRoot?: string): string[] {
    // Each card is a link, so the title carries it; the section's own cta is not rendered by
    // FeatureGridSection.astro, so it is not rendered here either.
    return [
        section.items
            .map((item) => `- **${link(item.title, item.link, resolve, siteRoot)}** — ${item.description}`)
            .join('\n'),
    ];
}

function chartTypesShowcaseBody(section: ChartTypesShowcaseSection, resolve: Resolve, siteRoot?: string): string[] {
    const items = section.items
        .map((item) => {
            // Not every card carries a link — the "And More..." card and the docs-example cards on
            // the enterprise page have none, and the page renders those as unlinked cards.
            const title = item.link ? link(item.title, item.link, resolve, siteRoot) : item.title;
            return `- **${title}** — ${item.description}`;
        })
        .join('\n');
    return [items, ...ctaBlock(section.cta, resolve, siteRoot)];
}

function codeExampleBody(section: CodeExampleSection): string[] {
    const fileName = section.fileName ? `\`${section.fileName}\`` : undefined;
    const fence = `\`\`\`${section.language ?? 'ts'}\n${section.code}\n\`\`\``;
    return [fileName, fence].filter((part): part is string => part != null);
}

function mapChartsBody(section: MapChartsSection, resolve: Resolve, siteRoot?: string): string[] {
    const cards = section.cards.map((card) => `- **${card.title}** — ${card.description}`).join('\n');
    return [cards, ...ctaBlock(section.cta, resolve, siteRoot)];
}

function whatsNewBody(
    section: WhatsNewSection,
    versions: BuildChartsLandingPageMarkdownOptions['versions'],
    resolve: Resolve,
    siteRoot?: string
): string[] {
    const releases = versions
        ? latestReleasesMarkdown({
              versionsData: versions,
              count: section.versionsToShow ?? DEFAULT_VERSIONS_TO_SHOW,
          })
        : '';
    return [releases, ...ctaBlock(section.cta, resolve, siteRoot)].filter(Boolean);
}

/**
 * Body of a charts-specific section. The sections shared with the other products fall through to
 * the shared builder's own handling, so the two stay in step.
 */
function chartsSectionBody(
    section: ChartsLandingPageSection,
    versions: BuildChartsLandingPageMarkdownOptions['versions'],
    resolve: Resolve,
    resolveFaq: Resolve,
    siteRoot?: string
): string[] {
    switch (section.type) {
        case 'feature-grid':
            return featureGridBody(section, resolve, siteRoot);
        case 'chart-types-showcase':
            return chartTypesShowcaseBody(section, resolve, siteRoot);
        case 'code-example':
            return codeExampleBody(section);
        case 'map-charts':
            return mapChartsBody(section, resolve, siteRoot);
        case 'whats-new':
            return whatsNewBody(section, versions, resolve, siteRoot);
        // A live demo or a chart explorer on the page: no further prose, so the heading,
        // subheading and CTA are the whole of their content here.
        case 'performance-demo':
        case 'financial-charts':
        case 'chart-explorer':
            return ctaBlock(section.cta, resolve, siteRoot);
        // A chart grid or a carousel, with no CTA of its own — the heading and subheading the
        // shared header already emitted are all they carry.
        case 'interactive-demo':
        case 'gallery-showcase':
        case 'chart-types':
            return [];
        default:
            return sectionBody(section, resolve, resolveFaq, siteRoot);
    }
}

/**
 * The hero, rendered as the document title. The page's auto-scrolling gallery becomes a list of the
 * examples it cycles, each linked to its gallery page where one exists (a hero example with a
 * `pageName` is a docs example and has no gallery URL).
 */
function heroBlock(
    hero: HeroSection,
    content: ChartsLandingPageContent,
    versions: BuildChartsLandingPageMarkdownOptions['versions'],
    siteRoot?: string
): string[] {
    const heading = hero.headingHtml ? htmlInlineToMarkdown(hero.headingHtml, siteRoot) : hero.heading;
    const latestVersion = versions?.find((version) => version.landingPageHighlight);

    const parts = [
        `# ${heading}`,
        hero.subHeadingHtml ? htmlInlineToMarkdown(hero.subHeadingHtml, siteRoot) : hero.subHeading,
    ];
    if (hero.showVersionBadge && latestVersion) {
        parts.push(`**Latest version:** v${latestVersion.version} — ${latestVersion.landingPageHighlight}`);
    }
    if (content.packageName) {
        parts.push(`Install: \`npm install ${content.packageName}\``);
    }
    if (hero.secondaryCta?.url) {
        parts.push(link(hero.secondaryCta.text, hero.secondaryCta.url, urlWithBaseUrl, siteRoot));
    }
    if (hero.galleryExamples?.length) {
        const examples = hero.galleryExamples.map(({ title, exampleName, pageName }) =>
            pageName
                ? `- ${title}`
                : `- [${title}](${toAbsoluteUrl(urlWithBaseUrl(`/gallery/${exampleName}/`), siteRoot)})`
        );
        parts.push(examples.join('\n'));
    }
    return parts;
}

/**
 * Build the markdown twin of an AG Charts landing page. Reads the same `landingPages` collection
 * entry `LandingPage.astro` renders and walks the same `sections` union in the same order, so the
 * two cannot drift. The interactive sections — live demos, the chart-type grid, the comparison
 * table — reduce to their heading, subheading and CTA, which is all the prose they carry.
 */
export function buildChartsLandingPageMarkdown({
    content,
    versions,
    siteRoot,
}: BuildChartsLandingPageMarkdownOptions): string {
    const framework = getFrameworkFromInternalFramework(content.internalFramework);
    // Section CTAs, feature links and card links store './'-prefixed paths that ALREADY carry the
    // framework segment, so they resolve the way the page resolves them — with the base-URL helper.
    const resolveUrl: Resolve = urlWithBaseUrl;
    // FAQ answers are Markdoc, rendered per-framework by renderFAQAnswers, so their links are
    // framework-relative and need the prefixing helper to land on the right docs page.
    const resolveFaqUrl: Resolve = (url) => urlWithPrefix({ framework, url });

    const frontmatter = [
        '---',
        `title: ${JSON.stringify(content.meta.title)}`,
        `description: ${JSON.stringify(content.meta.description)}`,
        '---',
    ].join('\n');

    const hero = content.sections.find((section) => section.type === 'hero');
    const intro = hero ? heroBlock(hero, content, versions, siteRoot) : [];

    // The hero is rendered above as the page title; every other section keeps page order.
    const body = content.sections
        .filter((section) => section.type !== 'hero')
        .flatMap((section) => [
            ...sectionHeader(section, siteRoot),
            ...chartsSectionBody(section, versions, resolveUrl, resolveFaqUrl, siteRoot),
        ]);

    return `${[frontmatter, ...intro, ...body].join('\n\n').trimEnd()}\n`;
}
