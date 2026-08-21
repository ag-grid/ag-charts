import type { Framework } from '@ag-grid-types';
import { DEV_LICENSE_DATA } from '@ag-website-shared/components/license-pricing/licenseData';
import { YOUTUBE_LICENSE_PRICING_URL, ZENDESK_URL } from '@ag-website-shared/constants';
import chartsFeaturesData from '@ag-website-shared/content/license-features/chartsFeaturesMatrix.json';
import { markdownTable } from '@ag-website-shared/markdoc/markdownTable';
import { toAbsoluteUrl } from '@ag-website-shared/markdoc/toAbsoluteUrl';
import { resolveSharedUrl } from '@ag-website-shared/utils/resolveSharedUrl';
import { urlWithPrefix } from '@utils/urlWithPrefix';

// The page is framework-agnostic, so its doc links resolve against one arbitrary framework.
const FRAMEWORK: Framework = 'javascript';

// The charts feature matrix is a flat list of sections; it has no nested sub-groups.
type FeatureValue = boolean | { value: boolean; detail?: string };
interface FeatureLeaf {
    label: { name: string; link: string; icon?: string };
    community: FeatureValue;
    enterprise: FeatureValue;
    chartsGrid: FeatureValue;
}
interface FeatureSection {
    group: { name: string };
    items: FeatureLeaf[];
}

// The `chartsGrid` column is the Enterprise Bundle (AG Grid Enterprise & AG Charts
// Enterprise), matching the "together" plan and the page's third licence card.
const FEATURE_HEADERS = ['Feature', 'Community', 'Enterprise', 'Bundle'];

/** Flatten HTML fragments (used in plan descriptions / feature details) to plain text. */
function htmlToText(html: string): string {
    return html
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function featureCell(value: FeatureValue): string {
    const included = typeof value === 'object' ? value.value : value;
    const detail = typeof value === 'object' ? value.detail : undefined;
    const mark = included ? '✓' : '✗';
    return detail ? `${mark} (${htmlToText(detail)})` : mark;
}

function featureRow(leaf: FeatureLeaf, siteRoot?: string): string[] {
    // resolveSharedUrl only yields an absolute URL in a real build, so fill in the origin after.
    const href = toAbsoluteUrl(resolveSharedUrl({ url: leaf.label.link, framework: FRAMEWORK }), siteRoot);
    return [
        `[${leaf.label.name.trim()}](${href})`,
        featureCell(leaf.community),
        featureCell(leaf.enterprise),
        featureCell(leaf.chartsGrid),
    ];
}

function renderFeatureMatrix(sections: FeatureSection[], siteRoot?: string): string {
    const parts = ['## Feature Comparison'];
    for (const section of sections) {
        parts.push(`### ${section.group.name}`);
        parts.push(
            markdownTable(
                FEATURE_HEADERS,
                section.items.map((item) => featureRow(item, siteRoot))
            )
        );
    }
    return parts.join('\n\n');
}

function renderPlans(siteRoot?: string): string {
    // Matches LicensePricing's defaultSelection: the charts plans plus the Enterprise Bundle.
    const chartsPlans = DEV_LICENSE_DATA.filter((plan) => plan.tabGroup === 'charts' || plan.tabGroup === 'both');
    const rows = chartsPlans.map((plan) => {
        const suffix = plan.description ? ` (${htmlToText(plan.description)})` : '';
        const price = plan.priceFullDollars === '0' ? 'Free' : `$${plan.priceFullDollars} USD per developer`;
        const cta = plan.id === 'community' ? 'Get started' : 'Buy now';
        const buyLink = toAbsoluteUrl(plan.buyLink, siteRoot);
        return [`${plan.subHeading}${suffix}`, price, `[${cta}](${buyLink})`];
    });
    return `## Plans\n\n${markdownTable(['Plan', 'Price', 'Buy'], rows)}`;
}

function renderTrial(siteRoot?: string): string {
    const trialUrl = toAbsoluteUrl(
        urlWithPrefix({
            framework: FRAMEWORK,
            url: './community-vs-enterprise/#request-a-30-day-enterprise-bundle-trial-licence',
        }),
        siteRoot
    );
    const licenceInstallUrl = toAbsoluteUrl(
        urlWithPrefix({ framework: FRAMEWORK, url: './license-install/' }),
        siteRoot
    );
    return [
        '## 30-Day Enterprise Bundle Trial',
        'Explore the full enterprise capabilities of AG Grid and AG Charts with a free 30-day trial licence — no restrictions, no watermarks.',
        [
            '- **Full enterprise features** — access all advanced grid and charts features without console warnings or watermarks.',
            '- **30 days of access** — enough time to evaluate integration, performance, and fit.',
            `- **Engineering support** — direct assistance from our developers via [Zendesk](${ZENDESK_URL}) throughout your trial.`,
        ].join('\n'),
        `[Get a trial licence](${trialUrl})`,
        `Already have a licence? See [Installing Your Licence Key](${licenceInstallUrl}).`,
        `Not sure which licence you need? [Watch our short explainer video](${YOUTUBE_LICENSE_PRICING_URL}).`,
    ].join('\n\n');
}

/**
 * Build the markdown twin of the /license-pricing/ page: AG Charts plans & prices, the
 * Charts feature-comparison matrix, and the trial / licence-install links. The page is
 * React-driven with no Markdoc source, so this reads the same data the page renders
 * (DEV_LICENSE_DATA + chartsFeaturesMatrix.json) and serialises it directly.
 */
export function buildLicensePricingMarkdown({ siteRoot }: { siteRoot?: string } = {}): string {
    const frontmatter = [
        '---',
        'title: "AG Charts: Licence & Pricing"',
        'description: "AG Charts licence plans, prices, and a full Community vs Enterprise vs Bundle feature comparison."',
        '---',
    ].join('\n');

    const document = [
        frontmatter,
        '# AG Charts: Licence & Pricing',
        'Licence plans and prices for AG Charts, with a full feature comparison across Community, Enterprise, and the Enterprise Bundle. Prices are per developer.',
        renderPlans(siteRoot),
        renderFeatureMatrix(chartsFeaturesData, siteRoot),
        renderTrial(siteRoot),
    ].join('\n\n');

    return `${document.trimEnd()}\n`;
}
