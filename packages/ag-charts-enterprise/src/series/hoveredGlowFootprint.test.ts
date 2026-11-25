import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartOptions } from 'ag-charts-community';
import {
    RENDER_OPTIONS,
    canvasImage,
    deproxy,
    hoverDatum,
    hoverNode,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { getFlowLinkData } from '../test/enterpriseSeriesAccessors';
import { createEnterpriseChart } from '../test/utils';
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
