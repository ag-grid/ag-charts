import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartInstance, AgChartOptions, _ModuleSupport } from 'ag-charts-community';
import {
    SINGLE_HIGHLIGHT_SHARED_TOOLTIP,
    countChartPixels,
    deproxy,
    hoverDatum,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { getFlowNodeData } from '../test/enterpriseSeriesAccessors';
import { FLOW_DATA, createEnterpriseChart } from '../test/utils';

type HighlightNodeDatum = _ModuleSupport.HighlightNodeDatum;

const LINK = [255, 0, 0, 255];
const GLOW = [0, 255, 0, 255];
const NODE_GLOW = { enabled: true, fill: '#00ff00', fillOpacity: 1, spread: 12, blur: 0 };

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

    const WHISKERS = [
        [255, 0, 255, 255],
        [255, 128, 0, 255],
    ];

    // Narrow bars, so that the glow of one reaches over the error bar of the bar beside it.
    const options = (glowing: 0 | 1 | undefined): AgChartOptions => ({
        data: ['A', 'B', 'C', 'D'].map((x) => ({ x, a: 5, aLo: 4, aHi: 8, b: 5, bLo: 4, bHi: 8 })),
        animation: { enabled: false },
        legend: { enabled: false },
        axes: { y: { type: 'number', min: 0, max: 10 } },
        series: ['a', 'b'].map((yKey, index) => ({
            type: 'bar',
            xKey: 'x',
            yKey,
            fill: '#0000ff',
            fillOpacity: 1,
            glow: index === glowing ? { ...NODE_GLOW, spread: 60 } : undefined,
            errorBar: {
                yLowerKey: `${yKey}Lo`,
                yUpperKey: `${yKey}Hi`,
                stroke: index === 0 ? '#ff00ff' : '#ff8000',
                strokeWidth: 4,
            },
        })),
    });

    const whiskerPixels = async (glowing: 0 | 1 | undefined) => {
        chart = await createEnterpriseChart(options(glowing));
        const counts = WHISKERS.map((colour) => countChartPixels(chart, colour));
        chart.destroy();
        return counts;
    };

    it.each([0, 1] as const)(
        'are covered by the glow of the series beside them alone, with series %s glowing',
        async (glowing) => {
            const bare = await whiskerPixels(undefined);
            const glowed = await whiskerPixels(glowing);

            expect(bare.every((count) => count > 0)).toBe(true);
            expect(glowed[glowing]).toBe(bare[glowing]);
            expect(glowed[1 - glowing]).toBeLessThan(bare[1 - glowing]);
        }
    );
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
