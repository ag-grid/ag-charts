import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AgChartInstance, AgChartOptions, _ModuleSupport } from 'ag-charts-community';
import {
    SINGLE_HIGHLIGHT_SHARED_TOOLTIP,
    besideBars,
    countChartPixels,
    deproxy,
    expectGlowCoversPartsBeside,
    getSeriesAt,
    hoverDatum,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import { Group, SERIES_GLOW_OVERLAY_Z_INDEX, compareZIndex } from 'ag-charts-core';

import { ErrorBarGroup, ErrorBarNode } from '../features/error-bar/errorBarNode';
import { getFlowNodeData } from '../test/enterpriseSeriesAccessors';
import { FLOW_DATA, createEnterpriseChart } from '../test/utils';

type HighlightNodeDatum = _ModuleSupport.HighlightNodeDatum;

const LINK = [255, 0, 0, 255];
const GLOW = [0, 255, 0, 255];
// A gap of 0, as the glow was drawn before the theme gap of 1, which this test of what the glow covers is not about.
const NODE_GLOW = { enabled: true, fill: '#00ff00', fillOpacity: 1, spread: 12, blur: 0, gap: 0 };

describe('a highlight glow of a series with links and nodes', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;
    afterEach(() => {
        chart?.destroy();
    });

    // The pixels of one colour, after node 0 is hovered, so that the other nodes cast their `unhighlightedItem` glow.
    const hovered = async (type: 'sankey' | 'chord', glow: object | undefined) => {
        chart = await createEnterpriseChart({
            data: FLOW_DATA,
            animation: { enabled: false },
            legend: { enabled: false },
            ...SINGLE_HIGHLIGHT_SHARED_TOOLTIP,
            series: [
                {
                    type,
                    fromKey: 'from',
                    toKey: 'to',
                    sizeKey: 'size',
                    node: { fill: '#0000ff', fillOpacity: 1 },
                    link: { fill: '#ff0000', fillOpacity: 1, stroke: undefined, strokeWidth: 0 },
                    highlight: { unhighlightedItem: { opacity: 1, fillOpacity: 1, glow } },
                },
            ],
        } as AgChartOptions);
        await waitForChartStability(chart);
        const { ctx, id } = deproxy(chart);
        ctx.highlightManager.updateHighlight(id, getFlowNodeData(chart)[0] as HighlightNodeDatum);
        await waitForChartStability(chart);

        return { links: countChartPixels(chart, LINK), glow: countChartPixels(chart, GLOW) };
    };

    it.each(['sankey', 'chord'] as const)(
        'covers the links of its own series with the glow of the nodes, which cast it above the series (%s)',
        async (type) => {
            const without = await hovered(type, undefined);
            chart.destroy();
            const withGlow = await hovered(type, NODE_GLOW);

            expect(withGlow.glow).toBeGreaterThan(0);
            expect(withGlow.links).toBeLessThan(without.links);
        }
    );
});

describe('the error bars of a series with a glow', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;
    afterEach(() => {
        chart?.destroy();
    });

    it.each([0, 1] as const)(
        'are covered by the glow of the series beside them alone, with series %s glowing',
        (glowing) => expectGlowCoversPartsBeside(glowing, 'errorBar', (options) => createEnterpriseChart(options))
    );

    describe('as the shadow root gathers them', () => {
        // The groups of error bars that the root visits while the chart is made.
        const visits = async (series: (index: number) => object) => {
            const options = besideBars(0, 'errorBar') as { data: object[]; series: object[] };
            options.data = Array.from({ length: 40 }, (_, i) => ({
                x: `X${i}`,
                a: 5,
                aLo: 4,
                aHi: 8,
                b: 5,
                bLo: 4,
                bHi: 8,
            }));
            options.series = options.series.map((base, index) => ({ ...base, ...series(index) }));
            const gather = vi.spyOn(Group.prototype, 'gatherShadows');
            try {
                chart = await createEnterpriseChart(options as AgChartOptions);
                const visited = gather.mock.contexts;
                return {
                    series: visited.filter((node) => node instanceof ErrorBarGroup).length,
                    bars: visited.filter((node) => node instanceof ErrorBarNode).length,
                };
            } finally {
                gather.mockRestore();
                chart?.destroy();
            }
        };

        it('are visited as one group for the series, and not as one for each bar', async () => {
            const { series, bars } = await visits(() => ({}));

            expect(series).toBeGreaterThan(0);
            expect(bars).toBe(0);
        });

        it('are not visited in a chart that casts a shadow and no glow', async () => {
            const shadow = { enabled: true, fill: '#000000', blur: 4, xOffset: 4, yOffset: 4 };

            expect(await visits(() => ({ glow: undefined, shadow }))).toEqual({ series: 0, bars: 0 });
        });
    });
});

describe('the error bars of a hovered series that is not brought to front', () => {
    setupMockConsole();
    setupMockCanvas();

    const WHISKER = [255, 0, 255, 255];

    // The hovered glow is cast in a layer above the overlay, which the series' own error bars still cut.
    const whiskerPixels = async (glow: object | undefined) => {
        const chart = await createEnterpriseChart({
            data: ['A', 'B', 'C', 'D'].map((x) => ({ x, a: 5, aLo: 4, aHi: 8 })),
            animation: { enabled: false },
            legend: { enabled: false },
            ...SINGLE_HIGHLIGHT_SHARED_TOOLTIP,
            axes: { y: { type: 'number', min: 0, max: 10 } },
            series: [
                {
                    type: 'bar',
                    xKey: 'x',
                    yKey: 'a',
                    fill: '#0000ff',
                    highlight: { bringToFront: false, highlightedItem: { fill: '#0000ff', glow } },
                    errorBar: { yLowerKey: 'aLo', yUpperKey: 'aHi', stroke: '#ff00ff', strokeWidth: 4 },
                },
            ],
        } as AgChartOptions);
        await waitForChartStability(chart);
        await hoverDatum(chart, 0, 1);
        const count = countChartPixels(chart, WHISKER);
        chart.destroy();
        return count;
    };

    it('are not covered by the glow of the hovered item', async () => {
        const bare = await whiskerPixels(undefined);

        expect(bare).toBeGreaterThan(0);
        expect(await whiskerPixels({ ...NODE_GLOW, spread: 60 })).toBe(bare);
    });
});

describe('the labels of a series with a glow', () => {
    setupMockConsole();
    setupMockCanvas();

    const LABEL = [255, 0, 0, 255];
    const label = { color: '#ff0000', fontSize: 16 };
    const data = [
        { k: 'A', v: 3 },
        { k: 'B', v: 2 },
        { k: 'C', v: 4 },
    ];
    // Each places a label where the glow of its own series reaches it.
    const CASES: Record<string, (glow: object | undefined) => AgChartOptions> = {
        'pie callout': (glow) => ({
            data,
            series: [
                { type: 'pie', angleKey: 'v', calloutLabelKey: 'k', calloutLabel: label, fills: ['#0000ff'], glow },
            ],
        }),
        'line marker': (glow) => ({
            data,
            series: [
                {
                    type: 'line',
                    xKey: 'k',
                    yKey: 'v',
                    marker: { enabled: true, size: 20, glow },
                    label: { enabled: true, ...label },
                },
            ],
        }),
        scatter: (glow) => ({
            data: data.map(({ v }, x) => ({ x, v })),
            series: [{ type: 'scatter', xKey: 'x', yKey: 'v', size: 20, labelKey: 'v', label, glow }],
        }),
        sankey: (glow) => ({
            data: FLOW_DATA,
            series: [{ type: 'sankey', fromKey: 'from', toKey: 'to', sizeKey: 'size', label, node: { glow } }],
        }),
        chord: (glow) => ({
            data: FLOW_DATA,
            series: [{ type: 'chord', fromKey: 'from', toKey: 'to', sizeKey: 'size', label, node: { glow } }],
        }),
        'bar rich text': (glow) => ({
            data,
            series: [
                {
                    type: 'bar',
                    xKey: 'k',
                    yKey: 'v',
                    fill: '#0000ff',
                    glow,
                    label: {
                        enabled: true,
                        placement: 'outside-end',
                        ...label,
                        formatter: ({ value }: { value: number }) => [{ text: 'v' }, { text: String(value) }],
                    },
                },
            ],
        }),
    };

    const labelPixels = async (name: string, glow: object | undefined) => {
        const chart = await createEnterpriseChart({
            animation: { enabled: false },
            legend: { enabled: false },
            ...CASES[name](glow),
        } as AgChartOptions);
        const count = countChartPixels(chart, LABEL);
        chart.destroy();
        return count;
    };

    it.each(Object.keys(CASES))('of a %s are not covered by its own glow', async (name) => {
        const bare = await labelPixels(name, undefined);

        expect(bare).toBeGreaterThan(0);
        expect(await labelPixels(name, { ...NODE_GLOW, spread: 30 })).toBe(bare);
    });
});

describe('the highlights and labels of a hovered nightingale series', () => {
    setupMockConsole();
    setupMockCanvas();

    const zIndexes = async (bringToFront: boolean) => {
        const chart = await createEnterpriseChart({
            data: [{ q: 'Q1', a: 3, b: 2 }],
            animation: { enabled: false },
            series: ['a', 'b'].map((radiusKey) => ({
                type: 'nightingale',
                angleKey: 'q',
                radiusKey,
                highlight: { bringToFront },
                label: { enabled: true },
            })),
        } as AgChartOptions);
        await waitForChartStability(chart);
        await hoverDatum(chart, 1);
        const { highlightGroup, labelGroup } = getSeriesAt(chart, 1);
        chart.destroy();
        return [highlightGroup, labelGroup].map(({ zIndex }) => compareZIndex(zIndex, SERIES_GLOW_OVERLAY_Z_INDEX));
    };

    it('lie above the glow overlay when brought to front, and beneath it otherwise', async () => {
        expect(await zIndexes(true)).toEqual([1, 1]);
        expect(await zIndexes(false)).toEqual([-1, -1]);
    });
});
