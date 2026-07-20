import { type Image as SkiaImage, loadImage as skiaLoadImage } from 'skia-canvas';
import { afterEach, beforeAll, describe, it } from 'vitest';

import { mapValues } from 'ag-charts-core';
import type { AgBaseChartOptions, AgCartesianAxisType, AgCartesianChartOptions } from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import type { Chart } from '../chart';
import { DOCS_EXAMPLES } from '../test/examples';
import type { ChartOrProxy } from '../test/utils';
import {
    cartesianChartAssertions,
    compareImageSnapshot,
    createChart,
    deproxy,
    prepareTestOptions,
    repeat,
    setupMockCanvas,
    setupMockConsole,
} from '../test/utils';

const EXAMPLE_GRID_LINE = {
    width: 2,
    style: [
        { fill: 'red', fillOpacity: 0.1, stroke: 'red' },
        { fill: 'blue', fillOpacity: 0.1, stroke: 'blue' },
        { fill: 'green', fillOpacity: 0.1, stroke: 'green' },
        { fill: 'yellow', fillOpacity: 0.1, stroke: 'yellow' },
    ],
};

const axesToTest = ['category', 'grouped-category', 'unit-time', 'ordinal-time'];

function applyIntervalOn<T extends AgCartesianChartOptions>(opts: T): T {
    return {
        ...opts,
        axes:
            mapValues(opts.axes ?? {}, (axis) =>
                axis.type && axesToTest.includes(axis.type)
                    ? {
                          ...axis,
                          interval: { ...(axis.interval ?? {}), placement: 'on' },
                          gridLine: EXAMPLE_GRID_LINE,
                          tick: { ...(axis.tick ?? {}), enabled: true },
                      }
                    : axis
            ) ?? undefined,
    };
}

function applyIntervalBetween<T extends AgCartesianChartOptions>(opts: T): T {
    return {
        ...opts,
        axes:
            mapValues(opts.axes ?? {}, (axis) =>
                axis.type && axesToTest.includes(axis.type)
                    ? {
                          ...axis,
                          interval: { ...(axis.interval ?? {}), placement: 'between' },
                          gridLine: EXAMPLE_GRID_LINE,
                          tick: { ...(axis.tick ?? {}), enabled: true },
                      }
                    : axis
            ) ?? undefined,
    };
}

const DATA = [
    {
        date: new Date('Wednesday, July 28, 2023'),
        open: 4344.88,
    },
    {
        date: new Date('Thursday, July 27, 2023'),
        open: 4380.28,
    },
    {
        date: new Date('Friday, July 28, 2023'),
        open: 4415.33,
    },
    {
        date: new Date('Saturday, July 29, 2023'),
        open: 4396.44,
    },
    {
        date: new Date('Sunday, July 30, 2023'),
        open: 4455.16,
    },
    {
        date: new Date('Monday, July 31, 2023'),
        open: 4584.82,
    },
    {
        date: new Date('Tuesday, August 01, 2023'),
        open: 4578.83,
    },
    {
        date: new Date('Wednesday, August 02, 2023'),
        open: 4550.93,
    },
    {
        date: new Date('Thursday, August 03, 2023'),
        open: 4494.27,
    },
    {
        date: new Date('Friday, August 04, 2023'),
        open: 4513.96,
    },
    {
        date: new Date('Monday, August 07, 2023'),
        open: 4491.58,
    },
    {
        date: new Date('Tuesday, August 08, 2023'),
        open: 4498.03,
    },
    {
        date: new Date('Wednesday, August 09, 2023'),
        open: 4501.57,
    },
    {
        date: new Date('Thursday, August 10, 2023'),
        open: 4487.16,
    },
    {
        date: new Date('Friday, August 11, 2023'),
        open: 4450.69,
    },
    {
        date: new Date('Monday, August 14, 2023'),
        open: 4458.13,
    },
    {
        date: new Date('Tuesday, August 15, 2023'),
        open: 4478.87,
    },
    {
        date: new Date('Wednesday, August 16, 2023'),
        open: 4433.79,
    },
    {
        date: new Date('Thursday, August 17, 2023'),
        open: 4416.32,
    },
];

const BASIC_TIME_AXIS_EXAMPLE: AgCartesianChartOptions = {
    data: DATA,
    axes: {
        x: { type: 'unit-time', position: 'bottom', unit: 'day' },
        y: { type: 'number', position: 'left' },
    },
    series: [
        {
            xKey: 'date',
            xName: 'Date',
            yKey: 'open',
            yName: 'Open Price',
            type: 'bar',
        },
    ],
};

type TestCase<T extends AgBaseChartOptions = AgCartesianChartOptions> = {
    options: T;
    assertions: (chart: ChartOrProxy) => Promise<void> | void;
    extraScreenshotActions?: (chart: ChartOrProxy) => Promise<void>;
    compare?: AgCartesianAxisType[];
};

const EXAMPLES: Record<string, TestCase> = {
    CATEGORY_AXIS_INTERVAL_ON: {
        options: applyIntervalOn(DOCS_EXAMPLES['grouped-column']),
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'category', y: 'number' },
            seriesTypes: repeat('bar', 7),
        }),
    },
    CATEGORY_AXIS_INTERVAL_BETWEEN: {
        options: applyIntervalBetween(DOCS_EXAMPLES['grouped-column']),
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'category', y: 'number' },
            seriesTypes: repeat('bar', 7),
        }),
    },
    CATEGORY_AXIS_HORIZONTAL_INTERVAL_ON: {
        options: applyIntervalOn(DOCS_EXAMPLES['grouped-bar']),
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'number', y: 'category' },
            seriesTypes: ['bar', 'bar'],
        }),
    },
    CATEGORY_AXIS_HORIZONTAL_INTERVAL_BETWEEN: {
        options: applyIntervalBetween(DOCS_EXAMPLES['grouped-bar']),
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'number', y: 'category' },
            seriesTypes: ['bar', 'bar'],
        }),
    },
    UNIT_TIME_AXIS_INTERVAL_ON: {
        options: applyIntervalOn(BASIC_TIME_AXIS_EXAMPLE),
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'unit-time', y: 'number' },
            seriesTypes: ['bar'],
        }),
    },
    UNIT_TIME_INTERVAL_BETWEEN: {
        options: applyIntervalBetween(BASIC_TIME_AXIS_EXAMPLE),
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'unit-time', y: 'number' },
            seriesTypes: ['bar'],
        }),
    },
};

describe('Category Axis', () => {
    setupMockConsole();

    let chart: ChartOrProxy;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    const compare = async () => {
        await compareImageSnapshot(chart, ctx);
    };

    for (const [exampleName, example] of Object.entries(EXAMPLES)) {
        it(`for ${exampleName} it should create chart instance as expected`, async () => {
            chart = await createChart(example.options);
            await example.assertions(chart);
        });

        it(`for ${exampleName} it should render to canvas as expected`, async () => {
            chart = await createChart(example.options);
            await compare();
        });
    }

    describe('block image labels', () => {
        // Axis label formatters may return `ContentSegment[]` (RichFormatter), so `block: true`
        // image segments reach the same Text shape used by treemap labels. These snapshots capture
        // block-image axis labels with and without rotation.
        const iconSvg = (letter: string, fill: string) =>
            `data:image/svg+xml;utf8,${encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">` +
                    `<rect x="1" y="1" width="30" height="30" rx="6" fill="${fill}"/>` +
                    `<text x="16" y="22" text-anchor="middle" font-family="Verdana" font-size="16"` +
                    ` fill="white" font-weight="bold">${letter}</text></svg>`
            )}`;
        const ICONS: Record<string, string> = {
            Mon: iconSvg('M', '#1f77b4'),
            Tue: iconSvg('T', '#ff7f0e'),
            Wed: iconSvg('W', '#2ca02c'),
            Thu: iconSvg('H', '#d62728'),
            inline: iconSvg('+', '#9467bd'),
        };

        let preloaded: Record<string, SkiaImage> = {};
        beforeAll(async () => {
            const entries = await Promise.all(
                Object.values(ICONS).map(async (url) => [url, await skiaLoadImage(url)] as const)
            );
            preloaded = Object.fromEntries(entries);
        });

        function stubChartImageLoader(chartInstance: Chart) {
            const imageLoader = (chartInstance.ctx.scene as any).imageLoader;
            imageLoader.loadImage = (uri: string) => preloaded[uri] as unknown as HTMLImageElement;
        }

        const DAY_DATA = [
            { day: 'Mon', value: 4 },
            { day: 'Tue', value: 7 },
            { day: 'Wed', value: 3 },
            { day: 'Thu', value: 6 },
        ];

        async function createStubbedChart(options: AgCartesianChartOptions) {
            chart = deproxy(AgCharts.create(prepareTestOptions({ ...options })) as any);
            stubChartImageLoader(chart);
            await compare();
        }

        const blockLabelAxes = (rotation?: number): AgCartesianChartOptions['axes'] => ({
            x: {
                type: 'category',
                position: 'bottom',
                label: {
                    rotation,
                    formatter: ({ value }) => [
                        { type: 'image', url: ICONS[value as string], width: 28, height: 28, block: true },
                        { text: `${value}` },
                    ],
                },
            },
            y: { type: 'number', position: 'left' },
        });

        it('renders block image labels on a horizontal category axis', async () => {
            await createStubbedChart({
                data: DAY_DATA,
                series: [{ type: 'bar', xKey: 'day', yKey: 'value' }],
                axes: blockLabelAxes(),
            });
        });

        it('renders block image labels rotated 45 degrees', async () => {
            await createStubbedChart({
                data: DAY_DATA,
                series: [{ type: 'bar', xKey: 'day', yKey: 'value' }],
                axes: blockLabelAxes(45),
            });
        });

        it('renders a block + inline image mix in an axis label', async () => {
            await createStubbedChart({
                data: DAY_DATA,
                series: [{ type: 'bar', xKey: 'day', yKey: 'value' }],
                axes: {
                    x: {
                        type: 'category',
                        position: 'bottom',
                        label: {
                            formatter: ({ value }) => [
                                { type: 'image', url: ICONS[value as string], width: 26, height: 26, block: true },
                                { text: `${value} ` },
                                { type: 'image', url: ICONS.inline, width: 16, height: 16, verticalAlign: 'middle' },
                            ],
                        },
                    },
                    y: { type: 'number', position: 'left' },
                },
            });
        });
    });
});
