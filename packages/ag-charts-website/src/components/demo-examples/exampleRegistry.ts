import type { DemoPageExample } from '@ag-website-shared/components/demo-page/types';

export type DemoExampleId = 'financial' | 'web-analytics' | 'real-time';

export interface DemoExample extends DemoPageExample {
    id: DemoExampleId;
    /**
     * Demo app to frame, as registered in `ag-charts-demos`. Absent while a demo is still to be
     * built, which is what makes its page show a placeholder instead.
     */
    demoAppId?: string;
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
        id: 'real-time',
        title: 'Real-Time Monitoring',
        path: './examples-real-time',
        description: 'Streaming time-series with thresholds and annotations.',
    },
];
