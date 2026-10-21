import { afterEach, describe, expect, it } from 'vitest';

import type { AgCartesianChartOptions, AgChartInstance } from 'ag-charts-community';
import { deproxy, errorFrom, setupMockCanvas, setupMockConsole } from 'ag-charts-community-test';

import type { HierarchyNode } from '../series/hierarchy/hierarchySeries';
import { getCrossLineLabelNodes } from './polarCrossLines';
import { getHierarchyRootNode } from './seriesAccessors';
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

    describe('getHierarchyRootNode', () => {
        const hierarchyData = [
            {
                name: 'Root',
                children: [
                    { name: 'A', size: 3 },
                    { name: 'B', children: [{ name: 'B1', size: 2 }] },
                ],
            },
        ];

        it.each(['treemap', 'sunburst'] as const)('returns the root of the tree a %s series built', async (type) => {
            chart = await createEnterpriseChart({
                data: hierarchyData,
                series: [{ type, labelKey: 'name', sizeKey: 'size' }],
            });

            const root = getHierarchyRootNode(chart);

            // The series' own root sits above the data rows, which are its children.
            const [top] = root?.children ?? [];
            expect(root?.children.map((child: HierarchyNode) => child.datum?.name)).toEqual(['Root']);
            expect(top.children.map((child: HierarchyNode) => child.datum?.name)).toEqual(['A', 'B']);
            expect(top.children[1].children.map((child: HierarchyNode) => child.datum?.name)).toEqual(['B1']);
            expect(getHierarchyRootNode(deproxy(chart))).toBe(root);
        });

        it('fails for a series that is not a hierarchy series', async () => {
            chart = await createEnterpriseChart({
                data: [{ x: 'A', y: 1 }],
                series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
            });

            expect(errorFrom(() => getHierarchyRootNode(chart!))?.name).toBe('AssertionError');
        });
    });
});
