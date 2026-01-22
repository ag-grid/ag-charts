import { afterEach, describe, expect, it } from '@jest/globals';

import {
    IMAGE_SNAPSHOT_DEFAULTS,
    extractImageData,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import type { AgCartesianAxisPosition, AgCartesianChartOptions } from 'ag-charts-types';

import { createEnterpriseChart } from '../../test/utils';

const DATA = Array.from({ length: 12 }, (_, index) => ({
    x: index,
    y: 30 + Math.sin(index / 2) * 10,
}));

const TICK_SPACING_WIDE = 30;
const TICK_SIZE = 8;

type AxisCase = {
    position: AgCartesianAxisPosition;
    orientation: 'horizontal' | 'vertical';
    axisKey: 'x' | 'y';
    xPosition: AgCartesianAxisPosition;
    yPosition: AgCartesianAxisPosition;
};

const AXIS_CASES: AxisCase[] = [
    { position: 'top', orientation: 'horizontal', axisKey: 'x', xPosition: 'top', yPosition: 'left' },
    { position: 'bottom', orientation: 'horizontal', axisKey: 'x', xPosition: 'bottom', yPosition: 'left' },
    { position: 'left', orientation: 'vertical', axisKey: 'y', xPosition: 'bottom', yPosition: 'left' },
    { position: 'right', orientation: 'vertical', axisKey: 'y', xPosition: 'bottom', yPosition: 'right' },
];

const SCROLLBAR_SHARED = {
    enabled: true,
    placement: 'inner' as const,
    visible: 'always' as const,
    thickness: 12,
    spacing: 4,
    tickSpacing: TICK_SPACING_WIDE,
};

function buildScrollbarOptions(
    orientation: AxisCase['orientation'],
    position: AgCartesianAxisPosition,
    enabled: boolean
) {
    if (!enabled) {
        return {
            ...SCROLLBAR_SHARED,
            enabled: false,
            horizontal: { ...SCROLLBAR_SHARED, enabled: false },
            vertical: { ...SCROLLBAR_SHARED, enabled: false },
        };
    }

    return {
        ...SCROLLBAR_SHARED,
        horizontal:
            orientation === 'horizontal'
                ? { ...SCROLLBAR_SHARED, position: position as 'top' | 'bottom' }
                : { enabled: false },
        vertical:
            orientation === 'vertical'
                ? { ...SCROLLBAR_SHARED, position: position as 'left' | 'right' }
                : { enabled: false },
    };
}

function buildOptions(axisCase: AxisCase, scrollbarEnabled: boolean): AgCartesianChartOptions {
    const tickBase = { enabled: true, size: TICK_SIZE };

    return {
        data: DATA,
        series: [{ type: 'line', xKey: 'x', yKey: 'y', marker: { enabled: false } }],
        axes: {
            x: {
                type: 'number',
                position: axisCase.xPosition,
                tick: tickBase,
            },
            y: {
                type: 'number',
                position: axisCase.yPosition,
                tick: tickBase,
            },
        },
        scrollbar: buildScrollbarOptions(axisCase.orientation, axisCase.position, scrollbarEnabled),
        legend: { enabled: false },
    };
}

describe('Axis Tick Spacing with Scrollbar', () => {
    setupMockConsole();

    let chart: any;
    const ctx = setupMockCanvas();

    const render = async (options: AgCartesianChartOptions) => {
        chart = await createEnterpriseChart(options);
        await waitForChartStability(chart);
        const snapshot = ctx.snapshot();
        const imageData = extractImageData(ctx);
        chart.destroy();
        chart = undefined;
        return { imageData, snapshot };
    };

    afterEach(() => {
        if (chart) {
            chart.destroy();
            chart = undefined;
        }
    });

    for (const axisCase of AXIS_CASES) {
        describe(`${axisCase.position} axis`, () => {
            it('ignores tick spacing when scrollbar is disabled', async () => {
                const options = await render(buildOptions(axisCase, false));
                expect(options.imageData).toMatchImageSnapshot({
                    ...IMAGE_SNAPSHOT_DEFAULTS,
                    customSnapshotIdentifier: `tick-spacing-${axisCase.position}-no-scrollbar`,
                });
            });

            it('applies tick spacing when scrollbar is enabled', async () => {
                const options = await render(buildOptions(axisCase, true));
                expect(options.imageData).toMatchImageSnapshot({
                    ...IMAGE_SNAPSHOT_DEFAULTS,
                    customSnapshotIdentifier: `tick-spacing-${axisCase.position}-scrollbar-wide`,
                });
            });
        });
    }
});
