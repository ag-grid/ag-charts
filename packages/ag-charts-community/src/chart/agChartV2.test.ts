import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { AgCartesianChartOptions, AgChartInstance, AgChartOptions } from '../options/agChartOptions';
import { AgCharts } from './agChartV2';
import type { Chart } from './chart';
import * as examples from './test/examples';
import type { TestCase } from './test/utils';
import { createChart } from './test/utils';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    cartesianChartAssertions,
    extractImageData,
    prepareTestOptions,
    repeat,
    setupMockCanvas,
    waitForChartStability,
} from './test/utils';

const EXAMPLES: Record<string, TestCase> = {
    TRUNCATED_LEGEND_ITEMS: {
        options: examples.TRUNCATED_LEGEND_ITEMS,
        assertions: cartesianChartAssertions({
            axisTypes: ['number', 'category'],
            seriesTypes: repeat('bar', 4),
        }),
    },
};

describe('AgChartV2', () => {
    const ctx = setupMockCanvas();
    let chart: AgChartInstance;
    let container: HTMLElement;

    beforeEach(() => {
        console.warn = jest.fn();
        console.error = jest.fn();
        container = document.createElement('div');
        document.body.append(container);
    });

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
        document.body.removeChild(container);
        expect(console.error).not.toBeCalled();
    });

    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    const snapshot = async () => {
        await waitForChartStability(chart);

        return ctx.nodeCanvas?.toBuffer('raw');
    };

    describe('#validation', () => {
        afterEach(() => {
            expect(console.error).not.toBeCalled();
        });

        describe('Series ID', () => {
            const data = [
                { quarter: "Q1'18", iphone: 140, mac: 16, ipad: 14, wearables: 12, services: 20 },
                { quarter: "Q2'18", iphone: 124, mac: 20, ipad: 14, wearables: 12, services: 30 },
                { quarter: "Q3'18", iphone: 112, mac: 20, ipad: 18, wearables: 14, services: 36 },
                { quarter: "Q4'18", iphone: 118, mac: 24, ipad: 14, wearables: 14, services: 36 },
            ];

            const expectWarnings = (warnings: string[]) => {
                expect(console.warn).toBeCalledTimes(warnings.length);
                for (let i = 0; i < warnings.length; i++) {
                    expect(console.warn).nthCalledWith(i + 1, warnings[i]);
                }
            };

            test('single duplicate', async () => {
                chart = await createChart({
                    data,
                    series: [
                        { id: 'myId', xKey: 'quarter', yKey: 'iphone' },
                        { id: 'myId', xKey: 'quarter', yKey: 'mac' },
                    ],
                });
                expectWarnings([`AG Charts - series[1].id "myId" ignored because it duplicates series[0].id`]);
            });

            test('two duplicates', async () => {
                chart = await createChart({
                    data,
                    series: [
                        { id: 'myId', xKey: 'quarter', yKey: 'iphone' },
                        { id: 'myId', xKey: 'quarter', yKey: 'mac' },
                        { id: 'myOtherId', xKey: 'quarter', yKey: 'ipad' },
                        { id: 'myOtherId', xKey: 'quarter', yKey: 'wearables' },
                        { id: 'myOtherId', xKey: 'quarter', yKey: 'services' },
                    ],
                });
                expectWarnings([
                    `AG Charts - series[1].id "myId" ignored because it duplicates series[0].id`,
                    `AG Charts - series[3].id "myOtherId" ignored because it duplicates series[2].id`,
                    `AG Charts - series[4].id "myOtherId" ignored because it duplicates series[2].id`,
                ]);
            });

            test('renders duplicates', async () => {
                chart = await createChart({
                    data,
                    series: [
                        { type: 'bar', id: 'myId', xKey: 'quarter', yKey: 'iphone' },
                        { type: 'bar', id: 'myId', xKey: 'quarter', yKey: 'mac' },
                        { type: 'bar', id: 'myOtherId', xKey: 'quarter', yKey: 'ipad' },
                        { type: 'bar', id: 'myOtherId', xKey: 'quarter', yKey: 'wearables' },
                        { type: 'bar', id: 'myOtherId', xKey: 'quarter', yKey: 'services' },
                    ],
                });
                await compare();
            });
        });
    });

    describe('#create', () => {
        afterEach(() => {
            expect(console.warn).not.toBeCalled();
        });

        for (const [exampleName, example] of Object.entries(EXAMPLES)) {
            it(`for ${exampleName} it should create chart instance as expected`, async () => {
                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options, container);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                await example.assertions(chart);
            });

            it(`for ${exampleName} it should render to canvas as expected`, async () => {
                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options, container);

                chart = AgCharts.create(options);
                await compare();

                if (example.extraScreenshotActions) {
                    await example.extraScreenshotActions(chart);
                    await compare();
                }
            });
        }
    });

    describe('#update', () => {
        afterEach(() => {
            expect(console.warn).not.toBeCalled();
        });

        it('should allow switching between grouped and stacked types of chart', async () => {
            const exampleCycle = [
                { ...examples.GROUPED_BAR_CHART_EXAMPLE },
                { ...examples.GROUPED_BAR_CHART_EXAMPLE },
            ].map(({ series, ...opts }, idx) => ({
                ...opts,
                series: series?.map((s) => ({ ...s, grouped: idx === 0, stacked: idx !== 0 })),
            }));
            exampleCycle.forEach((opts) => prepareTestOptions(opts));
            const snapshots: any[] = [];

            // Create initial chart instance.
            chart = AgCharts.create(exampleCycle[0]) as Chart;
            snapshots[0] = await snapshot();

            // Execute 2 rounds of comparisons to try and catch any issues. On first round, just
            // make sure that the chart changes; on second+ round check the same chart image is
            // generated.
            let previousSnapshot: any = undefined;
            for (let round = 0; round <= 1; round++) {
                for (let index = 0; index < exampleCycle.length; index++) {
                    AgCharts.update(chart, exampleCycle[index]);

                    const exampleSnapshot = await snapshot();
                    if (snapshots[index] != null) {
                        expect(exampleSnapshot).toMatchImage(snapshots[index], {
                            writeDiff: false,
                        });
                    }

                    if (previousSnapshot != null) {
                        (expect(exampleSnapshot) as any).not.toMatchImage(previousSnapshot, {
                            writeDiff: false,
                        });
                    }

                    snapshots[index] = exampleSnapshot;
                    previousSnapshot = exampleSnapshot;
                }
            }
        });

        it('should allow switching positions of axes', async () => {
            const exampleCycle: AgCartesianChartOptions[] = [
                { ...examples.GROUPED_BAR_CHART_EXAMPLE },
                { ...examples.GROUPED_BAR_CHART_EXAMPLE },
            ].map(({ axes, ...opts }, idx) => ({
                ...opts,
                axes: axes?.map((a) => ({
                    ...a,
                    position: a.type === 'category' ? (idx === 0 ? 'left' : 'right') : idx === 0 ? 'bottom' : 'top',
                })),
            }));
            exampleCycle.forEach((opts) => prepareTestOptions(opts));

            // Create initial chart instance.
            chart = AgCharts.create(exampleCycle[0]) as Chart;
            await waitForChartStability(chart);

            // Execute 2 rounds of comparisons to try and catch any issues. On first round, just
            // make sure that the chart changes; on second+ round check the same chart image is
            // generated.
            for (let round = 0; round <= 1; round++) {
                for (let index = 0; index < exampleCycle.length; index++) {
                    AgCharts.update(chart, exampleCycle[index]);

                    await waitForChartStability(chart);
                }
            }
        });
    });
});
