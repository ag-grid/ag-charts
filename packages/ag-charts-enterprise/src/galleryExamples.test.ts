import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { AgChartOptions } from 'ag-charts-community';
import {
    extractImageData,
    GALLERY_EXAMPLES,
    IMAGE_SNAPSHOT_DEFAULTS,
    prepareTestOptions,
    setupMockCanvas,
    waitForChartStability,
} from 'ag-charts-community-test';
import { AgEnterpriseCharts } from './main';
import { prepareEnterpriseTestOptions } from './test/utils';

const ENTERPRISE_GALLERY_EXAMPLES = Object.entries(GALLERY_EXAMPLES)
    .filter(([, v]) => v.enterprise)
    .reduce((pv, [k, v]) => {
        pv[k] = v;
        return pv;
    }, {} as typeof GALLERY_EXAMPLES);

describe('Gallery Examples', () => {
    let chart: any;
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

        beforeEach(() => {
            console.warn = jest.fn();
        });

        afterEach(() => {
            expect(console.warn).not.toBeCalled();
        });

        for (const [exampleName, example] of Object.entries(ENTERPRISE_GALLERY_EXAMPLES)) {
            it(`for ${exampleName} it should create chart instance as expected`, async () => {
                const options: AgChartOptions = prepareEnterpriseTestOptions(example.options);
                chart = AgEnterpriseCharts.create(options);
                await waitForChartStability(chart);
                await example.assertions(chart);
            });

            it(`for ${exampleName} it should render to canvas as expected`, async () => {
                const compare = async () => {
                    await waitForChartStability(chart);

                    const imageData = extractImageData(ctx);
                    expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
                };

                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = AgEnterpriseCharts.create(options);
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
            expect(console.warn).not.toBeCalled();
        });

        for (const [exampleName, example] of Object.entries(ENTERPRISE_GALLERY_EXAMPLES)) {
            describe(`for ${exampleName}`, () => {
                let chart: Chart;
                let options: AgChartOptions;

                beforeEach(async () => {
                    options = { ...example.options };
                    prepareEnterpriseTestOptions(options);

                    chart = AgEnterpriseCharts.create(options);
                    await waitForChartStability(chart);
                });

                afterEach(() => {
                    chart.destroy();
                    chart = null!;
                    options = null!;
                });

                it(`it should update chart instance as expected`, async () => {
                    AgEnterpriseCharts.update(chart, options);
                    await waitForChartStability(chart);

                    await example.assertions(chart);
                });

                it(`it should render the same after update`, async () => {
                    const snapshot = async () => {
                        await waitForChartStability(chart);

                        return ctx.nodeCanvas.toBuffer('raw');
                    };

                    AgEnterpriseCharts.update(chart, options);

                    const before = await snapshot();
                    AgEnterpriseCharts.update(chart, options);
                    const after = await snapshot();

                    expect(after).toMatchImage(before);
                });
            });
        }
    });
});
