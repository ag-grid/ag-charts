import { afterEach, describe, expect, it } from 'vitest';

import type { AgCartesianChartOptions, AgChartInstance } from 'ag-charts-types';

import {
    getLabelBoxCornerRadius,
    getPlacedLabelData,
    getSeriesLabelObstacles,
    getSeriesPaths,
    getVisibleLabelTextNodes,
} from './communitySeriesAccessors';
import { createChart, deproxy, errorFrom, setupMockCanvas, setupMockConsole } from './utils';

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

        it('fails for a selection the series does not have', async () => {
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

        it('fails for a series that draws no paths', async () => {
            chart = await createChart({ data, series: [{ type: 'pie', angleKey: 'y' }] });

            expect(errorFrom(() => getSeriesPaths(chart))?.name).toBe('AssertionError');
        });
    });
});
