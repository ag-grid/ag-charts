import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartInstance, AgChartOptions, _ModuleSupport } from 'ag-charts-community';
import {
    SINGLE_HIGHLIGHT_SHARED_TOOLTIP,
    countChartPixels,
    deproxy,
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
        'does not cover the links of its own series with the glow of the nodes (%s)',
        async (type) => {
            const without = await hovered(type, undefined);
            chart.destroy();
            const withGlow = await hovered(type, NODE_GLOW);

            expect(withGlow.glow).toBeGreaterThan(0);
            expect(withGlow.links).toBe(without.links);
        }
    );
});
