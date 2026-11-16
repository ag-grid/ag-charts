import { afterEach, describe, expect, it } from 'vitest';

import {
    ROOM,
    deproxy,
    getSeriesAt,
    sectorJoinPixels,
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

const SPREAD = 10;
const GLOW_FILLS: Record<string, string> = { A: '#ff0000', B: '#008000', C: '#0000ff' };

describe('the glow ends of the sectors of a donut that animates in', () => {
    setupMockConsole();
    setupMockCanvas();
    const animate = spyOnAnimationManager();

    let chart: ReturnType<typeof deproxy>;
    afterEach(() => {
        chart?.destroy();
    });

    // The animation module is enterprise only, and a sector node is not laid out until its animation runs, so the glow ends
    // must come from the datum. The community case of the radii runs with animation off, which lays the nodes out at once.
    it('ends each glow on the line to its neighbour at every join, as the chart animates in', async () => {
        animate(1200, 1);
        chart = deproxy(
            await createEnterpriseChart({
                ...ROOM,
                animation: { enabled: true },
                data: [
                    { category: 'A', value: 4, radius: 2 },
                    { category: 'B', value: 5, radius: 8 },
                    { category: 'C', value: 3, radius: 5 },
                ],
                series: [
                    {
                        type: 'donut',
                        angleKey: 'value',
                        radiusKey: 'radius',
                        innerRadiusRatio: 0.3,
                        fills: ['#808080'],
                        fillOpacity: 1,
                        strokeWidth: 0,
                        itemStyler: ({ datum }: { datum: { category: string } }) => ({
                            glow: {
                                enabled: true,
                                fill: GLOW_FILLS[datum.category],
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
