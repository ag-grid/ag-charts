import { afterEach, describe, expect, it } from 'vitest';

import type { AgCartesianChartOptions, AgChartInstance } from 'ag-charts-types';

import {
    getLabelBoxCornerRadius,
    getPlacedLabelData,
    getSeriesLabelObstacles,
    getSeriesPaths,
    getVisibleLabelTextNodes,
} from './communitySeriesAccessors';
import { getSeriesAt, getSeriesContextNodeData, getSeriesSelectionNodes } from './seriesAccessors';
import { createChart, deproxy, errorFrom, setupMockCanvas, setupMockConsole, waitForChartStability } from './utils';

describe('community series test accessors', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(() => {
        if (chart != null) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const data = [
        { x: 'A', y: 10 },
        { x: 'B', y: 20 },
        { x: 'C', y: 15 },
    ];

    const lineOptions = (label: object = {}): AgCartesianChartOptions => ({
        data,
        legend: { enabled: false },
        series: [{ type: 'line', xKey: 'x', yKey: 'y', label: { enabled: true, placement: 'top', ...label } }],
    });

    const barOptions: AgCartesianChartOptions = {
        data,
        legend: { enabled: false },
        series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
    };

    describe('getPlacedLabelData', () => {
        it('returns a placed label per labelled datum, with the placement it took', async () => {
            chart = await createChart(lineOptions());

            const placed = getPlacedLabelData(chart);

            expect(placed).toHaveLength(data.length);
            expect(placed.map((label) => label.placement)).toEqual(['top', 'top', 'top']);
            expect(placed).toBe(getPlacedLabelData(deproxy(chart)));
        });

        it('returns the placed labels of the series at the index it is given', async () => {
            chart = await createChart({
                ...lineOptions(),
                series: [
                    { type: 'line', xKey: 'x', yKey: 'y', yName: 'First', label: { enabled: true, placement: 'top' } },
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y',
                        yName: 'Second',
                        label: { enabled: true, placement: 'bottom' },
                    },
                ],
            });

            expect(getPlacedLabelData(chart, 0).map((label) => label.placement)).toEqual(['top', 'top', 'top']);
            expect(getPlacedLabelData(chart, 1).map((label) => label.placement)).toEqual([
                'bottom',
                'bottom',
                'bottom',
            ]);
        });

        it('fails for a series that keeps no placed labels', async () => {
            chart = await createChart(barOptions);

            expect(errorFrom(() => getPlacedLabelData(chart))?.name).toBe('AssertionError');
        });
    });

    describe('getSeriesLabelObstacles', () => {
        it('returns the obstacles a bar series contributes, one per bar', async () => {
            chart = await createChart(barOptions);

            const obstacles = getSeriesLabelObstacles(chart);

            expect(obstacles).toHaveLength(data.length);
            expect(obstacles.every((obstacle) => obstacle.kind === 'rect')).toBe(true);
        });

        it('returns the obstacles of the series at the index it is given', async () => {
            chart = await createChart({
                data,
                legend: { enabled: false },
                series: [
                    { type: 'line', xKey: 'x', yKey: 'y' },
                    { type: 'bar', xKey: 'x', yKey: 'y' },
                ],
            });

            expect(getSeriesLabelObstacles(chart, 0)).toHaveLength(0);
            expect(getSeriesLabelObstacles(chart, 1)).toHaveLength(data.length);
        });

        it('is empty for a series that can contribute obstacles but has none', async () => {
            chart = await createChart({
                data,
                legend: { enabled: false },
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            });

            expect(getSeriesLabelObstacles(chart)).toEqual([]);
        });

        it('fails for a series that cannot contribute obstacles', async () => {
            chart = await createChart({
                data,
                series: [{ type: 'area', xKey: 'x', yKey: 'y' }],
            });

            expect(errorFrom(() => getSeriesLabelObstacles(chart))?.name).toBe('AssertionError');
        });
    });

    describe('getVisibleLabelTextNodes', () => {
        it('returns the labels the series is showing, without the ones it hid', async () => {
            chart = await createChart(lineOptions({ formatter: ({ value }: { value: number }) => `${value}` }));

            const nodes = getVisibleLabelTextNodes(chart);

            expect(nodes.map((node) => node.text)).toEqual(['10', '20', '15']);
            expect(nodes.every((node) => node.visible)).toBe(true);
        });

        it('leaves out a label the series has hidden', async () => {
            // The bar fills the value axis, so its outside-end label spills into the padding and is hidden.
            chart = await createChart({
                data: [{ x: 'A', y: 10 }],
                legend: { enabled: false },
                padding: { top: 100, right: 10, bottom: 10, left: 10 },
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left', min: 0, max: 10 },
                },
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        label: { enabled: true, placement: 'outside-end', collision: { alwaysShow: false } },
                    },
                ],
            });

            expect(getSeriesSelectionNodes(chart, 'labelSelection')).toHaveLength(1);
            expect(getVisibleLabelTextNodes(chart)).toHaveLength(0);
        });

        it('returns the highlight labels when that selection is asked for', async () => {
            chart = await createChart(lineOptions());
            expect(getVisibleLabelTextNodes(chart, 0, 'highlightLabelSelection')).toHaveLength(0);

            const [datum] = getSeriesContextNodeData(chart).labelData;
            deproxy(chart).ctx.highlightManager.updateHighlight(getSeriesAt(chart).id, datum);
            await waitForChartStability(chart);

            expect(getVisibleLabelTextNodes(chart, 0, 'highlightLabelSelection')).toHaveLength(1);
            expect(getVisibleLabelTextNodes(chart)).toHaveLength(data.length);
        });

        it('returns the labels of another series by index', async () => {
            chart = await createChart({
                ...lineOptions(),
                series: [
                    { type: 'bar', xKey: 'x', yKey: 'y' },
                    { type: 'line', xKey: 'x', yKey: 'y', label: { enabled: true } },
                ],
            });

            expect(getVisibleLabelTextNodes(chart, 0)).toHaveLength(0);
            expect(getVisibleLabelTextNodes(chart, 1)).toHaveLength(data.length);
        });

        it('fails for a series that does not exist', async () => {
            chart = await createChart(lineOptions());

            expect(errorFrom(() => getVisibleLabelTextNodes(chart, 3))?.name).toBe('AssertionError');
        });
    });

    describe('getLabelBoxCornerRadius', () => {
        it('returns the radius of the box behind the label text', async () => {
            chart = await createChart(lineOptions({ fill: 'khaki', cornerRadius: 7 }));

            const [node] = getVisibleLabelTextNodes(chart);

            expect(getLabelBoxCornerRadius(node)).toBe(7);
        });

        it('is undefined for a label that draws no box', async () => {
            chart = await createChart(lineOptions());

            const [node] = getVisibleLabelTextNodes(chart);

            expect(getLabelBoxCornerRadius(node)).toBeUndefined();
        });
    });

    describe('getSeriesPaths', () => {
        it('returns the fill and the stroke path of an area series, in that order', async () => {
            chart = await createChart({
                data,
                series: [{ type: 'area', xKey: 'x', yKey: 'y', fill: 'red', stroke: 'blue' }],
            });

            const [fillPath, strokePath, ...others] = getSeriesPaths(chart);

            expect(others).toHaveLength(0);
            expect(fillPath.fill).toBe('red');
            expect(strokePath.stroke).toBe('blue');
        });

        it('returns the paths of the series at the index it is given', async () => {
            chart = await createChart({
                data,
                series: [
                    { type: 'area', xKey: 'x', yKey: 'y', fill: 'red', stroke: 'blue' },
                    { type: 'line', xKey: 'x', yKey: 'y', stroke: 'green' },
                ],
            });

            expect(getSeriesPaths(chart, 0)).toHaveLength(2);
            const [linePath, ...others] = getSeriesPaths(chart, 1);
            expect(others).toHaveLength(0);
            expect(linePath.stroke).toBe('green');
        });

        it('fails for a series that draws no paths', async () => {
            chart = await createChart({ data, series: [{ type: 'pie', angleKey: 'y' }] });

            expect(errorFrom(() => getSeriesPaths(chart))?.name).toBe('AssertionError');
        });
    });
});
