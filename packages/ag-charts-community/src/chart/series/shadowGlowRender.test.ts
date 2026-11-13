import { describe, it } from 'vitest';

import { COMMUNITY_GLOW_SERIES } from '../test/glowCases';
import { ALI_GLOW, RENDER_OPTIONS, hoverDatum } from '../test/glowRender';
import { HIGHLIGHT_STATES, describeGlowSeries, useGlowCharts } from '../test/glowRenderSuite';
import { CATEGORY_DATA, ITEM_GLOW, ITEM_SHADOW } from '../test/shadowFixtures';
import { createChart, hoverLegendItem, waitForChartStability } from '../test/utils';

// Opaque and unblurred, so that the shape of a glow can be read off the render.
const HARD_GLOW = { enabled: true, fill: '#d0021b', fillOpacity: 1, blur: 0, spread: 12 };

// The y axis runs above the tallest bar, so that a glow on the top of a bar is not cut at the top of the series area.
const HEADROOM_AXES = { ...RENDER_OPTIONS, axes: { y: { type: 'number', min: 0, max: 10 } } };

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
        // The glow reaches 40px beyond an item, and a pie fills the series area, so the chart sits 60px inside the crop, on
        // every side, and the bars have headroom.
        const ROOM = { ...RENDER_OPTIONS, padding: { top: 60, left: 60, right: 440, bottom: 350 } };
        const HEADROOM = { ...ROOM, axes: { y: { type: 'number', min: 0, max: 8 } } };
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
                {
                    ...ROOM,
                    axes: { x: { type: 'number', min: 0, max: 4 }, y: { type: 'number', min: 0, max: 8 } },
                },
            ],
            ['a pie sector', { type: 'pie', angleKey: 'value' }, GAP_DATA, ROOM],
            ['a donut sector', { type: 'donut', angleKey: 'value' }, GAP_DATA, ROOM],
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

    describe('the shadow spread of a sharp vertex', () => {
        // A shadow bevels the vertices under 60°, where a glow bevels those under about 57°, so the apex of a triangle marker
        // (59.8°) is bevelled by the shadow. Its baseline is that of the code before the glow's limit was set.
        it('renders the spread of a shadow around a triangle marker with its apex bevelled', async () => {
            await create(
                [
                    {
                        type: 'scatter',
                        xKey: 'x',
                        yKey: 'y',
                        shape: 'triangle',
                        size: 40,
                        shadow: { enabled: true, fill: '#d0021b', fillOpacity: 1, blur: 0, spread: 16 },
                    },
                ],
                [
                    { x: 1, y: 2 },
                    { x: 2, y: 4 },
                    { x: 3, y: 6 },
                ],
                {
                    ...RENDER_OPTIONS,
                    padding: { top: 60, left: 60, right: 440, bottom: 350 },
                    axes: { x: { type: 'number', min: 0, max: 4 }, y: { type: 'number', min: 0, max: 8 } },
                }
            );
            await snapshot();
        });
    });

    describe('a glow beside items that do not glow', () => {
        const GLOWING = { glow: HARD_GLOW };

        it.each([
            ['a donut with one glowing sector', 'donut'],
            ['bars with one glowing item', 'bar'],
        ])('renders %s', async (_name, type) => {
            await create(
                [
                    {
                        type,
                        ...(type === 'bar' ? { xKey: 'category', yKey: 'value' } : { angleKey: 'value' }),
                        itemStyler: ({ datum }: { datum: { category: string } }) =>
                            datum.category === 'B' ? GLOWING : {},
                    },
                ],
                BARS,
                type === 'bar' ? HEADROOM_AXES : RENDER_OPTIONS
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
                BARS,
                HEADROOM_AXES
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
                BARS,
                HEADROOM_AXES
            );
            await snapshot();
        });
    });

    describe('each highlight state', () => {
        const FILLS = ['#d0021b', '#7ed321', '#f5a623', '#4a90e2'];
        const GLOWS = Object.fromEntries(
            HIGHLIGHT_STATES.map(({ bucket }, i) => [
                bucket,
                { enabled: true, fill: FILLS[i], fillOpacity: 1, blur: 0, spread: 8 },
            ])
        );

        it.each(Object.keys(GLOWS))('renders the glow of %s', async (state) => {
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
