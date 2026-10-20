import { afterEach, describe, expect, it } from 'vitest';

import type { AgCartesianChartOptions, AgChartInstance } from 'ag-charts-community';
import { deproxy, setupMockCanvas, setupMockConsole } from 'ag-charts-community-test';

import { getCrossLineLabelNodes } from './polarCrossLines';
import { WhiskerItemNode, createEnterpriseChart, itemNodes } from './utils';

describe('enterprise test accessors', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const crossLineOptions = (label: boolean): AgCartesianChartOptions => ({
        data: [
            { x: 'A', y: 1 },
            { x: 'B', y: 3 },
        ],
        series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
        axes: {
            x: {
                type: 'category',
                position: 'bottom',
                crossLines: [{ type: 'line', value: 'B', ...(label ? { label: { text: 'Target' } } : {}) }],
            },
            y: { type: 'number', position: 'left' },
        },
    });

    describe('getCrossLineLabelNodes', () => {
        it('returns the label node a cross line rendered', async () => {
            chart = await createEnterpriseChart(crossLineOptions(true));

            const nodes = getCrossLineLabelNodes(chart, 'x');

            expect(nodes).toHaveLength(1);
            expect(nodes[0].text).toBe('Target');
        });

        it('returns an empty text node for a cross line without a label', async () => {
            chart = await createEnterpriseChart(crossLineOptions(false));

            const nodes = getCrossLineLabelNodes(chart, 'x');

            expect(nodes).toHaveLength(1);
            expect(nodes[0].text).toBeUndefined();
        });

        it('returns no node for an axis without cross lines', async () => {
            chart = await createEnterpriseChart(crossLineOptions(true));

            expect(getCrossLineLabelNodes(chart, 'y')).toEqual([]);
        });
    });

    describe('itemNodes', () => {
        it('returns the shapes the first series drew, from a chart or its proxy', async () => {
            chart = await createEnterpriseChart({
                data: [
                    { d: 1, o: 2, h: 5, l: 1, c: 4 },
                    { d: 2, o: 4, h: 6, l: 3, c: 3 },
                ],
                series: [{ type: 'candlestick', xKey: 'd', openKey: 'o', highKey: 'h', lowKey: 'l', closeKey: 'c' }],
            });

            const nodes = itemNodes<WhiskerItemNode>(chart);

            expect(nodes).toHaveLength(2);
            expect(itemNodes(deproxy(chart))).toEqual(nodes);
            expect(nodes.every((node) => node.wickPath != null)).toBe(true);
        });
    });
});
