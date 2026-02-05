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
    y2: 28 + Math.cos(index / 3) * 8,
}));

const TICK_SPACING_WIDE = 30;
const TICK_SIZE = 8;

const SCROLLBAR_PLACEMENT_BASE = {
    enabled: true,
    visible: 'always' as const,
};

type SnapshotResult = {
    imageData: Buffer;
    snapshot: ImageData;
};

type ChartRef = {
    current?: any;
};

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

async function renderSnapshot(
    ctx: ReturnType<typeof setupMockCanvas>,
    options: AgCartesianChartOptions,
    chartRef: ChartRef
): Promise<SnapshotResult> {
    chartRef.current = await createEnterpriseChart(options);
    await waitForChartStability(chartRef.current);
    const snapshot = ctx.snapshot();
    const imageData = extractImageData(ctx);
    chartRef.current.destroy();
    chartRef.current = undefined;
    return { imageData, snapshot };
}

function destroyChartRef(chartRef: ChartRef) {
    if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = undefined;
    }
}

describe('Axis Tick Spacing with Scrollbar', () => {
    setupMockConsole();

    const chartRef: ChartRef = {};
    const ctx = setupMockCanvas();

    afterEach(() => destroyChartRef(chartRef));

    for (const axisCase of AXIS_CASES) {
        describe(`${axisCase.position} axis`, () => {
            it('ignores tick spacing when scrollbar is disabled', async () => {
                const options = await renderSnapshot(ctx, buildOptions(axisCase, false), chartRef);
                expect(options.imageData).toMatchImageSnapshot({
                    ...IMAGE_SNAPSHOT_DEFAULTS,
                    customSnapshotIdentifier: `tick-spacing-${axisCase.position}-no-scrollbar`,
                });
            });

            it('applies tick spacing when scrollbar is enabled', async () => {
                const options = await renderSnapshot(ctx, buildOptions(axisCase, true), chartRef);
                expect(options.imageData).toMatchImageSnapshot({
                    ...IMAGE_SNAPSHOT_DEFAULTS,
                    customSnapshotIdentifier: `tick-spacing-${axisCase.position}-scrollbar-wide`,
                });
            });
        });
    }
});

type ScrollbarOrientation = 'horizontal' | 'vertical';
type ScrollbarScenario = {
    id: string;
    label: string;
    horizontal: {
        xAxes: Array<'top' | 'bottom'>;
        scrollbarPosition: 'top' | 'bottom';
    };
    vertical: {
        yAxes: Array<'left' | 'right'>;
        scrollbarPosition: 'left' | 'right';
    };
};

const SCROLLBAR_SCENARIOS: ScrollbarScenario[] = [
    {
        id: 'opposite-single-axis',
        label: 'opposite side with single axis',
        horizontal: { xAxes: ['bottom'], scrollbarPosition: 'top' },
        vertical: { yAxes: ['left'], scrollbarPosition: 'right' },
    },
    {
        id: 'same-side-secondary-same-side',
        label: 'same side with secondary axis on same side',
        horizontal: { xAxes: ['bottom', 'bottom'], scrollbarPosition: 'bottom' },
        vertical: { yAxes: ['left', 'left'], scrollbarPosition: 'left' },
    },
    {
        id: 'opposite-secondary-opposite',
        label: 'opposite side with secondary axis on opposite side',
        horizontal: { xAxes: ['bottom', 'top'], scrollbarPosition: 'top' },
        vertical: { yAxes: ['left', 'right'], scrollbarPosition: 'right' },
    },
    {
        id: 'opposite-no-secondary-opposite',
        label: 'opposite side with secondary axis on same side',
        horizontal: { xAxes: ['bottom', 'bottom'], scrollbarPosition: 'top' },
        vertical: { yAxes: ['left', 'left'], scrollbarPosition: 'right' },
    },
];

function buildPlacementScrollbarOptions(
    orientation: ScrollbarOrientation,
    position: 'top' | 'bottom' | 'left' | 'right',
    placement?: 'inner' | 'outer'
) {
    const base = placement ? { ...SCROLLBAR_PLACEMENT_BASE, placement } : { ...SCROLLBAR_PLACEMENT_BASE };
    return {
        ...base,
        horizontal:
            orientation === 'horizontal' ? { ...base, position: position as 'top' | 'bottom' } : { enabled: false },
        vertical: orientation === 'vertical' ? { ...base, position: position as 'left' | 'right' } : { enabled: false },
    };
}

function buildPlacementOptions(
    orientation: ScrollbarOrientation,
    scenario: ScrollbarScenario,
    placement?: 'inner' | 'outer'
): AgCartesianChartOptions {
    const tickBase = { enabled: true, size: TICK_SIZE };
    const axes: Record<string, any> = {};
    const series: AgCartesianChartOptions['series'] = [];

    if (orientation === 'horizontal') {
        axes.xPrimary = { type: 'number', position: scenario.horizontal.xAxes[0], tick: tickBase };
        if (scenario.horizontal.xAxes[1]) {
            axes.xSecondary = { type: 'number', position: scenario.horizontal.xAxes[1], tick: tickBase };
        }
        axes.y = { type: 'number', position: 'left', tick: tickBase };

        series.push({
            type: 'line',
            xKey: 'x',
            yKey: 'y',
            xKeyAxis: 'xPrimary',
            yKeyAxis: 'y',
            marker: { enabled: false },
        });

        if (scenario.horizontal.xAxes[1]) {
            series.push({
                type: 'line',
                xKey: 'x',
                yKey: 'y2',
                xKeyAxis: 'xSecondary',
                yKeyAxis: 'y',
                marker: { enabled: false },
            });
        }
    } else {
        axes.x = { type: 'number', position: 'bottom', tick: tickBase };
        axes.yPrimary = { type: 'number', position: scenario.vertical.yAxes[0], tick: tickBase };
        if (scenario.vertical.yAxes[1]) {
            axes.ySecondary = { type: 'number', position: scenario.vertical.yAxes[1], tick: tickBase };
        }

        series.push({
            type: 'line',
            xKey: 'x',
            yKey: 'y',
            xKeyAxis: 'x',
            yKeyAxis: 'yPrimary',
            marker: { enabled: false },
        });

        if (scenario.vertical.yAxes[1]) {
            series.push({
                type: 'line',
                xKey: 'x',
                yKey: 'y2',
                xKeyAxis: 'x',
                yKeyAxis: 'ySecondary',
                marker: { enabled: false },
            });
        }
    }

    const position =
        orientation === 'horizontal' ? scenario.horizontal.scrollbarPosition : scenario.vertical.scrollbarPosition;

    return {
        data: DATA,
        series,
        axes,
        scrollbar: buildPlacementScrollbarOptions(orientation, position, placement),
        legend: { enabled: false },
    };
}

describe('Scrollbar Placement with Multiple Axes', () => {
    setupMockConsole();

    const chartRef: ChartRef = {};
    const ctx = setupMockCanvas();

    afterEach(() => destroyChartRef(chartRef));

    for (const scenario of SCROLLBAR_SCENARIOS) {
        describe(scenario.label, () => {
            for (const orientation of ['horizontal', 'vertical'] as const) {
                for (const placement of [undefined, 'inner'] as const) {
                    const placementSuffix = placement ? `-${placement}` : '';
                    const label = placement ? `${orientation} scrollbar (${placement})` : `${orientation} scrollbar`;
                    it(`renders ${label} on the correct side`, async () => {
                        const options = await renderSnapshot(
                            ctx,
                            buildPlacementOptions(orientation, scenario, placement),
                            chartRef
                        );
                        expect(options.imageData).toMatchImageSnapshot({
                            ...IMAGE_SNAPSHOT_DEFAULTS,
                            customSnapshotIdentifier: `scrollbar-position-${scenario.id}-${orientation}${placementSuffix}`,
                        });
                    });
                }
            }
        });
    }
});
