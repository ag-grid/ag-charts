import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartInstance, AgPolarChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    compareImageSnapshot,
    setupMockCanvas,
    setupMockConsole,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';
import * as examples from './test/examples';

type TCtx = ReturnType<typeof setupMockCanvas>;

const compare = async (chart: AgChartInstance | undefined, ctx: TCtx) => {
    expect(chart).toBeDefined();
    if (chart === undefined) return;

    await compareImageSnapshot(chart, ctx, { ...IMAGE_SNAPSHOT_DEFAULTS, failureThreshold: 0 });
};

describe('PolarCrossLine', () => {
    setupMockConsole();

    let chart: AgChartInstance | undefined;
    const ctx = setupMockCanvas();

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    describe('#create', () => {
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
