import { htmlInlineToMarkdown } from '@ag-website-shared/markdoc/htmlInlineToMarkdown';
import { toAbsoluteUrl } from '@ag-website-shared/markdoc/toAbsoluteUrl';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';

import faqData from '../../content/faqs/homepage.json';
import homepage from '../../content/homepage/homepage.json';
import versionsData from '../../content/versions/ag-charts-versions.json';
import { latestReleasesMarkdown } from './latestReleasesMarkdown';

const NUM_LATEST_RELEASES = 3;

interface HomepageCta {
    title: string;
    url: string;
}
interface HomepageHero {
    heading: string;
    subHeading: string;
    cta: HomepageCta;
}
// Sections carrying a "read more" CTA share this shape; `subHeading` is absent on the
// gallery section, which only has a CTA.
interface CtaSection {
    tag: string;
    heading: string;
    subHeading?: string;
    ctaTitle: string;
    ctaUrl: string;
    ctaId: string;
}
interface MapCard {
    heading: string;
    description: string;
}
interface HomepageSections {
    gallery: Omit<CtaSection, 'subHeading'>;
    financial: CtaSection;
    maps: CtaSection & { cards: MapCard[] };
    integrated: { tag: string; heading: string; subHeadingHtml: string };
    releases: CtaSection;
    faqs: { tag: string; heading: string; subHeading: string };
}
interface HomepageContent {
    hero: HomepageHero;
    sections: HomepageSections;
}
interface FaqItem {
    question: string;
    answer: string;
}
function ctaLink(title: string, url: string, siteRoot?: string): string {
    return `[${title}](${toAbsoluteUrl(urlWithBaseUrl(url), siteRoot)})`;
}

function ctaSectionBlock(
    section: { heading: string; subHeading?: string; ctaTitle?: string; ctaUrl?: string },
    siteRoot?: string
): string {
    const parts = [`## ${section.heading}`];
    if (section.subHeading) {
        parts.push(section.subHeading);
    }
    if (section.ctaTitle && section.ctaUrl) {
        parts.push(ctaLink(section.ctaTitle, section.ctaUrl, siteRoot));
    }
    return parts.join('\n\n');
}

function mapsBlock(section: HomepageSections['maps'], siteRoot?: string): string {
    const parts = [ctaSectionBlock(section, siteRoot)];
    for (const card of section.cards) {
        parts.push(`### ${card.heading}`, card.description);
    }
    return parts.join('\n\n');
}

function integratedBlock(section: HomepageSections['integrated'], siteRoot?: string): string {
    return [`## ${section.heading}`, htmlInlineToMarkdown(section.subHeadingHtml, siteRoot)].join('\n\n');
}

function releasesBlock(section: HomepageSections['releases'], siteRoot?: string): string {
    const releases = latestReleasesMarkdown({ versionsData, count: NUM_LATEST_RELEASES });
    return [ctaSectionBlock(section, siteRoot), releases].join('\n\n');
}

function faqsBlock(section: HomepageSections['faqs']): string {
    const faqs = (faqData as FaqItem[]).map((item) => `### ${item.question}\n\n${item.answer}`).join('\n\n');
    return [`## ${section.heading}`, section.subHeading, faqs].join('\n\n');
}

/**
 * Build the markdown twin of the homepage (/). Reads the shared homepage content (hero +
 * section copy), the homepage FAQ, and the versions data the page renders, so it stays in
 * step with the page. The bespoke interactive demos on the page are represented here by
 * their section copy.
 */
export function buildHomepageMarkdown({ siteRoot }: { siteRoot?: string } = {}): string {
    const { hero, sections } = homepage as HomepageContent;

    const frontmatter = [
        '---',
        'title: "JavaScript Charts | AG Charts"',
        'description: "Create beautiful, high-performance JavaScript Charts quickly with AG Charts. Free forever; upgrade to enterprise for advanced features and dedicated support."',
        '---',
    ].join('\n');

    const document = [
        frontmatter,
        `# ${hero.heading}`,
        hero.subHeading,
        ctaLink(hero.cta.title, hero.cta.url, siteRoot),
        ctaSectionBlock(sections.gallery, siteRoot),
        ctaSectionBlock(sections.financial, siteRoot),
        mapsBlock(sections.maps, siteRoot),
        integratedBlock(sections.integrated, siteRoot),
        releasesBlock(sections.releases, siteRoot),
        faqsBlock(sections.faqs),
    ].join('\n\n');

    return `${document.trimEnd()}\n`;
}
