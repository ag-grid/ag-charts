import type { AgCartesianChartOptions } from 'ag-charts-community';
import { type HighlightFadeCase, describeHighlightFade, rectCentre, sectorCentre } from 'ag-charts-community-test';

import { createEnterpriseChart } from '../test/utils';

const CASES: HighlightFadeCase[] = [
    {
        name: 'histogram',
        options: {
            data: [1, 2, 2, 3, 3, 3, 4, 4, 5].map((value) => ({ value })),
            series: [
                {
                    type: 'histogram',
                    xKey: 'value',
                    bins: [
                        [0, 2],
                        [2, 4],
                        [4, 6],
                    ],
                },
            ],
        } as AgCartesianChartOptions,
        itemCentre: rectCentre,
    },
    {
        // More source rows than can animate, so the bars match their data by position.
        name: 'histogram with large data',
        options: {
            data: Array.from({ length: 1500 }, (_, index) => ({ value: (index % 3) * 2 + 1 })),
            series: [
                {
                    type: 'histogram',
                    xKey: 'value',
                    bins: [
                        [0, 2],
                        [2, 4],
                        [4, 6],
                    ],
                },
            ],
        } as AgCartesianChartOptions,
        itemCentre: rectCentre,
    },
    {
        name: 'waterfall',
        options: {
            data: [
                { stage: 'A', value: 5 },
                { stage: 'B', value: 4 },
                { stage: 'C', value: 6 },
            ],
            series: [{ type: 'waterfall', xKey: 'stage', yKey: 'value' }],
        },
        itemCentre: rectCentre,
    },
    {
        name: 'range-bar',
        options: {
            data: [
                { month: 'Jan', low: 2, high: 6 },
                { month: 'Feb', low: 3, high: 8 },
                { month: 'Mar', low: 1, high: 7 },
            ],
            series: [{ type: 'range-bar', xKey: 'month', yLowKey: 'low', yHighKey: 'high' }],
        },
        itemCentre: rectCentre,
    },
    {
        name: 'funnel',
        options: {
            data: [
                { stage: 'Visited', value: 10 },
                { stage: 'Added', value: 6 },
                { stage: 'Bought', value: 3 },
            ],
            series: [{ type: 'funnel', stageKey: 'stage', valueKey: 'value', label: { enabled: false } }],
        },
        itemCentre: rectCentre,
    },
    {
        name: 'radial-bar',
        options: {
            data: [
                { quarter: 'Q1', apples: 5, oranges: 3 },
                { quarter: 'Q2', apples: 7, oranges: 4 },
                { quarter: 'Q3', apples: 6, oranges: 5 },
            ],
            series: (['apples', 'oranges'] as const).map((angleKey) => ({
                type: 'radial-bar' as const,
                radiusKey: 'quarter',
                angleKey,
            })),
        },
        itemCentre: sectorCentre,
    },
];

describeHighlightFade(CASES, createEnterpriseChart);
