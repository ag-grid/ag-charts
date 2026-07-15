import { afterEach, describe, expect, it, vi } from 'vitest';

import { AgCharts } from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    clickAction,
    deproxy,
    extractImageData,
    scrollAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import { WheelDeltaMode } from 'ag-charts-test';
import type { AgCartesianAxisPosition, AgCartesianChartOptions } from 'ag-charts-types';

import { createEnterpriseChart, prepareEnterpriseTestOptions } from '../../test/utils';

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
        id: 'same-side-single-axis',
        label: 'same side with single axis',
        horizontal: { xAxes: ['bottom'], scrollbarPosition: 'bottom' },
        vertical: { yAxes: ['left'], scrollbarPosition: 'left' },
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

// A scrollbar-only chart must count as having viewport support, otherwise chart.update()
// resets the zoom to full extent and auto-hides the scrollbar (span === 1).
describe('Scrollbar preserves zoom across chart.update', () => {
    setupMockConsole();
    setupMockCanvas();

    let proxy: ReturnType<typeof AgCharts.create> | undefined;
    afterEach(() => {
        proxy?.destroy();
        proxy = undefined;
    });

    function createOptions(verticalPosition: 'left' | 'right'): AgCartesianChartOptions {
        return prepareEnterpriseTestOptions({
            width: 400,
            height: 300,
            data: DATA,
            series: [{ type: 'line', xKey: 'x', yKey: 'y', marker: { enabled: false } }],
            axes: { x: { type: 'number' }, y: { type: 'number' } },
            scrollbar: { enabled: true, vertical: { position: verticalPosition } },
            initialState: { zoom: { ratioY: { start: 0.2, end: 0.75 } } },
        });
    }

    function getZoomY() {
        return (deproxy(proxy!) as any).ctx.chartState.getValue('zoom')?.y;
    }

    function getVerticalLayoutRect() {
        return (deproxy(proxy!) as any).modulesManager.getModule('scrollbar').state.vertical.layoutRect;
    }

    it('keeps the vertical scrollbar when switching position from right to left', async () => {
        proxy = AgCharts.create(createOptions('right'));
        await waitForChartStability(proxy);
        expect(getZoomY()).toEqual({ min: 0.2, max: 0.75 });
        expect(getVerticalLayoutRect()).toBeDefined();

        await proxy.update(createOptions('left'));
        await waitForChartStability(proxy);
        expect(getZoomY()).toEqual({ min: 0.2, max: 0.75 });
        expect(getVerticalLayoutRect()).toBeDefined();
    });

    it('keeps the zoom on an unrelated update', async () => {
        proxy = AgCharts.create(createOptions('right'));
        await waitForChartStability(proxy);

        await proxy.update({ ...createOptions('right'), title: { text: 'changed' } });
        await waitForChartStability(proxy);
        expect(getZoomY()).toEqual({ min: 0.2, max: 0.75 });
        expect(getVerticalLayoutRect()).toBeDefined();
    });
});

const BAR_DATA = [
    { category: 'A', value: 10 },
    { category: 'B', value: 20 },
    { category: 'C', value: 30 },
    { category: 'D', value: 15 },
    { category: 'E', value: 25 },
    { category: 'F', value: 35 },
    { category: 'G', value: 12 },
    { category: 'H', value: 28 },
];

describe('Scrollbar visibility on barWidth change', () => {
    setupMockConsole();

    const ctx = setupMockCanvas();
    let proxy: ReturnType<typeof AgCharts.create> | undefined;

    afterEach(() => {
        proxy?.destroy();
        proxy = undefined;
    });

    // getState().zoom is only populated when navigator/zoom modules are enabled, not for scrollbar-only
    // charts. Use deproxy() for zoom assertions (internal state reads for assertions are level 3 per testing guide).
    function getZoomX() {
        return (deproxy(proxy!) as any).ctx.chartState.getValue('zoom')?.x;
    }

    function createOptions(seriesOverrides?: Record<string, unknown>): AgCartesianChartOptions {
        return prepareEnterpriseTestOptions({
            width: 400,
            height: 300,
            data: BAR_DATA,
            series: [{ type: 'bar', xKey: 'category', yKey: 'value', ...seriesOverrides }],
            scrollbar: { enabled: true },
        });
    }

    // AG-17008: Changing barWidth at runtime should trigger scrollbar when bars overflow.
    it('shows scrollbar after increasing barWidth beyond available space', async () => {
        const options = createOptions({ width: 10 });

        proxy = AgCharts.create(options);
        await waitForChartStability(proxy);

        expect(getZoomX()?.min).toBe(0);
        expect(getZoomX()?.max).toBe(1);

        // Increase barWidth so total required width exceeds the chart width.
        await proxy.update({ ...options, series: [{ type: 'bar', xKey: 'category', yKey: 'value', width: 80 }] });
        await waitForChartStability(proxy);

        expect(getZoomX()?.max).toBeLessThan(1);

        expect(extractImageData(ctx)).toMatchImageSnapshot({
            ...IMAGE_SNAPSHOT_DEFAULTS,
            customSnapshotIdentifier: 'ag-17008-scrollbar-after-barwidth-increase',
        });
    });

    // AG-17008: Successive barWidth changes should each update the zoom correctly.
    it('updates zoom on each successive barWidth change', async () => {
        const options = createOptions();

        proxy = AgCharts.create(options);
        await waitForChartStability(proxy);

        // No fixed width → bars fit → no scrollbar.
        expect(getZoomX()?.max).toBe(1);

        // First change: set width=10 → still fits.
        await proxy.update({ ...options, series: [{ type: 'bar', xKey: 'category', yKey: 'value', width: 10 }] });
        await waitForChartStability(proxy);
        expect(getZoomX()?.max).toBe(1);

        // Second change: set width=80 → overflows → scrollbar should appear.
        await proxy.update({ ...options, series: [{ type: 'bar', xKey: 'category', yKey: 'value', width: 80 }] });
        await waitForChartStability(proxy);
        expect(getZoomX()?.max).toBeLessThan(1);

        expect(extractImageData(ctx)).toMatchImageSnapshot({
            ...IMAGE_SNAPSHOT_DEFAULTS,
            customSnapshotIdentifier: 'ag-17008-scrollbar-successive-barwidth-changes',
        });
    });

    // At full extent a scrollbar pan is a no-op; skipping the zoom update keeps the span at exactly 1 so
    // floating-point re-anchoring can't drop it below 1 and reveal the scrollbar.
    it('does not issue a zoom update when wheel-scrolling an axis already at its extent', async () => {
        const options: AgCartesianChartOptions = prepareEnterpriseTestOptions({
            width: 400,
            height: 300,
            data: BAR_DATA,
            series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
            scrollbar: { enabled: true },
            zoom: { enabled: false, enableScrolling: true },
        });

        proxy = AgCharts.create(options);
        await waitForChartStability(proxy);

        // Bars fit → full extent.
        expect(getZoomX()?.min).toBe(0);
        expect(getZoomX()?.max).toBe(1);

        const cx = options.width! / 2;
        const cy = options.height! / 2;
        await clickAction(cx, cy)(proxy);

        const zoomManager = (deproxy(proxy) as any).ctx.zoomManager;
        const updateZoomSpy = vi.spyOn(zoomManager, 'updateZoom');

        // Sustained horizontal scroll in one direction, then partially back — the reported gesture.
        await scrollAction(cx, cy, 0, 50, WheelDeltaMode.Pixels, 30)(proxy);
        await scrollAction(cx, cy, 0, 50, WheelDeltaMode.Pixels, 30)(proxy);
        await scrollAction(cx, cy, 0, 50, WheelDeltaMode.Pixels, -10)(proxy);
        await scrollAction(cx, cy, 0, 50, WheelDeltaMode.Pixels, 30)(proxy);
        await waitForChartStability(proxy);

        // No zoom update is issued at the extent, so no dirty span can reach the scrollbar.
        expect(updateZoomSpy).not.toHaveBeenCalled();
        expect(getZoomX()?.min).toBe(0);
        expect(getZoomX()?.max).toBe(1);
    });
});

const FEATURE_DATA = Array.from({ length: 10 }, (_, index) => ({ feature: `Feature ${index + 1}`, value: 10 + index }));

describe('Scrollbar visibility after deferred (detached -> attached) resize', () => {
    setupMockConsole();
    setupMockCanvas();

    let proxy: ReturnType<typeof AgCharts.create> | undefined;

    afterEach(() => {
        proxy?.destroy();
        proxy = undefined;
        document.body.innerHTML = '';
        vi.restoreAllMocks();
    });

    function setupMeasurableContainer() {
        const size = { width: 0, height: 0 };
        const container = document.createElement('div');
        Object.defineProperty(container, 'clientWidth', { get: () => size.width });
        Object.defineProperty(container, 'clientHeight', { get: () => size.height });
        vi.spyOn(globalThis, 'getComputedStyle').mockReturnValue({
            paddingLeft: '0px',
            paddingRight: '0px',
            paddingTop: '0px',
            paddingBottom: '0px',
        } as CSSStyleDeclaration);
        const attach = (width: number, height: number) => {
            size.width = width;
            size.height = height;
            document.body.appendChild(container);
        };
        return { container, attach };
    }

    function createOptions(container: HTMLElement): AgCartesianChartOptions {
        return {
            container,
            animation: { enabled: false },
            minWidth: 0,
            minHeight: 0,
            data: FEATURE_DATA,
            series: [{ type: 'bar', direction: 'horizontal', xKey: 'feature', yKey: 'value', width: 14 }],
            scrollbar: { enabled: true },
        };
    }

    // Horizontal bars → the category axis is the cross (Y) axis; the scrollbar is shown when its zoom span < 1.
    function spanY() {
        const zoom = (deproxy(proxy!) as any).ctx.chartState.getValue('zoom')?.y;
        return zoom ? zoom.max - zoom.min : 1;
    }

    it('shows the scrollbar once attached to a container smaller than the fixed-width bars need', async () => {
        const { container, attach } = setupMeasurableContainer();

        // Create + update on the detached (0x0) container: it lays out at the scene default (600x300),
        // where the ten 14px bars fit, so the cross-axis stays at full range and no scrollbar shows.
        proxy = AgCharts.create(createOptions(container));
        await proxy.waitForUpdate();
        expect(spanY()).toBe(1);

        // Deferred resize: attach to a 500x200 parent where the bars overflow the category axis.
        attach(500, 200);
        await new Promise((resolve) => setTimeout(resolve, 50));
        await proxy.waitForUpdate();

        const chart = deproxy(proxy) as any;
        expect([chart.ctx.scene.width, chart.ctx.scene.height]).toEqual([500, 200]);
        expect(spanY()).toBeLessThan(1);
    });
});
