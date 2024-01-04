import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

import type { AgChartInstance, AgPolarChartOptions } from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    extractImageData,
    setupMockCanvas,
    waitForChartStability,
} from 'ag-charts-community-test';

import { AgCharts } from '../../main';
import { prepareEnterpriseTestOptions } from '../../test/utils';
import * as examples from './test/examples';

expect.extend({ toMatchImageSnapshot });

type TChart = Parameters<typeof waitForChartStability>[0];
type TCtx = ReturnType<typeof setupMockCanvas>;

const compare = async (chart: TChart | AgChartInstance | undefined, ctx: TCtx) => {
    expect(chart).toBeDefined();
    if (chart === undefined) return;

    await waitForChartStability(chart as TChart);
    const imageData = extractImageData(ctx);
    expect(imageData).toMatchImageSnapshot({ ...IMAGE_SNAPSHOT_DEFAULTS, failureThreshold: 0 });
};

describe('PolarCrossLine', () => {
    let chart: AgChartInstance | undefined;
    const ctx = setupMockCanvas();

    beforeEach(() => {
        console.warn = jest.fn();
    });

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
        expect(console.warn).not.toBeCalled();
    });

    describe('#create', () => {
        beforeEach(() => {
            console.warn = jest.fn();
        });

        afterEach(() => {
            expect(console.warn).not.toBeCalled();
        });

        it.each(Object.entries(examples))(
            'for %s it should render to canvas as expected',
            async (_exampleName, example) => {
                const options: AgPolarChartOptions = { ...example.options };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.create(options);
                await compare(chart, ctx);
            }
        );
    });
});
