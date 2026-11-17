import { afterEach, describe, expect, it } from 'vitest';

import {
    ROOM,
    countChartPixels,
    deproxy,
    getSeriesAt,
    hoverDatum,
    sectorJoinPixels,
    setupMockCanvas,
    setupMockConsole,
    shapesOf,
    waitForChartStability,
} from 'ag-charts-community-test';
import { Sector } from 'ag-charts-core';

import { createEnterpriseChart } from '../test/utils';

const RED = [255, 0, 0, 255];
const GREEN = [0, 128, 0, 255];
const BLUE = [0, 0, 255, 255];
const GREY = [128, 128, 128, 255];

const SPREAD = 6;
const GLOW_FILLS: Record<string, string> = { Q1: '#ff0000', Q2: '#008000', Q3: '#0000ff' };

describe('the glow ends of the sectors of a nightingale', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: ReturnType<typeof deproxy>;
    afterEach(() => {
        chart?.destroy();
    });

    // The three sectors are laid out from 210 degrees round the circle, so the second crosses 0 radians (3 o'clock), and
    // its angles are normalised to run from 330 degrees down to 90.
    it('ends each glow on the line to its neighbour at every join, including the sector that crosses 3 o clock', async () => {
        chart = deproxy(
            await createEnterpriseChart({
                ...ROOM,
                data: [
                    { quarter: 'Q1', value: 4 },
                    { quarter: 'Q2', value: 9 },
                    { quarter: 'Q3', value: 6.5 },
                ],
                series: [
                    {
                        type: 'nightingale',
                        angleKey: 'quarter',
                        radiusKey: 'value',
                        fill: '#808080',
                        fillOpacity: 1,
                        strokeWidth: 0,
                        itemStyler: ({ datum }: { datum: { quarter: string } }) => ({
                            glow: {
                                enabled: true,
                                fill: GLOW_FILLS[datum.quarter],
                                fillOpacity: 1,
                                blur: 0,
                                spread: SPREAD,
                            },
                        }),
                    },
                ],
            } as any)
        );
        await waitForChartStability(chart);

        const sectors = shapesOf(getSeriesAt(chart).contentGroup, Sector);
        const crossing = sectors.filter((sector) => sector.endAngle < sector.startAngle);
        expect(crossing).toHaveLength(1);
        expect(sectors).toHaveLength(3);

        const joins = sectorJoinPixels(chart, sectors, SPREAD);
        const glows = [RED, GREEN, BLUE];

        expect(joins).toHaveLength(3);
        for (const { shorter, taller, band, wrap, body } of joins) {
            expect(band).toEqual(glows[shorter]);
            expect(wrap).toEqual(glows[taller]);
            expect(body).toEqual(GREY);
        }
    });
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
        expect(await hoveredPixels({ enabled: true, fill: '#00ff00', fillOpacity: 1, blur: 0, spread: 20 })).toBe(bare);
    });
});
