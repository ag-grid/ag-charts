import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { AgChartInstance, AgChartOptions, AgGaugeOptions } from 'ag-charts-community';
import {
    GALLERY_EXAMPLES,
    IMAGE_SNAPSHOT_DEFAULTS,
    type TestCase,
    extractImageData,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { AgCharts } from './main';
import { prepareEnterpriseTestOptions } from './test/utils';

const ENTERPRISE_GALLERY_EXAMPLES = Object.entries(GALLERY_EXAMPLES)
    .filter(([, v]) => v.enterprise)
    .reduce<Record<string, TestCase>>((pv, [k, v]) => {
        pv[k] = v;
        return pv;
    }, {});

describe('Gallery Examples', () => {
    setupMockConsole();

    let chart: AgChartInstance<AgChartOptions | AgGaugeOptions>;
    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    it('should execute with London timezone', () => {
        expect(new Date(2023, 0, 1).getTimezoneOffset()).toEqual(0);
    });

    describe('AgChartV2#create', () => {
        const ctx = setupMockCanvas();

        for (const [exampleName, example] of Object.entries(ENTERPRISE_GALLERY_EXAMPLES)) {
            it(`for ${exampleName} it should create chart instance as expected`, async () => {
                chart =
                    example.type === 'gauge'
                        ? AgCharts.createGauge(prepareEnterpriseTestOptions(example.options))
                        : AgCharts.create(prepareEnterpriseTestOptions(example.options));
                await waitForChartStability(chart);
                await example.assertions(chart);
            });

            it(`for ${exampleName} it should render to canvas as expected`, async () => {
                const compare = async () => {
                    await waitForChartStability(chart);

                    const imageData = extractImageData(ctx);
                    expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
                };

                chart =
                    example.type === 'gauge'
                        ? AgCharts.createGauge(prepareTestOptions({ ...example.options }))
                        : AgCharts.create(prepareTestOptions({ ...example.options }));
                await compare();

                if (example.extraScreenshotActions) {
                    await example.extraScreenshotActions(chart);
                    await compare();
                }
            });
        }
    });

    describe('AgChartV2#update', () => {
        const ctx = setupMockCanvas();

        beforeEach(() => {
            console.warn = jest.fn();
        });

        afterEach(() => {
            expect(console.warn).not.toHaveBeenCalled();
        });

        for (const [exampleName, example] of Object.entries(ENTERPRISE_GALLERY_EXAMPLES)) {
            describe(`for ${exampleName}`, () => {
                let options: AgChartOptions | AgGaugeOptions;

                beforeEach(async () => {
                    options = { ...example.options };
                    prepareEnterpriseTestOptions(options as any);

                    chart =
                        example.type === 'gauge'
                            ? AgCharts.createGauge(options as any)
                            : AgCharts.create(options as any);
                    await waitForChartStability(chart);
                });

                it(`it should update chart instance as expected`, async () => {
                    await chart.update(options);
                    await waitForChartStability(chart);

                    await example.assertions(chart);
                });

                it(`it should render the same after update`, async () => {
                    const snapshot = async () => {
                        await waitForChartStability(chart);

                        return ctx.snapshot();
                    };

                    await chart.update(options);

                    const before = await snapshot();
                    await chart.update(options);
                    const after = await snapshot();

                    expect(after).toMatchImage(before);
                });
            });
        }
    });
});
