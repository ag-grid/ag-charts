import { afterEach, describe, expect, it } from 'vitest';

import type { AgCartesianChartOptions, AgChartInstance } from 'ag-charts-community';
import {
    compareImageSnapshot,
    deproxy,
    expectPixelIdenticalAcrossUpdate,
    expectWarningsCalls,
    setupMockCanvas,
    setupMockConsole,
} from 'ag-charts-community-test';

import { createEnterpriseChart } from '../../test/utils';

const DATA = [
    { year: '2001', price: 24, volume: 13, size: 3 },
    { year: '2002', price: 26, volume: 10, size: 5 },
    { year: '2003', price: 23, volume: 12, size: 4 },
    { year: '2004', price: 29, volume: 8, size: 7 },
    { year: '2005', price: 31, volume: 15, size: 6 },
];

describe('InsetNumberAxis', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    let chart: AgChartInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const volumeOptions = (yVolume: object): AgCartesianChartOptions => ({
        data: DATA,
        series: [
            { type: 'line', xKey: 'year', yKey: 'price' },
            { type: 'bar', xKey: 'year', yKey: 'volume', yKeyAxis: 'yVolume' },
        ],
        axes: {
            x: { type: 'category', position: 'bottom' },
            y: { type: 'number', position: 'right' },
            yVolume: { type: 'inset-number', position: 'left', lengthRatio: 0.25, ...yVolume },
        },
    });

    const scatterOptions = (x: object): AgCartesianChartOptions => ({
        data: DATA,
        series: [{ type: 'scatter', xKey: 'price', yKey: 'volume' }],
        axes: {
            x: { type: 'inset-number', position: 'bottom', lengthRatio: 0.5, ...x },
            y: { type: 'number', position: 'left' },
        },
    });

    const domainEndPixels = async (options: AgCartesianChartOptions, key: string) => {
        chart = await createEnterpriseChart(options);
        const internal = deproxy(chart);
        const axis = internal.axes.find((a) => a.userKey === key);
        expect(axis).toBeDefined();
        const { scale } = axis!;
        const domain = scale.domain as number[];
        const [min, max] = [Math.min(...domain), Math.max(...domain)];
        const { width, height } = internal.seriesRect!;
        return { min: scale.convert(min), max: scale.convert(max), width, height };
    };

    it.each([
        ['a vertical axis at the bottom', volumeOptions({}), 'yVolume', 'height', [1, 0.75]],
        ['a reversed vertical axis at the top', volumeOptions({ reverse: true }), 'yVolume', 'height', [0, 0.25]],
        ['a horizontal axis at the left', scatterOptions({}), 'x', 'width', [0, 0.5]],
        ['a reversed horizontal axis at the right', scatterOptions({ reverse: true }), 'x', 'width', [1, 0.5]],
    ] as const)('should anchor %s', async (_name, options, key, length, [minRatio, maxRatio]) => {
        const pixels = await domainEndPixels(options, key);

        expect(pixels.min).toBeCloseTo(pixels[length] * minRatio);
        expect(pixels.max).toBeCloseTo(pixels[length] * maxRatio);
    });

    // Shown axis parts mark each band; `max` below the data shows the clip at the band edge.
    const shownInsetAxis = (title: string) => ({
        title: { text: title },
        label: { enabled: true },
        line: { enabled: true },
        gridLine: { enabled: true },
    });

    it('should lay vertical inset axes and their series out along their bands', async () => {
        chart = await createEnterpriseChart({
            data: DATA,
            series: [
                { type: 'line', xKey: 'year', yKey: 'price' },
                { type: 'bar', xKey: 'year', yKey: 'volume', yKeyAxis: 'yBottom' },
                { type: 'bar', xKey: 'year', yKey: 'size', yKeyAxis: 'yTop' },
            ],
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: { type: 'number', position: 'left' },
                yBottom: {
                    type: 'inset-number',
                    position: 'left',
                    lengthRatio: 0.3,
                    ...shownInsetAxis('Bottom'),
                    crossLines: [{ type: 'range', range: [9, 11] }],
                },
                yTop: {
                    type: 'inset-number',
                    position: 'left',
                    lengthRatio: 0.3,
                    reverse: true,
                    max: 6,
                    ...shownInsetAxis('Top'),
                },
            },
        });

        await compareImageSnapshot(chart, ctx);
    });

    it('should lay horizontal inset axes and their series out along their bands', async () => {
        chart = await createEnterpriseChart({
            data: DATA,
            series: [
                { type: 'bar', direction: 'horizontal', xKey: 'year', yKey: 'volume', yKeyAxis: 'xStart' },
                { type: 'bar', direction: 'horizontal', xKey: 'year', yKey: 'size', yKeyAxis: 'xEnd' },
            ],
            axes: {
                y: { type: 'category', position: 'left' },
                xStart: { type: 'inset-number', position: 'bottom', lengthRatio: 0.4, ...shownInsetAxis('Start') },
                xEnd: {
                    type: 'inset-number',
                    position: 'top',
                    lengthRatio: 0.4,
                    reverse: true,
                    max: 6,
                    ...shownInsetAxis('End'),
                },
            },
        });

        await compareImageSnapshot(chart, ctx);
    });

    it('should stop clipping series to the band once the axis is a number axis again', async () => {
        const options = (inset: boolean): AgCartesianChartOptions => ({
            data: DATA,
            series: [{ type: 'line', xKey: 'price', yKey: 'volume' }],
            axes: {
                x: { type: 'number', position: 'bottom' },
                y: inset
                    ? { type: 'inset-number', position: 'left', max: 30, lengthRatio: 0.5 }
                    : { type: 'number', position: 'left', max: 30, nice: false },
            },
        });

        await expectPixelIdenticalAcrossUpdate(
            ctx,
            createEnterpriseChart,
            options(false),
            options(true),
            options(false)
        );
    });

    it('should keep the series area padding when clipping to a full-length band', async () => {
        const options = (inset: boolean): AgCartesianChartOptions => ({
            data: DATA,
            seriesArea: { padding: { left: 20, right: 20, top: 20, bottom: 20 } },
            series: [{ type: 'line', xKey: 'price', yKey: 'volume', marker: { size: 40 } }],
            axes: {
                x: inset
                    ? { type: 'inset-number', position: 'bottom', lengthRatio: 1 }
                    : {
                          type: 'number',
                          position: 'bottom',
                          nice: false,
                          label: { enabled: false },
                          gridLine: { enabled: false },
                      },
                y: { type: 'number', position: 'left', max: 12 },
            },
        });

        await expectPixelIdenticalAcrossUpdate(ctx, createEnterpriseChart, options(false), options(true));
    });

    it('should require lengthRatio', async () => {
        chart = await createEnterpriseChart(volumeOptions({ lengthRatio: undefined }));

        expectWarningsCalls().toMatchInlineSnapshot(`
          [
            [
              "AG Charts - Option \`axes.yVolume.lengthRatio\` is required and has not been provided; expecting a number between 0 and 1 inclusive, ignoring.",
            ],
          ]
        `);
    });
});
