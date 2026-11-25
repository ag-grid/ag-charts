import { afterEach, describe, expect, it } from 'vitest';

import type { AgCartesianChartOptions, AgChartOptions } from 'ag-charts-community';
import {
    RENDER_OPTIONS,
    canvasImage,
    deproxy,
    expectSamePixels,
    hoverDatum,
    hoverNode,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import { Transformable } from 'ag-charts-core';

import { getFlowLinkData } from '../test/enterpriseSeriesAccessors';
import { collectShapes, createEnterpriseChart } from '../test/utils';
import { ukData } from './map-test/ukData';
import ukTopology from './map-test/ukTopology.json';

// A glow with a spread of 10 and no blur, so that a pixel is in it or out of it. The `gap` is the option under test.
const glow = (gap?: number) => ({ enabled: true, fill: 'red', fillOpacity: 1, blur: 0, spread: 10, gap });

const UNHIGHLIGHTED = { opacity: 1 };

/** The options of a chart with the glow, a highlight `drawingMode` and the first item of one series to hover. */
type Case = readonly [name: string, options: (highlightedItem: object, drawingMode: string) => AgChartOptions];

const CASES: Case[] = [
    [
        'a sankey link',
        (highlightedItem, drawingMode) => ({
            ...RENDER_OPTIONS,
            data: [{ from: 'A', to: 'B', size: 10 }],
            highlight: { drawingMode },
            series: [
                {
                    type: 'sankey',
                    fromKey: 'from',
                    toKey: 'to',
                    sizeKey: 'size',
                    highlight: { highlightedItem, unhighlightedItem: UNHIGHLIGHTED },
                },
            ],
        }),
    ],
    [
        'a map shape at a fill opacity of 0.4',
        (highlightedItem, drawingMode) => ({
            ...RENDER_OPTIONS,
            data: ukData.slice(0, 1),
            topology: ukTopology,
            highlight: { drawingMode },
            series: [
                {
                    type: 'map-shape',
                    idKey: 'name',
                    fill: 'blue',
                    fillOpacity: 0.4,
                    highlight: { highlightedItem: { ...highlightedItem, fillOpacity: 0.4 } },
                },
            ],
        }),
    ],
] as Case[];

describe('the hovered glow of a see-through item of an enterprise series, with no gap', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Awaited<ReturnType<typeof createEnterpriseChart>> | undefined;
    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const render = async (options: AgChartOptions) => {
        chart = await createEnterpriseChart(options);
        await waitForChartStability(chart);
        if (deproxy(chart).series[0].type === 'sankey') await hoverNode(chart, getFlowLinkData(chart)[0]);
        else await hoverDatum(chart);
        const { data: bytes } = canvasImage(chart);
        chart.destroy();
        chart = undefined;
        return bytes;
    };

    /** The share of the pixels the item covers, as drawn with no glow, that a glow changes by more than the antialiasing of an edge. */
    const changedShare = (withGlow: Uint8ClampedArray, none: Uint8ClampedArray) => {
        let covered = 0;
        let changed = 0;
        for (let i = 0; i < none.length; i += 4) {
            if (none[i] === 255 && none[i + 1] === 255 && none[i + 2] === 255) continue;
            covered++;
            if (Math.max(...[0, 1, 2].map((c) => Math.abs(withGlow[i + c] - none[i + c]))) > 8) changed++;
        }
        return { covered, share: changed / covered };
    };

    const outsideShare = (withGlow: Uint8ClampedArray, none: Uint8ClampedArray) => {
        let changed = 0;
        for (let i = 0; i < none.length; i += 4) {
            if (none[i] !== 255 || none[i + 1] !== 255 || none[i + 2] !== 255) continue;
            if (withGlow[i + 1] < 247) changed++;
        }
        return changed;
    };

    describe.each(CASES)('around %s', (_name, options) => {
        describe.each(['overlay', 'cutout'] as const)('drawn as %s', (mode) => {
            it.each([undefined, 0, 5])('keeps its own colour inside its footprint, with a gap of %s', async (gap) => {
                const none = await render(options({ glow: { enabled: false } }, mode));
                const withGlow = await render(options({ glow: glow(gap) }, mode));

                const { covered, share } = changedShare(withGlow, none);
                expect(covered).toBeGreaterThan(1000);
                // The footprint is clear of the glow, bar the antialiased pixels at its edge, which a gap of 0 leaves as it does.
                expect(share).toBeLessThan(0.1);
                // The glow still shows beside the item.
                expect(outsideShare(withGlow, none)).toBeGreaterThan(100);
            });
        });
    });
});

describe('the hovered glow of a batch of opaque and see-through items, with no gap', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Awaited<ReturnType<typeof createEnterpriseChart>> | undefined;
    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
    // From the inside of the edge of the marker to the glow past it, which takes in the anti-aliased pixels of the edge.
    const DISTANCES = [-6, -1, 0, 0.5, 1, 3, 6];

    /**
     * The hovered low and high markers of a range area share one glow. The `itemStyler` makes the high one see-through and the
     * low one opaque, so the batch of the glow holds both.
     */
    const options = (
        highOpacity: number,
        glowOptions: object,
        drawingMode: 'overlay' | 'cutout'
    ): AgCartesianChartOptions => ({
        ...RENDER_OPTIONS,
        data: [{ x: 'A', low: 1, high: 9 }],
        axes: { y: { type: 'number', min: 0, max: 10 } },
        highlight: { drawingMode },
        series: [
            {
                type: 'range-area',
                xKey: 'x',
                yLowKey: 'low',
                yHighKey: 'high',
                marker: {
                    enabled: true,
                    shape: 'circle',
                    size: 30,
                    fill: 'blue',
                    strokeWidth: 0,
                    itemStyler: ({ itemType }: { itemType: string }) => ({
                        fillOpacity: itemType === 'high' ? highOpacity : 1,
                    }),
                },
                highlight: { highlightedItem: { glow: glowOptions } },
            },
        ],
    });

    /** The pixels round the opaque low marker and in the see-through high marker, with the first datum hovered. */
    const hovered = async (highOpacity: number, glowOptions: object, drawingMode: 'overlay' | 'cutout') => {
        chart = await createEnterpriseChart(options(highOpacity, glowOptions, drawingMode));
        await waitForChartStability(chart);
        await hoverDatum(chart);

        const markers = collectShapes(deproxy(chart).series[0].highlightNodeGroup)
            .map((shape) => Transformable.toCanvas(shape))
            .sort((a, b) => b.y - a.y);
        expect(markers).toHaveLength(2);
        const [low, high] = markers;

        const { context } = deproxy(chart).ctx.scene.canvas;
        const pixelAt = (x: number, y: number) => [...context.getImageData(Math.round(x), Math.round(y), 1, 1).data];
        const lowCentre = [low.x + low.width / 2, low.y + low.height / 2];
        const highCentre = [high.x + high.width / 2, high.y + high.height / 2];
        const radius = low.width / 2;
        const ring = DISTANCES.flatMap((d) =>
            ANGLES.map((angle) => {
                const radians = (angle * Math.PI) / 180;
                return pixelAt(
                    lowCentre[0] + (radius + d) * Math.cos(radians),
                    lowCentre[1] - (radius + d) * Math.sin(radians)
                );
            })
        );
        const inHigh = ANGLES.map((angle) => {
            const radians = (angle * Math.PI) / 180;
            return pixelAt(highCentre[0] + 6 * Math.cos(radians), highCentre[1] - 6 * Math.sin(radians));
        });
        chart.destroy();
        chart = undefined;
        return { ring, inHigh };
    };

    const GLOW = { enabled: true, fill: 'red', fillOpacity: 1, blur: 6, spread: 10 };
    const bytesOf = (pixels: number[][]) => ({ data: pixels.flat() });

    describe.each(['overlay', 'cutout'] as const)('drawn as %s', (mode) => {
        it('leaves the opaque item as it is beside the see-through one, to its edge', async () => {
            // With both markers opaque the batch has no footprint to cut, so the edge of the low marker is as it is cast.
            const alone = await hovered(1, GLOW, mode);
            const mixed = await hovered(0.4, GLOW, mode);

            expectSamePixels(bytesOf(mixed.ring), bytesOf(alone.ring), 2);
        });

        it('keeps the see-through item its own colour in the same batch', async () => {
            const none = await hovered(0.4, { enabled: false }, mode);
            const mixed = await hovered(0.4, GLOW, mode);

            expectSamePixels(bytesOf(mixed.inHigh), bytesOf(none.inHigh), 2);
        });
    });
});
