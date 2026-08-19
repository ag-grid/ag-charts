import type { DemoPageExample } from '@ag-website-shared/components/demo-page/types';

export type DemoExampleId = 'financial' | 'web-analytics' | 'real-time';

export interface DemoExample extends DemoPageExample {
    id: DemoExampleId;
}

/**
 * Placeholder entries standing in for the showcase demos, which are not built yet. The ids match
 * demo apps already registered in `ag-charts-demos`, so wiring a page to its real demo means
 * filling the stage rather than renaming anything.
 *
 * Listed in feature-list order; paths stay flat so the site needs no redirects.
 */
export const DEMO_EXAMPLES: DemoExample[] = [
    {
        id: 'financial',
        title: 'Financial Dashboard',
        path: './examples',
        description: 'Candlestick and volume series driven by a live price feed.',
    },
    {
        id: 'web-analytics',
        title: 'Web Analytics',
        path: './examples-web-analytics',
        description: 'Traffic, funnel and retention charts over a shared date range.',
    },
    {
        id: 'real-time',
        title: 'Real-Time Monitoring',
        path: './examples-real-time',
        description: 'Streaming time-series with thresholds and annotations.',
    },
];
