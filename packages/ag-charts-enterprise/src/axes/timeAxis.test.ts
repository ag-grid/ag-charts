import { afterEach, describe, expect, it } from '@jest/globals';

import { AgCharts, _ModuleSupport } from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    deproxy,
    extractImageData,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import type { AgCartesianChartOptions } from 'ag-charts-types';

import { prepareEnterpriseTestOptions } from '../test/utils';

function calculateAxisBBox(axis: { getBBox(): _ModuleSupport.BBox }): {
    x: number;
    y: number;
    width: number;
    height: number;
} {
    const bbox = axis.getBBox();

    const { x, y, width, height } = bbox;
    return { x, y, width, height };
}

const TIME_AXIS_DATA = [];
for (let i = 0; i < 200; i++) {
    TIME_AXIS_DATA.push({
        date: new Date(2004, 3 + i, 1),
        'Tate Modern': 82215 + (i % 5) * 10_000,
    });
}

const TIME_AXIS_EXAMPLE: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Navigator Styling',
    },
    data: TIME_AXIS_DATA,
    series: [
        {
            type: 'bar',
            xKey: 'date',
            yKey: 'Tate Modern',
            fill: '#c16068',
            stroke: '#874349',
        },
    ],
    axes: [
        {
            type: 'unit-time',
            position: 'bottom',
            interval: {
                maxSpacing: 150,
            },
        },
        {
            type: 'number',
            position: 'left',
            label: {
                formatter: (params) => params.value / 1000 + 'k',
            },
        },
    ],
    navigator: {
        height: 50,
    },
};

describe('Time Axis Examples', () => {
    setupMockConsole();
    let chart: any;
    const ctx = setupMockCanvas();

    const compare = async () => {
        await waitForChartStability(chart);
        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    const axisCompare = async () => {
        await waitForChartStability(chart);

        for (const axis of deproxy(chart).axes) {
            if (!axis.type.endsWith('time')) continue;

            const axisBbox = calculateAxisBBox(axis);
            expect(axisBbox).toMatchSnapshot();

            const { width, height } = axisBbox;

            if (width >= 1 && height >= 1) {
                const imageData = extractImageData({ ...ctx, bbox: axisBbox });
                expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
            }
        }
    };

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    describe('when zooming', () => {
        const ZOOM_LEVELS: [number, number][] = [
            [0, 1],
            [0.2, 0.5],
            [0.25, 0.35],
            [0.3, 0.35],
            [0.35, 0.375],
            [0.4, 0.4125],
            [0.45, 0.45625],
        ];
        for (const [start, end] of ZOOM_LEVELS) {
            it(`for should render as expected as zoom [${start}, ${end}]`, async () => {
                chart = AgCharts.create(prepareEnterpriseTestOptions({ ...TIME_AXIS_EXAMPLE }));
                await chart.updateDelta({ initialState: { zoom: { ratioX: { start, end } } } });
                await axisCompare();
            });
        }
    });

    describe('AG-14639', () => {
        it('should apply label options to parent-label', async () => {
            const startPrice = 100;
            const maxDailyPriceChange = 1;

            function seedRandom(seed = 1337) {
                return function random() {
                    seed = (seed * 16807) % 2147483647;
                    return (seed - 1) / 2147483646;
                };
            }

            function getData(days: number) {
                let currentPrice = startPrice;
                const random = seedRandom();
                return Array.from({ length: days }, (_, i) => {
                    const price = currentPrice;
                    currentPrice += (random() * 2 - 1) * maxDailyPriceChange;
                    const date = new Date(2024, 0, -i);
                    return { date, price };
                }).reverse();
            }

            const options: AgCartesianChartOptions = {
                data: getData(800),
                series: [{ type: 'line', xKey: 'date', yKey: 'price' }],
                axes: [
                    {
                        type: 'unit-time',
                        position: 'bottom',
                        parentLevel: { enabled: true },
                        label: {
                            color: 'blue',
                            border: { strokeWidth: 2, stroke: 'red' },
                            fill: 'pink',
                            padding: 5,
                        },
                    },
                    { type: 'number', position: 'left' },
                ],
                zoom: { enabled: true },
                initialState: { zoom: { ratioX: { start: 0.95, end: 1 } } },
            };

            chart = AgCharts.create(prepareEnterpriseTestOptions(options));
            await compare();
        });
    });

    it('should prioritise parentLevel.tick over tick', async () => {
        chart = AgCharts.create(
            prepareEnterpriseTestOptions({
                ...TIME_AXIS_EXAMPLE,
                initialState: { zoom: { ratioX: { start: 0.2, end: 0.5 } } },
                axes: [
                    {
                        ...TIME_AXIS_EXAMPLE.axes![0],
                        parentLevel: {
                            tick: {
                                enabled: false,
                            },
                        },
                        tick: {
                            enabled: true,
                        },
                    },
                    TIME_AXIS_EXAMPLE.axes![1],
                ],
            })
        );
        await axisCompare();
    });
});
