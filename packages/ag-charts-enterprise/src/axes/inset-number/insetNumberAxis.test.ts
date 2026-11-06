import { afterEach, describe, expect, it } from 'vitest';

import type { AgCartesianChartOptions, AgChartInstance } from 'ag-charts-community';
import {
    clickAction,
    compareImageSnapshot,
    deproxy,
    dragAction,
    expectPixelIdenticalAcrossUpdate,
    expectWarningsCalls,
    hoverAction,
    isTooltipVisible,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import type { Rect } from 'ag-charts-core';

import { createEnterpriseChart, itemNodes } from '../../test/utils';

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

    it('should stack horizontal inset axes at one position even when their bands do not overlap', async () => {
        chart = await createEnterpriseChart({
            data: DATA,
            series: [
                { type: 'bar', direction: 'horizontal', xKey: 'year', yKey: 'volume', yKeyAxis: 'xStart' },
                { type: 'bar', direction: 'horizontal', xKey: 'year', yKey: 'size', yKeyAxis: 'xEnd' },
            ],
            axes: {
                y: { type: 'category', position: 'left' },
                xStart: { type: 'inset-number', position: 'bottom', lengthRatio: 0.5, ...shownInsetAxis('Start') },
                xEnd: {
                    type: 'inset-number',
                    position: 'bottom',
                    lengthRatio: 0.5,
                    reverse: true,
                    max: 6,
                    ...shownInsetAxis('End'),
                },
            },
        });

        await compareImageSnapshot(chart, ctx);
    });

    it('should tile profile bars one level step each, clipped to the series area and formatted as the price', async () => {
        const axisLabels = new Set<string>();
        chart = await createEnterpriseChart({
            data: DATA,
            formatter: ({ source, property, boundSeries }) => {
                if (source === 'axis-label')
                    axisLabels.add(`${property}: ${boundSeries.map((s) => s.seriesId).join()}`);
                return undefined;
            },
            series: [
                { id: 'price', type: 'line', xKey: 'year', yKey: 'price' },
                {
                    id: 'profile',
                    type: 'bar',
                    direction: 'horizontal',
                    data: [20, 22, 24, 26, 28, 30, 32, 34, 36].map((price, i) => ({
                        price,
                        volume: 3 + ((i * 5) % 7),
                    })),
                    xKey: 'price',
                    yKey: 'volume',
                    yKeyAxis: 'xProfile',
                },
            ],
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: { type: 'number', position: 'right' },
                xProfile: { type: 'inset-number', position: 'top', lengthRatio: 0.4, reverse: true },
            },
        });

        await compareImageSnapshot(chart, ctx);

        await chart.updateDelta({ axes: { xProfile: { label: { enabled: true } } } });
        await waitForChartStability(chart);
        expect([...axisLabels].sort((a, b) => a.localeCompare(b))).toEqual(['x: price', 'y: price', 'y: profile']);
    });

    it('should tile profile bars edge to edge on a log price axis', async () => {
        chart = await createEnterpriseChart({
            data: DATA,
            series: [
                {
                    type: 'bar',
                    direction: 'horizontal',
                    data: [20, 22, 24, 26, 28, 30, 32].map((price, i) => ({ price, volume: 3 + i })),
                    xKey: 'price',
                    yKey: 'volume',
                    yKeyAxis: 'xProfile',
                },
                { type: 'line', xKey: 'year', yKey: 'price' },
            ],
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: { type: 'log', position: 'right', nice: false, min: 19, max: 33 },
                xProfile: { type: 'inset-number', position: 'top', lengthRatio: 0.4, reverse: true },
            },
        });

        const spans = itemNodes<Rect>(chart)
            .map(({ y, height }) => [y, y + height])
            .sort(([a], [b]) => a - b);
        expect(spans).toHaveLength(7);
        for (let i = 1; i < spans.length; i++) {
            expect(spans[i][0]).toBeCloseTo(spans[i - 1][1]);
        }
        expect(spans[0][1] - spans[0][0]).not.toBeCloseTo(spans.at(-1)![1] - spans.at(-1)![0]);
    });

    it('should keep ordinary bar widths on an inset axis over a time axis', async () => {
        chart = await createEnterpriseChart({
            data: DATA.map((d, i) => ({ ...d, date: new Date(2024, 0, 1 + i) })),
            series: [
                { type: 'line', xKey: 'date', yKey: 'price' },
                { type: 'bar', xKey: 'date', yKey: 'volume', yKeyAxis: 'yVolume' },
            ],
            axes: {
                x: { type: 'time', position: 'bottom' },
                y: { type: 'number', position: 'right' },
                yVolume: { type: 'inset-number', position: 'left', lengthRatio: 0.25 },
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

    it('should clip the fill of an area series overrunning its band', async () => {
        chart = await createEnterpriseChart({
            data: DATA,
            series: [
                { type: 'line', xKey: 'year', yKey: 'price' },
                { type: 'area', xKey: 'year', yKey: 'volume', yKeyAxis: 'yVolume' },
            ],
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: { type: 'number', position: 'right' },
                yVolume: { type: 'inset-number', position: 'left', lengthRatio: 0.25, max: 10 },
            },
        });

        await compareImageSnapshot(chart, ctx);
    });

    it('should leave series unclipped past their band while the series area is unclipped', async () => {
        chart = await createEnterpriseChart({
            data: DATA,
            series: [
                { type: 'line', xKey: 'year', yKey: 'price' },
                {
                    type: 'bar',
                    xKey: 'year',
                    yKey: 'volume',
                    yKeyAxis: 'yVolume',
                    label: { enabled: true, placement: 'outside-end', fontSize: 24 },
                },
            ],
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: { type: 'number', position: 'right' },
                yVolume: { type: 'inset-number', position: 'left', lengthRatio: 0.25 },
            },
        });

        await compareImageSnapshot(chart, ctx);
    });

    describe('outside the band', () => {
        const clicked: unknown[] = [];

        // The 2005 bar (15) overruns the band's max of 10 up to 37.5% of the height; the band holds the bottom 25%.
        const createOverrunChart = async () => {
            clicked.length = 0;
            const created = await createEnterpriseChart({
                data: DATA,
                title: { text: 'Volume', fontSize: 60 },
                selection: { enabled: true, enableDrag: true },
                series: [
                    {
                        type: 'bar',
                        xKey: 'year',
                        yKey: 'volume',
                        yKeyAxis: 'yVolume',
                        selection: { enabled: true },
                        listeners: { seriesNodeClick: ({ datum }) => clicked.push(datum.year) },
                    },
                ],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    yVolume: { type: 'inset-number', position: 'left', lengthRatio: 0.25, max: 10 },
                },
            });
            chart = created;
            const internal = deproxy(created);
            const xScale = internal.axes.find((a) => a.userKey === 'x')!.scale;
            const { x, y, height } = internal.seriesRect!;
            expect(y).toBeGreaterThan(height * 0.1);
            return {
                created,
                internal,
                barX: x + xScale.convert('2005') + (xScale.bandwidth ?? 0) / 2,
                above: y + height * 0.7,
                outside: y + height * 0.73,
                inside: y + height * 0.77,
            };
        };

        it('should not pick the part of a series clipped outside its band', async () => {
            const { created, internal, barX, outside, inside } = await createOverrunChart();

            await hoverAction(barX, outside)(created);
            expect(isTooltipVisible(internal)).toBe(false);

            await hoverAction(barX, inside)(created);
            expect(isTooltipVisible(internal)).toBe(true);

            await clickAction(barX, outside)(created);
            expect(clicked).toEqual([]);

            await clickAction(barX, inside)(created);
            expect(clicked).toEqual(['2005']);
        });

        it('should not drag-select the part of a series clipped outside its band', async () => {
            const { created, barX, above, outside, inside } = await createOverrunChart();

            await dragAction({ x: barX - 2, y: above }, { x: barX + 2, y: outside })(created);
            await waitForChartStability(created);
            expect([...created.getSelection()]).toHaveLength(0);

            await dragAction({ x: barX - 2, y: above }, { x: barX + 2, y: inside })(created);
            await waitForChartStability(created);
            expect([...created.getSelection()]).toHaveLength(1);
        });
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
