import { afterEach, describe, it, vi } from 'vitest';

import { AgCharts } from 'ag-charts-community';
import {
    type ChartOrProxy,
    INTEGRATED_CHARTS_GROUPED_CATEGORY_AXIS_WITH_MINI_CHART_EXAMPLE,
    cartesianChartAssertions,
    compareImageSnapshot,
    repeat,
    reverseAxes,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
    Chart,
    clickAction,
    hoverAction,
    contextMenuAction,
} from 'ag-charts-community-test';
import { Point, mapValues } from 'ag-charts-core';
import type {
    AgBaseChartOptions,
    AgCartesianAxisPosition,
    AgCartesianAxisType,
    AgCartesianChartOptions,
    AgContextMenuGetItemsParams,
    AgPolarChartOptions,
} from 'ag-charts-types';

import { prepareEnterpriseTestOptions } from '../test/utils';

function applyRotation<T extends AgCartesianChartOptions | AgPolarChartOptions>(opts: T, rotation: number): T {
    return {
        ...opts,
        axes: mapValues(opts.axes ?? {}, (axis) => ({
            ...axis,
            label: { ...axis.label, rotation, avoidCollisions: false },
        })),
    };
}

function applyAxesFlip<T extends AgCartesianChartOptions>(opts: T): T {
    const positionFlip = (position?: AgCartesianAxisPosition) => {
        switch (position) {
            case 'top':
                return 'bottom';
            case 'left':
                return 'right';
            case 'bottom':
                return 'top';
            case 'right':
                return 'left';
            default:
                return position;
        }
    };

    return {
        ...opts,
        axes: mapValues(opts.axes ?? {}, (axis) => ({ ...axis, position: positionFlip(axis.position) })) ?? undefined,
    };
}

type TestCase<T extends AgBaseChartOptions = AgCartesianChartOptions> = {
    options: T;
    assertions: (chart: ChartOrProxy) => Promise<void> | void;
    extraScreenshotActions?: (chart: ChartOrProxy) => Promise<void>;
    compare?: AgCartesianAxisType[];
};

const EXAMPLES: Record<string, TestCase> = {
    ...mixinDerivedCases({
        INTEGRATED_CHARTS_GROUPED_CATEGORY_AXIS_WITH_MINI_CHART_EXAMPLE: {
            options: INTEGRATED_CHARTS_GROUPED_CATEGORY_AXIS_WITH_MINI_CHART_EXAMPLE,
            assertions: cartesianChartAssertions({
                axisTypes: { x: 'grouped-category', y: 'number' },
                seriesTypes: repeat('bar', 3),
            }),
            compare: ['grouped-category'],
        },
    }),
};

function mixinDerivedCases<T extends AgBaseChartOptions>(
    baseCases: Record<string, TestCase<T>>
): Record<string, TestCase<T>> {
    const result = { ...baseCases };

    for (const [name, baseCase] of Object.entries(baseCases)) {
        // Add manual rotation.
        result[name + '_MANUAL_ROTATION'] = {
            ...baseCase,
            options: applyRotation(baseCase.options, -30),
        };

        // Add flipped axes.
        result[name + '_FLIP'] = {
            ...baseCase,
            options: applyAxesFlip(baseCase.options),
        };

        result[name + '_REVERSED_AXES'] = {
            ...baseCase,
            options: reverseAxes(baseCase.options, true),
        };
    }

    return result;
}

describe('Grouped Category Axis Examples', () => {
    setupMockConsole();

    let chart: ChartOrProxy;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    for (const [exampleName, example] of Object.entries(EXAMPLES)) {
        it(`for ${exampleName} it should create chart instance as expected`, async () => {
            const options = prepareEnterpriseTestOptions(example.options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            await example.assertions(chart);
        });

        it(`for ${exampleName} it should render to canvas as expected`, async () => {
            const options = prepareEnterpriseTestOptions(example.options);
            chart = AgCharts.create(options);
            await compareImageSnapshot(chart, ctx);
        });
    }
});

describe('Grouped Category', () => {
    setupMockCanvas();
    setupMockConsole();
    let chart: Chart;

    function measureBandCentres(count: number): number[] {
        const elem = document.querySelector('.ag-charts-series-area');
        if (!(elem instanceof HTMLElement)) throw new Error('series area not found');
        const left = Number.parseInt(elem.style.left);
        const width = Number.parseInt(elem.style.width);
        return Array.from({ length: count }, (_, i) => left + (width * (i + 0.5)) / count);
    }

    afterEach(() => {
        chart?.destroy();
    });

    describe('AG-18185 callback standardisation', () => {
        let formatter: ReturnType<typeof vi.fn>;
        let click: ReturnType<typeof vi.fn>;
        let seriesNodeClick: ReturnType<typeof vi.fn>;
        let action: ReturnType<typeof vi.fn>;
        let getItems: ReturnType<typeof vi.fn>;

        const clickPoint = async ({ x, y }: Readonly<Point>) => await clickAction(x, y)(chart);
        const hoverPoint = async ({ x, y }: Readonly<Point>) => await hoverAction(x, y)(chart);
        const contextMenuPoint = async ({ x, y }: Readonly<Point>) => await contextMenuAction(x, y)(chart);
        const params = (p: object) => [expect.objectContaining(p)];
        const coords = (p: object) => [
            expect.objectContaining({
                coordinates: expect.objectContaining({ x: expect.objectContaining(p) }),
            }),
        ];

        beforeEach(async () => {
            formatter = vi.fn();
            click = vi.fn();
            seriesNodeClick = vi.fn();
            action = vi.fn();
            getItems = vi.fn((_getItemsParams: AgContextMenuGetItemsParams) => {
                return [
                    {
                        type: 'action',
                        showOn: 'always',
                        label: 'Run action (always)',
                        action,
                    },
                    {
                        type: 'action',
                        showOn: 'series-node',
                        label: 'Run action (series-node)',
                        action,
                    },
                    {
                        type: 'action',
                        showOn: 'axis',
                        label: 'Run action (axis)',
                        action,
                    },
                ];
            });
            chart = await createEnterpriseChart({
                data: [
                    { y: 10, x: ['Food', 'Meat', 'Fish'] },
                    { y: 10, x: ['Food', 'Meat', 'Chicken'] },
                    { y: 10, x: ['Food', 'Fruit', 'Banana'] },
                    { y: 10, x: ['Food', 'Fruit', 'Apple'] },
                    { y: 10, x: ['Drink', 'Soda', 'Coke'] },
                    { y: 10, x: ['Drink', 'Soda', 'Pepsi'] },
                    { y: 10, x: ['Drink', 'Tea', 'Green'] },
                ],
                axes: {
                    x: {
                        type: 'grouped-category',
                        depthOptions: [{}, {}, {}],
                        label: { formatter },
                        listeners: { click },
                    },
                },
                zoom: { enabled: true },
                contextMenu: {                    getItems                },
                series: [{ type: 'bar', xKey: 'x', yKey: 'y', listeners: { seriesNodeClick } }],
            });
        });

        test('formatter (init)', () => {
            // formatter callbacks should have formattedValue:undefined, because that is what is being calculated.
            expect(formatter.mock.calls).toMatchObject([
                params({ depth: 2, index: 0, value: ['Food', 'Meat', 'Fish'], formattedValue: undefined }),
                params({ depth: 1, index: 1, value: ['Food', 'Meat', 'Fish'], formattedValue: undefined }),
                params({ depth: 0, index: 2, value: ['Food', 'Meat', 'Fish'], formattedValue: undefined }),
                params({ depth: 0, index: 3, value: ['Food', 'Meat', 'Chicken'], formattedValue: undefined }),
                params({ depth: 1, index: 4, value: ['Food', 'Fruit', 'Banana'], formattedValue: undefined }),
                params({ depth: 0, index: 5, value: ['Food', 'Fruit', 'Banana'], formattedValue: undefined }),
                params({ depth: 0, index: 6, value: ['Food', 'Fruit', 'Apple'], formattedValue: undefined }),
                params({ depth: 2, index: 7, value: ['Drink', 'Soda', 'Coke'], formattedValue: undefined }),
                params({ depth: 1, index: 8, value: ['Drink', 'Soda', 'Coke'], formattedValue: undefined }),
                params({ depth: 0, index: 9, value: ['Drink', 'Soda', 'Coke'], formattedValue: undefined }),
                params({ depth: 0, index: 10, value: ['Drink', 'Soda', 'Pepsi'], formattedValue: undefined }),
                params({ depth: 1, index: 11, value: ['Drink', 'Tea', 'Green'], formattedValue: undefined }),
                params({ depth: 0, index: 12, value: ['Drink', 'Tea', 'Green'], formattedValue: undefined }),
                params({ depth: 2, index: 0, value: ['Food', 'Meat', 'Fish'], formattedValue: undefined }),
                params({ depth: 1, index: 1, value: ['Food', 'Meat', 'Fish'], formattedValue: undefined }),
                params({ depth: 0, index: 2, value: ['Food', 'Meat', 'Fish'], formattedValue: undefined }),
                params({ depth: 0, index: 3, value: ['Food', 'Meat', 'Chicken'], formattedValue: undefined }),
                params({ depth: 1, index: 4, value: ['Food', 'Fruit', 'Banana'], formattedValue: undefined }),
                params({ depth: 0, index: 5, value: ['Food', 'Fruit', 'Banana'], formattedValue: undefined }),
                params({ depth: 0, index: 6, value: ['Food', 'Fruit', 'Apple'], formattedValue: undefined }),
                params({ depth: 2, index: 7, value: ['Drink', 'Soda', 'Coke'], formattedValue: undefined }),
                params({ depth: 1, index: 8, value: ['Drink', 'Soda', 'Coke'], formattedValue: undefined }),
                params({ depth: 0, index: 9, value: ['Drink', 'Soda', 'Coke'], formattedValue: undefined }),
                params({ depth: 0, index: 10, value: ['Drink', 'Soda', 'Pepsi'], formattedValue: undefined }),
                params({ depth: 1, index: 11, value: ['Drink', 'Tea', 'Green'], formattedValue: undefined }),
                params({ depth: 0, index: 12, value: ['Drink', 'Tea', 'Green'], formattedValue: undefined }),
            ]);
        });

        test('label click', async () => {
            await clickPoint({ x: 257, y: 572 }); // 'Food'
            await clickPoint({ x: 150, y: 545 }); // 'Meat'
            await clickPoint({ x: 100, y: 493 }); // 'Fish'
            await clickPoint({ x: 205, y: 495 }); // 'Chicken'
            await clickPoint({ x: 364, y: 548 }); // 'Fruit'
            await clickPoint({ x: 309, y: 500 }); // 'Banana'
            await clickPoint({ x: 412, y: 499 }); // 'Apple'
            await clickPoint({ x: 621, y: 571 }); // 'Drink'
            await clickPoint({ x: 569, y: 545 }); // 'Soda'
            await clickPoint({ x: 519, y: 499 }); // 'Coke'
            await clickPoint({ x: 624, y: 494 }); // 'Pepsi'
            await clickPoint({ x: 729, y: 549 }); // 'Tea'
            await clickPoint({ x: 727, y: 502 }); // 'Green'
            await waitForChartStability(chart);
            expect(click.mock.calls).toMatchObject([
                params({ depth: 2, index: 0, value: ['Food', 'Meat', 'Fish'], formattedValue: 'Food' }),
                params({ depth: 1, index: 1, value: ['Food', 'Meat', 'Fish'], formattedValue: 'Meat' }),
                params({ depth: 0, index: 2, value: ['Food', 'Meat', 'Fish'], formattedValue: 'Fish' }),
                params({ depth: 0, index: 3, value: ['Food', 'Meat', 'Chicken'], formattedValue: 'Chicken' }),
                params({ depth: 1, index: 4, value: ['Food', 'Fruit', 'Banana'], formattedValue: 'Fruit' }),
                params({ depth: 0, index: 5, value: ['Food', 'Fruit', 'Banana'], formattedValue: 'Banana' }),
                params({ depth: 0, index: 6, value: ['Food', 'Fruit', 'Apple'], formattedValue: 'Apple' }),
                params({ depth: 2, index: 7, value: ['Drink', 'Soda', 'Coke'], formattedValue: 'Drink' }),
                params({ depth: 1, index: 8, value: ['Drink', 'Soda', 'Coke'], formattedValue: 'Soda' }),
                params({ depth: 0, index: 9, value: ['Drink', 'Soda', 'Coke'], formattedValue: 'Coke' }),
                params({ depth: 0, index: 10, value: ['Drink', 'Soda', 'Pepsi'], formattedValue: 'Pepsi' }),
                params({ depth: 1, index: 11, value: ['Drink', 'Tea', 'Green'], formattedValue: 'Tea' }),
                params({ depth: 0, index: 12, value: ['Drink', 'Tea', 'Green'], formattedValue: 'Green' }),
            ]);
        });

        test('label contextMenu - getItems', async () => {
        });

        test('label contextMenu - action', async () => {
        });

        test('series-node hover', async () => {
            formatter.mockClear();
            for (const x of measureBandCentres(7)) {
                await hoverPoint({ x, y: 300 });
            }
            expect(formatter.mock.calls).toMatchObject([
                params({ depth: 0, index: 2, value: ['Food', 'Meat', 'Fish'], formattedValue: 'Fish' }),
                params({ depth: 0, index: 3, value: ['Food', 'Meat', 'Chicken'], formattedValue: 'Chicken' }),
                params({ depth: 0, index: 5, value: ['Food', 'Fruit', 'Banana'], formattedValue: 'Banana' }),
                params({ depth: 0, index: 6, value: ['Food', 'Fruit', 'Apple'], formattedValue: 'Apple' }),
                params({ depth: 0, index: 9, value: ['Drink', 'Soda', 'Coke'], formattedValue: 'Coke' }),
                params({ depth: 0, index: 10, value: ['Drink', 'Soda', 'Pepsi'], formattedValue: 'Pepsi' }),
                params({ depth: 0, index: 12, value: ['Drink', 'Tea', 'Green'], formattedValue: 'Green' }),
            ]);
        });

        test('series-node click', async () => {
            for (const x of measureBandCentres(7)) {
                await clickPoint({ x, y: 300 });
            }
            expect(seriesNodeClick.mock.calls).toMatchObject([
                coords({ depth: 0, index: 2, value: ['Food', 'Meat', 'Fish'], formattedValue: 'Fish' }),
                coords({ depth: 0, index: 3, value: ['Food', 'Meat', 'Chicken'], formattedValue: 'Chicken' }),
                coords({ depth: 0, index: 5, value: ['Food', 'Fruit', 'Banana'], formattedValue: 'Banana' }),
                coords({ depth: 0, index: 6, value: ['Food', 'Fruit', 'Apple'], formattedValue: 'Apple' }),
                coords({ depth: 0, index: 9, value: ['Drink', 'Soda', 'Coke'], formattedValue: 'Coke' }),
                coords({ depth: 0, index: 10, value: ['Drink', 'Soda', 'Pepsi'], formattedValue: 'Pepsi' }),
                coords({ depth: 0, index: 12, value: ['Drink', 'Tea', 'Green'], formattedValue: 'Green' }),
            ]);
        });

        test('series-node contextMenu - getItems', async () => {
        });

        test('series-node contextMenu - action', async () => {
        });
    });
});
