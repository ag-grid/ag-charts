import { describe, expect, it } from '@jest/globals';

import { getDocument } from 'ag-charts-core';
import type { AgCartesianChartOptions, AgChartInstance, AgPolarChartOptions } from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    extractImageData,
    hoverAction,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';

describe('Format Manager', () => {
    setupMockConsole();

    const ctx = setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
        jest.restoreAllMocks();
    });

    const compare = async (defaults = IMAGE_SNAPSHOT_DEFAULTS) => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(defaults);
    };

    it('should return the correct sources', async () => {
        const options: AgCartesianChartOptions = {
            data: [
                { product: 'iPhone', value: 140 },
                { product: 'Mac', value: 20 },
            ],
            series: [
                {
                    type: 'bar',
                    xKey: 'product',
                    yKey: 'value',
                    yName: 'iPhone',
                    label: {
                        enabled: true,
                    },
                },
            ],
            formatter: (params) => params.source,
        };

        chart = AgCharts.create(prepareTestOptions(options));

        await waitForChartStability(chart);

        await compare();
    });

    it('should return the correct bound series', async () => {
        const xFormatter = jest.fn();
        const yFormatter = jest.fn();
        const options: AgCartesianChartOptions = {
            data: [
                { product: 'iPhone', value: 140 },
                { product: 'Mac', value: 20 },
            ],
            series: [
                {
                    type: 'bar',
                    xKey: 'product',
                    yKey: 'value',
                    yName: 'iPhone',
                    label: {
                        enabled: true,
                    },
                },
            ],
            formatter: {
                x: xFormatter,
                y: yFormatter,
            },
        };

        chart = AgCharts.create(prepareTestOptions(options));

        await waitForChartStability(chart);

        expect(xFormatter.mock.calls.at(0)?.at(0)).toEqual({
            boundSeries: [
                {
                    key: 'product',
                    name: undefined,
                    seriesId: 'BarSeries-1',
                },
            ],
            datum: undefined,
            domain: ['iPhone', 'Mac'],
            key: undefined,
            legendItemName: undefined,
            property: 'x',
            seriesId: undefined,
            source: 'axis-label',
            type: 'category',
            value: 'iPhone',
        });
        expect(yFormatter.mock.calls.at(0)?.at(0)).toEqual({
            boundSeries: [
                {
                    key: 'value',
                    name: 'iPhone',
                    seriesId: 'BarSeries-1',
                },
            ],
            datum: undefined,
            domain: [0, 150],
            fractionDigits: 0,
            key: undefined,
            legendItemName: undefined,
            property: 'y',
            seriesId: undefined,
            source: 'axis-label',
            type: 'number',
            value: 0,
        });
        expect(yFormatter.mock.calls.at(-1)?.at(0)).toEqual({
            boundSeries: [
                {
                    key: 'value',
                    name: 'iPhone',
                    seriesId: 'BarSeries-1',
                },
            ],
            datum: {
                product: 'Mac',
                value: 20,
            },
            domain: [0, 140],
            fractionDigits: 2,
            key: 'value',
            legendItemName: undefined,
            property: 'y',
            seriesId: 'BarSeries-1',
            source: 'series-label',
            type: 'number',
            value: 20,
        });
    });

    it('should format pie series legend items', async () => {
        const options: AgPolarChartOptions = {
            data: [
                { product: 'iPhone', value: 140 },
                { product: 'Mac', value: 20 },
            ],
            series: [
                {
                    type: 'pie',
                    legendItemKey: 'product',
                    angleKey: 'value',
                    sectorLabelKey: 'product',
                    calloutLabelKey: 'product',
                },
            ],
            formatter: (params) => `${String(params.value)} (${params.source})`,
        };

        chart = AgCharts.create(prepareTestOptions(options));

        await waitForChartStability(chart);

        await compare();
    });

    it('should format by property', async () => {
        const options: AgCartesianChartOptions = {
            data: [
                { product: 'iPhone', value: 140, growth: 5 },
                { product: 'Mac', value: 20, growth: 10 },
            ],
            series: [
                {
                    type: 'bubble',
                    xKey: 'product',
                    yKey: 'value',
                    sizeKey: 'growth',
                    yName: 'iPhone',
                    label: {
                        enabled: true,
                    },
                },
            ],
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: { type: 'number', position: 'left' },
            },
            formatter: {
                x: () => 'x',
                y: () => 'y',
                size: () => 'size',
            },
        };

        chart = AgCharts.create(prepareTestOptions(options));

        await waitForChartStability(chart);

        await compare();
    });

    it('should format tooltips', async () => {
        const options: AgCartesianChartOptions = {
            data: [
                { product: 'iPhone', value: 140, growth: 5 },
                { product: 'Mac', value: 20, growth: 10 },
            ],
            series: [
                {
                    type: 'bubble',
                    xKey: 'product',
                    yKey: 'value',
                    sizeKey: 'growth',
                    yName: 'iPhone',
                    label: {
                        enabled: true,
                    },
                },
            ],
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: { type: 'number', position: 'left' },
            },
            formatter: {
                x: 'Apple %s',
                y: '#{f}',
                size: '#{f}',
            },
        };

        chart = AgCharts.create(prepareTestOptions(options));
        await waitForChartStability(chart);

        await hoverAction(250, 150)(chart);
        await waitForChartStability(chart);

        const element = getDocument('body').getElementsByClassName('ag-charts-tooltip')[0];
        expect(element.textContent).toMatchInlineSnapshot(`"product Apple iPhone iPhone 140.000 growth 5.000000"`);
    });
});
