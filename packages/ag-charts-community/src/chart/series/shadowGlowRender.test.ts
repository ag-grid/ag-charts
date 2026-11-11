import { describe, it } from 'vitest';

import { COMMUNITY_GLOW_SERIES } from '../test/glowCases';
import { ALI_GLOW, RENDER_OPTIONS, hoverDatum } from '../test/glowRender';
import { describeGlowSeries, useGlowCharts } from '../test/glowRenderSuite';
import { CATEGORY_DATA, ITEM_GLOW, ITEM_SHADOW } from '../test/shadowFixtures';
import { createChart, hoverLegendItem, waitForChartStability } from '../test/utils';

// Opaque and unblurred, so that the shape of a glow can be read off the render.
const HARD_GLOW = { enabled: true, fill: '#d0021b', fillOpacity: 1, blur: 0, spread: 12 };

const BARS = [
    { category: 'A', value: 5, other: 3, third: 4 },
    { category: 'B', value: 8, other: 6, third: 7 },
    { category: 'C', value: 3, other: 5, third: 6 },
];

describe('shadow and glow render', () => {
    const charts = useGlowCharts(createChart);
    const { create, chart, snapshot } = charts;

    describeGlowSeries(COMMUNITY_GLOW_SERIES, charts);

    describe('glow gap, with the glow of the design feedback', () => {
        const GAP_DATA = [
            { category: 'A', value: 4 },
            { category: 'B', value: 5 },
            { category: 'C', value: 3 },
        ];
        // Headroom above the bars, for the glow to be drawn in.
        const HEADROOM = {
            ...RENDER_OPTIONS,
            axes: { y: { type: 'number', min: 0, max: 8 } },
        };
        const SHAPES: [string, object, object[], object?][] = [
            ['a square-cornered bar', { type: 'bar', xKey: 'category', yKey: 'value' }, GAP_DATA, HEADROOM],
            [
                'a bar with a corner radius',
                { type: 'bar', xKey: 'category', yKey: 'value', cornerRadius: 12 },
                GAP_DATA,
                HEADROOM,
            ],
            [
                'a triangle marker',
                { type: 'scatter', xKey: 'x', yKey: 'y', shape: 'triangle', size: 40 },
                [
                    { x: 1, y: 2 },
                    { x: 2, y: 4 },
                    { x: 3, y: 6 },
                ],
            ],
            ['a pie sector', { type: 'pie', angleKey: 'value' }, GAP_DATA],
            ['a donut sector', { type: 'donut', angleKey: 'value' }, GAP_DATA],
        ];

        it.each(SHAPES)('renders the glow of the hovered item around %s', async (_name, series, data, options) => {
            await create([{ ...series, highlight: { highlightedItem: { glow: ALI_GLOW } } }], data, options);
            await hoverDatum(chart(), 0, 1);
            await snapshot();
        });

        it.each(SHAPES)('renders the series glow around %s', async (_name, series, data, options) => {
            await create([{ ...series, glow: ALI_GLOW }], data, options);
            await snapshot();
        });
    });

    describe('a glow beside items that do not glow', () => {
        const GLOWING = { glow: HARD_GLOW };

        it('renders a donut with one glowing sector', async () => {
            await create(
                [
                    {
                        type: 'donut',
                        angleKey: 'value',
                        itemStyler: ({ datum }: { datum: { category: string } }) =>
                            datum.category === 'B' ? GLOWING : {},
                    },
                ],
                BARS
            );
            await snapshot();
        });

        it('renders bars with one glowing item', async () => {
            await create(
                [
                    {
                        type: 'bar',
                        xKey: 'category',
                        yKey: 'value',
                        itemStyler: ({ datum }: { datum: { category: string } }) =>
                            datum.category === 'B' ? GLOWING : {},
                    },
                ],
                BARS
            );
            await snapshot();
        });

        it('renders bars with one glowing series beside two that do not glow', async () => {
            await create(
                [
                    { type: 'bar', xKey: 'category', yKey: 'value', glow: HARD_GLOW },
                    { type: 'bar', xKey: 'category', yKey: 'other' },
                    { type: 'bar', xKey: 'category', yKey: 'third' },
                ],
                BARS
            );
            await snapshot();
        });
    });

    describe('adjacent items that all glow', () => {
        it.each([
            ['no gap', undefined],
            ['a gap of 4', 4],
        ])('renders grouped bar series that each glow, with %s', async (_name, gap) => {
            await create(
                ['value', 'other', 'third'].map((yKey) => ({
                    type: 'bar',
                    xKey: 'category',
                    yKey,
                    glow: { ...HARD_GLOW, spread: 6, gap },
                })),
                BARS
            );
            await snapshot();
        });
    });

    describe('each highlight state', () => {
        const GLOWS = {
            highlightedItem: { enabled: true, fill: '#d0021b', fillOpacity: 1, blur: 0, spread: 8 },
            unhighlightedItem: { enabled: true, fill: '#7ed321', fillOpacity: 1, blur: 0, spread: 8 },
            highlightedSeries: { enabled: true, fill: '#f5a623', fillOpacity: 1, blur: 0, spread: 8 },
            unhighlightedSeries: { enabled: true, fill: '#4a90e2', fillOpacity: 1, blur: 0, spread: 8 },
        };

        it.each(Object.keys(GLOWS) as (keyof typeof GLOWS)[])('renders the glow of %s', async (state) => {
            await create(
                ['value', 'other'].map((yKey) => ({
                    type: 'bar',
                    xKey: 'category',
                    yKey,
                    highlight: { [state]: { glow: GLOWS[state] } },
                })),
                BARS,
                { ...RENDER_OPTIONS, legend: { enabled: true, position: 'bottom' } }
            );
            if (state === 'highlightedSeries') await hoverLegendItem(chart(), 0);
            else await hoverDatum(chart(), 0, 1);
            await waitForChartStability(chart());
            await snapshot();
        });
    });

    describe('shadow and glow from an itemStyler', () => {
        it('renders the shadow and glow it returns for one item', async () => {
            await create(
                [
                    {
                        type: 'bar',
                        xKey: 'category',
                        yKey: 'value',
                        itemStyler: ({ datum }: { datum: { category: string } }) =>
                            datum.category === 'B' ? { shadow: ITEM_SHADOW, glow: ITEM_GLOW } : {},
                    },
                ],
                CATEGORY_DATA.map(({ category, value }) => ({ category, value }))
            );
            await snapshot();
        });
    });
});
