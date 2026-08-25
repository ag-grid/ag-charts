import type { DemoPageExample } from '@ag-website-shared/components/demo-page/types';

export type DemoExampleId = 'financial' | 'web-analytics' | 'procurement' | 'real-time';

export interface DemoExample extends DemoPageExample {
    id: DemoExampleId;
    /** Demo app to frame, as registered in `ag-charts-demos`. */
    demoAppId: string;
}

/** Listed in feature-list order; paths stay flat so the site needs no redirects. */
export const DEMO_EXAMPLES: DemoExample[] = [
    {
        id: 'financial',
        title: 'Financial Dashboard',
        path: './examples',
        description: 'Candlestick and volume series driven by a live price feed.',
        demoAppId: 'financial',
    },
    {
        id: 'web-analytics',
        title: 'Web Analytics',
        path: './examples-web-analytics',
        description: 'Traffic, funnel and retention charts over a shared date range.',
        demoAppId: 'web-analytics',
    },
    {
        id: 'procurement',
        title: 'Procurement Manager',
        path: './examples-procurement',
        description: 'Spend, supplier and delivery charts for a procurement manager workspace.',
        demoAppId: 'procurement',
    },
    // Uncomment once the real-time demo app exists, restoring `src/pages/examples-real-time.astro`
    // and its `.md.ts` twin alongside it. Its copy is still in DEMO_PAGE_CONTENT.
    // {
    //     id: 'real-time',
    //     title: 'Real-Time Monitoring',
    //     path: './examples-real-time',
    //     description: 'Streaming time-series with thresholds and annotations.',
    //     demoAppId: 'real-time',
    // },
];

/** Throws rather than quietly rendering a page for a demo the feature list does not offer. */
export function getDemoExample(id: DemoExampleId): DemoExample {
    const example = DEMO_EXAMPLES.find((candidate) => candidate.id === id);
    if (!example) {
        throw new Error(`No demo registered for id "${id}"`);
    }
    return example;
}
