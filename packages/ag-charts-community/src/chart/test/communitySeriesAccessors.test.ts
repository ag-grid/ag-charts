import { afterEach, describe, expect, it } from 'vitest';

import { ChartUpdateType, type Text } from 'ag-charts-core';
import type { AgCartesianChartOptions, AgChartInstance, AgChartOptions } from 'ag-charts-types';

import { DonutNodeTag } from '../series/polar/donutSeries';
import {
    getAxisGridLineVisibility,
    getBarSeriesContextNodeData,
    getFilteredValueExceedUnfiltered,
    getHistogramBins,
    getLabelBoxCornerRadius,
    getPathSeriesContextNodeData,
    getPlacedLabelData,
    getSeriesCalloutNodes,
    getSeriesLabelObstacles,
    getSeriesPaths,
    getVisibleLabelTextNodes,
    getXCoordinateRange,
    toggleSeriesLegendItem,
    withUndocumentedOptions,
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

    describe('getHistogramBins', () => {
        it('returns the bins computed from the data, in bin order', async () => {
            chart = await createChart({
                data: [{ v: 1 }, { v: 2 }, { v: 12 }, { v: 13 }, { v: 14 }],
                series: [{ type: 'histogram', xKey: 'v', binCount: 2 }],
            });

            const bins = getHistogramBins(chart);

            expect(bins).toHaveLength(2);
            expect(bins.map((bin) => bin.frequency)).toEqual([2, 3]);
        });

        it('fails for a series that is not a histogram', async () => {
            chart = await createChart(barOptions);

            expect(errorFrom(() => getHistogramBins(chart))?.name).toBe('AssertionError');
        });
    });

    describe('withUndocumentedOptions', () => {
        it('adds the undocumented options and keeps the ones it is given', () => {
            const series = withUndocumentedOptions({ type: 'bar', xKey: 'x', yKey: 'y' }, { yFilterKey: 'f' });

            expect(series).toEqual({ type: 'bar', xKey: 'x', yKey: 'y', yFilterKey: 'f' });
        });

        it('does not change the series it is given', () => {
            const series = { type: 'bar', xKey: 'x', yKey: 'y' };

            withUndocumentedOptions(series, { allowNullKeys: true });

            expect(series).toEqual({ type: 'bar', xKey: 'x', yKey: 'y' });
        });
    });

    describe('getPathSeriesContextNodeData', () => {
        it('returns the stroke spans of a line series, with no fill spans', async () => {
            chart = await createChart(lineOptions());

            const context = getPathSeriesContextNodeData(chart);

            expect(context.strokeData).toBeDefined();
            expect(context.fillData).toBeUndefined();
        });

        it('returns the fill spans as well for an area series', async () => {
            chart = await createChart({ data, series: [{ type: 'area', xKey: 'x', yKey: 'y' }] });

            expect(getPathSeriesContextNodeData(chart).fillData).toBeDefined();
        });

        it('fails for a series that builds no stroke spans', async () => {
            chart = await createChart({ data, series: [{ type: 'pie', angleKey: 'y' }] });

            expect(errorFrom(() => getPathSeriesContextNodeData(chart))?.name).toBe('AssertionError');
        });
    });

    describe('getAxisGridLineVisibility', () => {
        it('returns whether each axis shows its grid lines, in axis order', async () => {
            chart = await createChart({
                ...barOptions,
                axes: {
                    x: { type: 'category', position: 'bottom', gridLine: { enabled: false } },
                    y: { type: 'number', position: 'left', gridLine: { enabled: true } },
                },
            });

            expect(getAxisGridLineVisibility(chart)).toEqual([false, true]);
        });
    });

    describe('getXCoordinateRange', () => {
        const bubbleOptions: AgCartesianChartOptions = {
            data: [
                { x: 1, y: 1, size: 10 },
                { x: 2, y: 2, size: 20 },
            ],
            series: [{ type: 'bubble', xKey: 'x', yKey: 'y', sizeKey: 'size' }],
        };

        it('returns an extent that contains the datum x value and grows with the pixel size', async () => {
            chart = await createChart(bubbleOptions);

            const [narrowMin, narrowMax] = getXCoordinateRange(chart, 1, 1, 0);
            const [wideMin, wideMax] = getXCoordinateRange(chart, 1, 10, 0);

            expect(narrowMin).toBeLessThanOrEqual(1);
            expect(narrowMax).toBeGreaterThanOrEqual(1);
            expect(wideMax - wideMin).toBeGreaterThan(narrowMax - narrowMin);
        });

        it('fails for a series that does not size its datums this way', async () => {
            chart = await createChart({ data, series: [{ type: 'pie', angleKey: 'y' }] });

            expect(errorFrom(() => getXCoordinateRange(chart, 1, 1, 0))?.name).toBe('AssertionError');
        });
    });

    describe('getBarSeriesContextNodeData', () => {
        it('returns the bar nodes with an unfiltered phantom for each when the series has a yFilterKey', async () => {
            chart = await createChart({
                data: [
                    { x: 'A', y: 10, f: 4 },
                    { x: 'B', y: 20, f: 8 },
                ],
                series: [withUndocumentedOptions({ type: 'bar', xKey: 'x', yKey: 'y' } as const, { yFilterKey: 'f' })],
            });

            const { nodeData, phantomNodeData } = getBarSeriesContextNodeData(chart);

            expect(nodeData).toHaveLength(2);
            expect(phantomNodeData).toHaveLength(2);
        });

        it('fails for a series that builds no phantom nodes', async () => {
            chart = await createChart({ data, series: [{ type: 'pie', angleKey: 'y' }] });

            expect(errorFrom(() => getBarSeriesContextNodeData(chart))?.name).toBe('AssertionError');
        });
    });

    describe('getFilteredValueExceedUnfiltered', () => {
        // The flag is only reduced for stacked series that normalise and filter.
        const filteredOptions = (filter: number): AgCartesianChartOptions => ({
            data: [{ x: 'A', a: 60, b: 40, aFiltered: filter, bFiltered: 10 }],
            series: [
                withUndocumentedOptions(
                    { type: 'bar', xKey: 'x', yKey: 'a', stacked: true, normalizedTo: 100 } as const,
                    { yFilterKey: 'aFiltered' }
                ),
                withUndocumentedOptions(
                    { type: 'bar', xKey: 'x', yKey: 'b', stacked: true, normalizedTo: 100 } as const,
                    { yFilterKey: 'bFiltered' }
                ),
            ],
        });

        it('is true when a filtered value is larger than the value it filters', async () => {
            chart = await createChart(filteredOptions(80));

            expect(getFilteredValueExceedUnfiltered(chart)).toBe(true);
        });

        it('is false when every filtered value fits within its value', async () => {
            chart = await createChart(filteredOptions(20));

            expect(getFilteredValueExceedUnfiltered(chart)).toBe(false);
        });

        it('fails for a series that did not reduce the flag', async () => {
            chart = await createChart({ data, series: [{ type: 'pie', angleKey: 'y' }] });

            expect(errorFrom(() => getFilteredValueExceedUnfiltered(chart))?.name).toBe('AssertionError');
        });
    });

    describe('toggleSeriesLegendItem', () => {
        const pieOptions: AgChartOptions = {
            data: [
                { label: 'A', value: 10 },
                { label: 'B', value: 20 },
                { label: 'C', value: 30 },
            ],
            legend: { enabled: false },
            series: [{ type: 'pie', angleKey: 'value', calloutLabelKey: 'label' }],
        };
        const calloutCount = () =>
            getSeriesCalloutNodes(chart, DonutNodeTag.CalloutLabel).filter((n) => n.visible).length;

        it('hides one item of the series and shows it again', async () => {
            chart = await createChart(pieOptions);
            expect(calloutCount()).toBe(3);

            toggleSeriesLegendItem(chart, false, 1);
            deproxy(chart).update(ChartUpdateType.FULL);
            await waitForChartStability(chart);
            expect(calloutCount()).toBe(2);

            toggleSeriesLegendItem(chart, true, 1);
            deproxy(chart).update(ChartUpdateType.FULL);
            await waitForChartStability(chart);
            expect(calloutCount()).toBe(3);
        });
    });

    describe('getSeriesCalloutNodes', () => {
        it('returns the nodes a pie series drew for the part of the callouts it is given', async () => {
            chart = await createChart({
                data: [
                    { label: 'A', value: 10 },
                    { label: 'B', value: 20 },
                ],
                series: [{ type: 'pie', angleKey: 'value', calloutLabelKey: 'label' }],
            });

            const labels = getSeriesCalloutNodes<Text>(chart, DonutNodeTag.CalloutLabel);

            expect(labels.map((node) => node.text)).toEqual(['A', 'B']);
        });

        it('fails for a series that has no callouts', async () => {
            chart = await createChart(barOptions);

            expect(errorFrom(() => getSeriesCalloutNodes(chart, DonutNodeTag.CalloutLabel))?.name).toBe(
                'AssertionError'
            );
        });
    });
});
