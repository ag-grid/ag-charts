import { describe, it } from 'vitest';

import { COMMUNITY_GLOW_SERIES } from '../test/glowCases';
import { HARD_GAP_GLOW, HARD_GLOW, RENDER_OPTIONS, ROOM, hoverDatum } from '../test/glowRender';
import { HIGHLIGHT_STATES, describeGlowSeries, useGlowCharts } from '../test/glowRenderSuite';
import { CATEGORY_DATA, ITEM_GLOW, ITEM_SHADOW, SERIES_SHADOW } from '../test/shadowFixtures';
import { createChart, hoverLegendItem, waitForChartStability } from '../test/utils';

const RED_GLOW = { ...HARD_GLOW, fill: '#d0021b', spread: 12 };

// The y axis runs above the tallest bar, so that a glow on the top of a bar is not cut at the top of the series area.
const HEADROOM_AXES = { ...RENDER_OPTIONS, axes: { y: { type: 'number', min: 0, max: 10 } } };

const TRIANGLE = { type: 'scatter', xKey: 'x', yKey: 'y', shape: 'triangle', size: 40 };
const TRIANGLE_DATA = [
    { x: 1, y: 2 },
    { x: 2, y: 4 },
    { x: 3, y: 6 },
];
const TRIANGLE_OPTIONS = {
    ...ROOM,
    axes: { x: { type: 'number', min: 0, max: 4 }, y: { type: 'number', min: 0, max: 8 } },
};

const COLUMNS = CATEGORY_DATA.map((datum, i) => ({ ...datum, other: [3, 6, 5][i], third: [4, 7, 6][i] }));

describe('shadow and glow render', () => {
    const charts = useGlowCharts(createChart);
    const { create, chart, snapshot } = charts;

    describeGlowSeries(COMMUNITY_GLOW_SERIES, charts);

    describe('glow gap, with a hard-edged glow', () => {
        // A pie fills the series area, so the chart sits inside the crop, and the bars have headroom.
        const HEADROOM = { ...ROOM, axes: { y: { type: 'number', min: 0, max: 12 } } };
        const SHAPES: [string, object, object[], object][] = [
            ['a square-cornered bar', { type: 'bar', xKey: 'category', yKey: 'value' }, CATEGORY_DATA, HEADROOM],
            [
                'a bar with a corner radius',
                { type: 'bar', xKey: 'category', yKey: 'value', cornerRadius: 12 },
                CATEGORY_DATA,
                HEADROOM,
            ],
            ['a triangle marker', TRIANGLE, TRIANGLE_DATA, TRIANGLE_OPTIONS],
            ['a pie sector', { type: 'pie', angleKey: 'value' }, CATEGORY_DATA, ROOM],
            ['a donut sector', { type: 'donut', angleKey: 'value' }, CATEGORY_DATA, ROOM],
        ];

        it.each(SHAPES)('renders the glow of the hovered item around %s', async (_name, series, data, options) => {
            await create([{ ...series, highlight: { highlightedItem: { glow: HARD_GAP_GLOW } } }], data, options);
            await hoverDatum(chart(), 0, 1);
            await snapshot();
        });
    });

    describe('the shadow spread of a sharp vertex', () => {
        it('renders the spread of a shadow around a triangle marker with its apex pointed', async () => {
            const shadow = { enabled: true, fill: '#d0021b', fillOpacity: 1, blur: 0, spread: 16 };
            await create([{ ...TRIANGLE, shadow }], TRIANGLE_DATA, TRIANGLE_OPTIONS);
            await snapshot();
        });
    });

    describe('a glow beside items that do not glow', () => {
        const GLOWING = { glow: RED_GLOW };
        const BAR = { type: 'bar', xKey: 'category', yKey: 'value' };
        const DONUT = { type: 'donut', angleKey: 'value' };

        it.each([
            ['a donut with one glowing sector', DONUT, RENDER_OPTIONS],
            ['bars with one glowing item', BAR, HEADROOM_AXES],
        ])('renders %s', async (_name, series, options) => {
            await create(
                [
                    {
                        ...series,
                        itemStyler: ({ datum }: { datum: { category: string } }) =>
                            datum.category === 'B' ? GLOWING : {},
                    },
                ],
                COLUMNS,
                options
            );
            await snapshot();
        });

        it('renders bars with one glowing series beside two that do not glow', async () => {
            await create(
                [
                    { type: 'bar', xKey: 'category', yKey: 'value', glow: RED_GLOW },
                    { type: 'bar', xKey: 'category', yKey: 'other' },
                    { type: 'bar', xKey: 'category', yKey: 'third' },
                ],
                COLUMNS,
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
                    glow: { ...RED_GLOW, spread: 6, gap },
                })),
                COLUMNS,
                HEADROOM_AXES
            );
            await snapshot();
        });
    });

    describe('adjacent sectors that all glow', () => {
        const FILLS: Record<string, string> = { A: '#d0021b', B: '#7ed321', C: '#4a90e2' };

        it('renders a donut with a gap, each glow ending midway between its sector and the next', async () => {
            await create(
                [
                    {
                        type: 'donut',
                        angleKey: 'value',
                        gap: 12,
                        itemStyler: ({ datum }: { datum: { category: string } }) => ({
                            glow: { ...RED_GLOW, fill: FILLS[datum.category] },
                        }),
                    },
                ],
                CATEGORY_DATA,
                ROOM
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
                COLUMNS,
                { ...RENDER_OPTIONS, highlight: { mode: 'shared' }, legend: { enabled: true, position: 'bottom' } }
            );
            if (state === 'highlightedSeries') await hoverLegendItem(chart(), 0);
            else await hoverDatum(chart(), 0, 1);
            await waitForChartStability(chart());
            await snapshot();
        });
    });

    describe('a shadow on a segmented series', () => {
        it('renders no shadow within a segment, beside the shadows of the bars outside it', async () => {
            await create(
                [
                    {
                        type: 'bar',
                        xKey: 'category',
                        yKey: 'value',
                        shadow: SERIES_SHADOW,
                        segmentation: {
                            key: 'x',
                            segments: [{ start: 'B', stop: 'B', fill: '#d0021b', strokeWidth: 0 }],
                        },
                    },
                ],
                CATEGORY_DATA,
                HEADROOM_AXES
            );
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
