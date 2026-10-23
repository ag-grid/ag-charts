import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartInstance } from 'ag-charts-community';
import { getTabStopGroups, setupMockCanvas, setupMockConsole } from 'ag-charts-community-test';

import { createEnterpriseChart } from './test/utils';

describe('keyboard tab order', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    it('visits the cross lines after the series area and before the legend, navigator and scrollbars', async () => {
        chart = await createEnterpriseChart({
            data: [
                { x: 1, y: 2 },
                { x: 4, y: 8 },
            ],
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            legend: { enabled: true },
            zoom: { enabled: true },
            navigator: { enabled: true },
            scrollbar: { enabled: true },
            listeners: { crossLineClick: () => {} },
            axes: {
                x: { type: 'number', crossLines: [{ type: 'line', value: 2 }] },
                y: { type: 'number', crossLines: [{ type: 'line', value: 3 }] },
            },
        });

        expect(getTabStopGroups()).toEqual([
            'ag-charts-series-area',
            'ag-charts-proxy-cross-lines',
            'ag-charts-proxy-legend-toolbar',
            'ag-charts-proxy-navigator-toolbar',
            'ag-charts-proxy-scrollbar',
            'ag-charts-proxy-scrollbar',
        ]);
    });

    it('visits polar cross lines after the series area and before the legend', async () => {
        chart = await createEnterpriseChart({
            data: [
                { quarter: 'Q1', revenue: 2 },
                { quarter: 'Q2', revenue: 8 },
                { quarter: 'Q3', revenue: 5 },
            ],
            series: [{ type: 'radar-line', angleKey: 'quarter', radiusKey: 'revenue' }],
            legend: { enabled: true },
            listeners: { crossLineClick: () => {} },
            axes: {
                angle: { type: 'angle-category', crossLines: [{ type: 'line', value: 'Q2' }] },
                radius: { type: 'radius-number', crossLines: [{ type: 'line', value: 4 }] },
            },
        });

        expect(getTabStopGroups()).toEqual([
            'ag-charts-series-area',
            'ag-charts-proxy-cross-lines',
            'ag-charts-proxy-legend-toolbar',
        ]);
    });
});
