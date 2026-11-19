import { afterEach, describe, expect, it } from 'vitest';

import {
    ROOM,
    countChartPixels,
    deproxy,
    expectSectorGlowJoins,
    getSeriesAt,
    hoverDatum,
    setupMockCanvas,
    setupMockConsole,
    shapesOf,
    spyOnAnimationManager,
    waitForChartStability,
} from 'ag-charts-community-test';
import { Sector } from 'ag-charts-core';

import { createEnterpriseChart } from '../test/utils';

const RED = [255, 0, 0, 255];
const GREEN = [0, 128, 0, 255];
const BLUE = [0, 0, 255, 255];
const GREY = [128, 128, 128, 255];

const GLOW_FILLS: Record<string, string> = { A: '#ff0000', B: '#008000', C: '#0000ff' };
const hardGlow = (key: string, spread: number) => ({
    enabled: true,
    fill: GLOW_FILLS[key],
    fillOpacity: 1,
    blur: 0,
    spread,
});

// A donut's radii come from the datum while it animates in, as the sector nodes are not laid out until their animation
// runs. The nightingale's second sector crosses 3 o'clock, so its angles are normalised to run from 330 degrees to 90.
const RINGS = [
    {
        name: 'donut',
        spread: 10,
        crossing: 0,
        data: [
            { key: 'A', value: 4, radius: 2 },
            { key: 'B', value: 5, radius: 8 },
            { key: 'C', value: 3, radius: 5 },
        ],
        series: { type: 'donut', angleKey: 'value', radiusKey: 'radius', innerRadiusRatio: 0.3, fills: ['#808080'] },
    },
    {
        name: 'nightingale',
        spread: 6,
        crossing: 1,
        data: [
            { key: 'A', value: 4 },
            { key: 'B', value: 9 },
            { key: 'C', value: 6.5 },
        ],
        series: { type: 'nightingale', angleKey: 'key', radiusKey: 'value', fill: '#808080' },
    },
];

describe('the glow ends of the sectors of a ring that animates in', () => {
    setupMockConsole();
    setupMockCanvas();
    const animate = spyOnAnimationManager();

    let chart: ReturnType<typeof deproxy>;
    afterEach(() => {
        chart?.destroy();
    });

    it.each(RINGS)(
        'ends each glow of a $name on the line to its neighbour',
        async ({ spread, crossing, data, series }) => {
            animate(1200, 1);
            chart = deproxy(
                await createEnterpriseChart({
                    ...ROOM,
                    animation: { enabled: true },
                    data,
                    series: [
                        {
                            ...series,
                            fillOpacity: 1,
                            strokeWidth: 0,
                            itemStyler: ({ datum }: { datum: { key: string } }) => ({
                                glow: hardGlow(datum.key, spread),
                            }),
                        },
                    ],
                } as any)
            );
            await waitForChartStability(chart);

            const sectors = shapesOf(getSeriesAt(chart).contentGroup, Sector);
            expect(sectors.filter((sector) => sector.endAngle < sector.startAngle)).toHaveLength(crossing);

            expect(sectors).toHaveLength(3);
            expectSectorGlowJoins(chart, sectors, spread, [RED, GREEN, BLUE], GREY);
        }
    );
});

describe('the hovered sector of a nightingale with a glow', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: ReturnType<typeof deproxy>;
    afterEach(() => {
        chart?.destroy();
    });

    const hoveredPixels = async (glow: object | undefined) => {
        chart = deproxy(
            await createEnterpriseChart({
                ...ROOM,
                data: [
                    { quarter: 'Q1', value: 6 },
                    { quarter: 'Q2', value: 6 },
                    { quarter: 'Q3', value: 6 },
                ],
                series: [
                    {
                        type: 'nightingale',
                        angleKey: 'quarter',
                        radiusKey: 'value',
                        fill: '#808080',
                        fillOpacity: 1,
                        strokeWidth: 0,
                        glow,
                        highlight: {
                            highlightedItem: { fill: '#0000ff', fillOpacity: 1, strokeWidth: 0 },
                            unhighlightedItem: { opacity: 1 },
                        },
                    },
                ],
            } as any)
        );
        await hoverDatum(chart, 0, 1);
        const count = countChartPixels(chart, BLUE);
        chart.destroy();
        return count;
    };

    it('is not covered by the glows of the sectors beside it', async () => {
        const bare = await hoveredPixels(undefined);

        expect(bare).toBeGreaterThan(0);
        expect(await hoveredPixels({ ...hardGlow('B', 20), fill: '#00ff00' })).toBe(bare);
    });
});
