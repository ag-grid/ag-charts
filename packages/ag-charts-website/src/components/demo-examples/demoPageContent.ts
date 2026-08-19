import type { DemoPageHero } from '@ag-website-shared/components/demo-page/types';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';

import type { DemoExampleId } from './exampleRegistry';

/**
 * Hero copy every showcase page shows, and the two CTAs beneath it. Provisional wording, pending
 * the real showcase demos and a marketing pass.
 *
 * `DemoPage.astro` passes these to the shared demo page and the markdown twins render the same
 * values, so a page and its twin cannot drift.
 */
export const DEMO_PAGE_HERO = {
    eyebrow: 'AG Charts Showcase',
    title: 'Charts that scale with your data',
    description:
        'See AG Charts running in full applications - streaming feeds, large datasets and interactive dashboards, built with the same API you would use in your own product.',
    primaryCta: {
        label: 'Get Started For Free',
        href: urlWithBaseUrl('/react/quick-start/'),
    },
    secondaryCta: {
        label: 'View Pricing',
        href: urlWithBaseUrl('/license-pricing/'),
    },
} satisfies DemoPageHero;

/**
 * Per-page metadata for the showcase pages, shared with their markdown twins so the frontmatter
 * matches the page's own `<title>` and meta description.
 */
export const DEMO_PAGE_CONTENT = {
    financial: {
        metaTitle: 'Financial Dashboard Demo | AG Charts',
        metaDescription: 'AG Charts: candlestick and volume series driven by a live price feed.',
    },
    'web-analytics': {
        metaTitle: 'Web Analytics Demo | AG Charts',
        metaDescription: 'AG Charts: traffic, funnel and retention charts over a shared date range.',
    },
    'real-time': {
        metaTitle: 'Real-Time Monitoring Demo | AG Charts',
        metaDescription: 'AG Charts: streaming time-series with thresholds and annotations.',
    },
} as const satisfies Record<DemoExampleId, { metaTitle: string; metaDescription: string }>;
