import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';

import { mapValues } from 'ag-charts-core';
import type { AgCartesianAxisOptions, AgCartesianChartOptions, AgChartInstance, AgChartOptions } from 'ag-charts-types';

import { AgCharts } from '../api/agCharts';
import * as examples from './test/examples';
import type { ChartTestCase } from './test/utils';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    cartesianChartAssertions,
    clickAction,
    extractImageData,
    prepareTestOptions,
    repeat,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from './test/utils';

const EXAMPLES: Record<string, ChartTestCase> = {
    TRUNCATED_LEGEND_ITEMS: {
        options: examples.TRUNCATED_LEGEND_ITEMS,
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'number', y: 'category' },
            seriesTypes: repeat('bar', 4),
        }),
    },
};

describe('AgChartV2', () => {
    setupMockConsole();

    const ctx = setupMockCanvas();
    let chart: AgChartInstance;
    let container: HTMLElement;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.append(container);
    });

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
        container.remove();
    });

    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    const snapshot = async () => {
        await waitForChartStability(chart);

        return ctx.snapshot();
    };

    const compareImageDataUrl = async () => {
        await waitForChartStability(chart);
        const reference = await snapshot();

        const canvasCount = ctx.getActiveCanvasInstances().length;

        const imageURL = await chart.getImageDataURL();
        const imagePNGData = Buffer.from(imageURL.split(',')[1], 'base64');
        expect(imagePNGData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);

        const imageRaw = ctx.getActiveCanvasInstances()[canvasCount];
        expect(imageRaw.getContext('2d').getImageData(0, 0, imageRaw.width, imageRaw.height)).toMatchImage(reference);
    };

    describe('#create', () => {
        it.each(Object.entries(EXAMPLES))(
            'for %s it should create chart instance as expected',
            async (_exampleName, example) => {
                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options, container);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                await example.assertions(chart);
            }
        );

        it.each(Object.entries(EXAMPLES))(
            'for %s it should render to canvas as expected',
            async (_exampleName, example) => {
                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options, container);

                chart = AgCharts.create(options);
                await compare();

                if (example.extraScreenshotActions) {
                    await example.extraScreenshotActions(chart);
                    await compare();
                }
            }
        );
    });

    describe('#update', () => {
        it('should allow switching between grouped and stacked types of chart', async () => {
            const exampleCycle = [
                { ...examples.GROUPED_BAR_CHART_EXAMPLE },
                { ...examples.GROUPED_BAR_CHART_EXAMPLE },
            ].map(({ series, ...opts }, idx) => ({
                ...opts,
                series: series?.map((s) => ({ ...s, grouped: idx === 0, stacked: idx !== 0 })),
            }));
            for (const opts of exampleCycle) {
                prepareTestOptions(opts);
            }
            const snapshots: any[] = [];

            // Create initial chart instance.
            chart = AgCharts.create(exampleCycle[0]);
            snapshots[0] = await snapshot();

            // Execute 2 rounds of comparisons to try and catch any issues. On first round, just
            // make sure that the chart changes; on second+ round check the same chart image is
            // generated.
            let previousSnapshot: any = undefined;
            for (let round = 0; round <= 1; round++) {
                for (let index = 0; index < exampleCycle.length; index++) {
                    await chart.update(exampleCycle[index]);

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
            const adjustPosition = (a: AgCartesianAxisOptions, idx: number): AgCartesianAxisOptions => {
                let position: AgCartesianAxisOptions['position'] = 'top';
                if (a.type === 'category') {
                    position = idx === 0 ? 'left' : 'right';
                } else if (idx === 0) {
                    position = 'bottom';
                }
                return { ...a, position };
            };
            const exampleCycle: AgCartesianChartOptions[] = [
                { ...examples.GROUPED_BAR_CHART_EXAMPLE },
                { ...examples.GROUPED_BAR_CHART_EXAMPLE },
            ].map(({ axes, ...opts }, idx) => ({
                ...opts,
                axes: mapValues(axes ?? {}, (a) => adjustPosition(a, idx)),
            }));
            for (const opts of exampleCycle) {
                prepareTestOptions(opts);
            }

            // Create initial chart instance.
            chart = AgCharts.create(exampleCycle[0]);
            await waitForChartStability(chart);

            // Execute 2 rounds of comparisons to try and catch any issues. On first round, just
            // make sure that the chart changes; on second+ round check the same chart image is
            // generated.
            for (let round = 0; round <= 1; round++) {
                for (const cycle of exampleCycle) {
                    await chart.update(cycle);
                }
            }
        });
    });

    describe('#getImageDataURL', () => {
        it('should correctly download a stacked bar chart (AG-12985)', async () => {
            const options: AgChartOptions = { ...examples.STACKED_BAR_CHART_EXAMPLE };
            prepareTestOptions(options, container);

            chart = AgCharts.create(options);
            await compareImageDataUrl();
        });
    });

    describe('#getState', () => {
        it('omits legend state when legend is disabled', async () => {
            const options: AgChartOptions = {
                legend: { enabled: false },
                data: [
                    { x: 'a', y: 1 },
                    { x: 'b', y: 2 },
                ],
                series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
            };
            prepareTestOptions(options, container);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expect(chart.getState().legend).toBeUndefined();
        });
    });

    describe('AG-16360', () => {
        beforeEach(async () => {
            const options: AgChartOptions = {
                legend: {},
                data: [
                    { x: 'a', y: 1 },
                    { x: 'b', y: 2 },
                    { x: 'c', y: 3 },
                ],
                series: [{ type: 'bar', xKey: 'x', yKey: 'y', visible: true }],
            };
            prepareTestOptions(options, container);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            // Hide series by clicking the legend item
            await clickAction(405, 572)(chart);
            await waitForChartStability(chart);
            const state = chart.getState();
            expect(state.legend).toHaveLength(1);
            expect(state.legend![0].visible).toBe(false);
        });

        afterEach(async () => {
            // Check that update/updateDelta has reset series `visible: true`.
            const state = chart.getState();
            expect(state.legend).toHaveLength(1);
            expect(state.legend![0].visible).toBe(true);
            await compare();
        });

        it('update', async () => {
            const options: AgChartOptions = {
                legend: {},
                data: [
                    { x: 'a', y: 1 },
                    { x: 'b', y: 2 },
                    { x: 'c', y: 3 },
                ],
                series: [{ type: 'bar', xKey: 'x', yKey: 'y', visible: true }],
            };
            prepareTestOptions(options, container);
            await chart.update(options);
            await waitForChartStability(chart);
        });

        it('updateDelta', async () => {
            const options: AgChartOptions = {
                series: [{ type: 'bar', xKey: 'x', yKey: 'y', visible: true }],
            };
            await chart.updateDelta(options);
            await waitForChartStability(chart);
        });
    });
});
