import { vi } from 'vitest';

import type { AgCartesianChartOptions } from 'ag-charts-community';
import {
    type AxisLabelNode,
    deproxy,
    getAxisLabelNodes,
    getLabelText,
    getSwapChainText,
    setupMockCanvas,
    spyOnAnimationFrames,
    waitForChartStability,
} from 'ag-charts-community-test';
import { type BoxBounds, type ButtonWidget, ChartAxisDirection, Transformable } from 'ag-charts-core';
import { setupMockConsole } from 'ag-charts-test';
import type { AgChartInstance } from 'ag-charts-types';

import { createEnterpriseChart, prepareEnterpriseTestOptions } from '../../test/utils';

// Bounds are derived through floating-point transforms, so edges that meet may differ by rounding.
const EPSILON = 1e-6;

const DATA = [
    { x: 0, y: 1, y2: 5 },
    { x: 100, y: 2, y2: 6 },
];

function getWidgets(chart: AgChartInstance) {
    return deproxy(chart).ctx.widgets;
}

function getTickButtons(chart: AgChartInstance, axisId: string) {
    const axisWidget = getWidgets(chart).acquireAxisWidget(axisId as any);
    return [...axisWidget.acquireInteractions().tickButtons.iterateChildren()];
}

function getA11YTickData(chart: AgChartInstance, axisId: string) {
    return deproxy(chart)
        .ctx.axisManager.getAxisIdContext(axisId as any)!
        .getA11YTickData();
}

const MONTH_LABELS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
].map((month) => `${month} 2025`);

function monthsOptions(xAxis: object, months = MONTH_LABELS): AgCartesianChartOptions {
    return {
        data: months.map((month, units) => ({ month, units })),
        series: [{ type: 'bar', xKey: 'month', yKey: 'units' }],
        axes: {
            x: { type: 'category', position: 'bottom', listeners: { click: () => {} }, ...xAxis },
            y: { type: 'number', position: 'left' },
        },
    };
}

// Proxy buttons are positioned, and so rotated, through the container that wraps them.
function getPositionedStyle(button: ButtonWidget) {
    return button.getElement().parentElement!.style;
}

type Corners = { x: number; y: number }[];

function boxCorners({ x, y, width, height }: BoxBounds): Corners {
    return [
        { x, y },
        { x: x + width, y },
        { x: x + width, y: y + height },
        { x, y: y + height },
    ];
}

// Where the button's CSS `rotate()` about its `transform-origin` puts each corner of its box, in canvas space.
function buttonCanvasCorners(axisBounds: BoxBounds, button: ButtonWidget): Corners {
    const { x, y, width, height } = button.getBounds();
    const { transform, transformOrigin } = getPositionedStyle(button);
    const angle = Number(/^rotate\((.+)rad\)$/.exec(transform)?.[1] ?? 0);
    const [originX, originY] = transformOrigin === '' ? [0, 0] : transformOrigin.split(' ').map(Number.parseFloat);
    const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
    return boxCorners({ x: 0, y: 0, width, height }).map((corner) => {
        const dx = corner.x - originX;
        const dy = corner.y - originY;
        return {
            x: axisBounds.x + x + originX + dx * cos - dy * sin,
            y: axisBounds.y + y + originY + dx * sin + dy * cos,
        };
    });
}

function labelCanvasCorners(node: AxisLabelNode): Corners {
    return boxCorners(node.computeBBoxWithoutTransforms()!).map((corner) => {
        const { canvasX, canvasY } = Transformable.toCanvasPoint(node, corner.x, corner.y);
        return { x: canvasX, y: canvasY };
    });
}

function isSlanted(node: AxisLabelNode) {
    return !Number.isInteger(node.rotation / (Math.PI / 2));
}

function expectCornersCloseTo(actual: Corners, expected: Corners) {
    expect(actual).toEqual(expected.map(({ x, y }) => ({ x: expect.closeTo(x, 3), y: expect.closeTo(y, 3) })));
}

function countText(text: string) {
    return Array.from(document.querySelectorAll('text')).filter((node) => node.textContent === text).length;
}

describe('AxisInteraction keyboard navigation', () => {
    setupMockCanvas();
    setupMockConsole();
    let chart: AgChartInstance;

    afterEach(() => {
        chart?.destroy();
        vi.restoreAllMocks();
    });

    async function createChart(options: AgCartesianChartOptions) {
        chart = await createEnterpriseChart(prepareEnterpriseTestOptions(options));
        await waitForChartStability(chart);
        return chart;
    }

    test('label-less axis still gets a named button per tick', async () => {
        await createChart({
            data: DATA,
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            axes: {
                x: { type: 'number', position: 'bottom', label: { enabled: false }, listeners: { click: () => {} } },
                y: { type: 'number', position: 'left' },
            },
        });

        const buttons = getTickButtons(chart, 'x');
        expect(buttons.length).toBeGreaterThan(1);
        for (const button of buttons) {
            expect(button.getElement().textContent).not.toBe('');
        }
    });

    test('activating a tick button fires the axis click listeners with the tick', async () => {
        const axisClick = vi.fn();
        const chartAxisClick = vi.fn();
        await createChart({
            data: DATA,
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            listeners: { axisClick: chartAxisClick },
            axes: {
                myX: { type: 'number', position: 'bottom', listeners: { click: axisClick } },
                y: { type: 'number', position: 'left' },
            },
        });

        // `myX` is the primary x axis, so internally it is remapped to `x`.
        const tickData = getA11YTickData(chart, 'x');
        const buttons = getTickButtons(chart, 'x');
        expect(buttons).toHaveLength(tickData.length);

        buttons[1].getElement().click();

        const expected = { axisId: 'myX', index: tickData[1].index, value: tickData[1].value };
        expect(axisClick).toHaveBeenCalledTimes(1);
        expect(axisClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'click', ...expected }));
        expect(chartAxisClick).toHaveBeenCalledTimes(1);
        expect(chartAxisClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'axisClick', ...expected }));
    });

    test('tick buttons stop short of the axis title', async () => {
        await createChart({
            data: DATA,
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            axes: {
                x: { type: 'number', position: 'bottom', title: { text: 'XTITLE' }, listeners: { click: () => {} } },
                y: { type: 'number', position: 'left', title: { text: 'YTITLE' }, listeners: { click: () => {} } },
            },
        });

        const xTitle = getWidgets(chart)
            .acquireAxisWidget('x' as any)
            .acquireTitle()
            .getBounds();
        for (const button of getTickButtons(chart, 'x')) {
            const { y, height } = button.getBounds();
            expect(y + height).toBeLessThanOrEqual(xTitle.y + EPSILON);
        }

        const yTitle = getWidgets(chart)
            .acquireAxisWidget('y' as any)
            .acquireTitle()
            .getBounds();
        for (const button of getTickButtons(chart, 'y')) {
            expect(button.getBounds().x).toBeGreaterThanOrEqual(yTitle.x + yTitle.width - EPSILON);
        }
    });

    test.each([false, true])('ArrowRight/ArrowLeft follow the visual tick order (enableRtl: %s)', async (enableRtl) => {
        // jsdom leaves the computed `direction` empty, so resolve it from the nearest `dir` attribute.
        const getComputedStyle = globalThis.getComputedStyle;
        vi.spyOn(globalThis, 'getComputedStyle').mockImplementation((elem, pseudo) => {
            const style = getComputedStyle(elem, pseudo);
            const dir = elem.closest('[dir]')?.getAttribute('dir');
            return dir == null ? style : Object.assign(style, { direction: dir });
        });

        await createChart({
            enableRtl,
            data: DATA,
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            axes: {
                x: { type: 'number', position: 'bottom', listeners: { click: () => {} } },
                y: { type: 'number', position: 'left' },
            },
        });

        const buttons = getTickButtons(chart, 'x');
        expect(buttons.length).toBeGreaterThan(1);
        expect(buttons[1].getBounds().x).toBeGreaterThan(buttons[0].getBounds().x);

        const press = (key: string) =>
            document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));

        buttons[0].getElement().focus();
        press('ArrowRight');
        expect(document.activeElement).toBe(buttons[1].getElement());
        press('ArrowLeft');
        expect(document.activeElement).toBe(buttons[0].getElement());
    });

    test.each([
        { name: 'auto-rotated', label: { wrapping: 'never' } },
        { name: 'rotation: 30', label: { rotation: 30 } },
    ])('outlines each $name tick label with a box rotated to match it', async ({ label }) => {
        await createChart(monthsOptions({ label }));

        const nodes = getAxisLabelNodes(chart, 'bottom');
        const buttons = getTickButtons(chart, 'x');
        expect(buttons).toHaveLength(MONTH_LABELS.length);
        expect(nodes).toHaveLength(MONTH_LABELS.length);

        const axisBounds = getWidgets(chart)
            .acquireAxisWidget('x' as any)
            .getBounds();
        for (const button of buttons) {
            // An edge label may be truncated to stay within the chart; its button keeps the full text.
            const node = nodes.find(
                (n) => (n.datum.textUntruncated ?? getLabelText(n)) === button.getElement().textContent
            );
            expect(isSlanted(node!)).toBe(true);
            expectCornersCloseTo(buttonCanvasCorners(axisBounds, button), labelCanvasCorners(node!));
        }
    });

    test.each([
        { name: 'rotation: 0', options: monthsOptions({ label: { rotation: 0, collision: { alwaysShow: true } } }) },
        { name: 'rotation: 90', options: monthsOptions({ label: { rotation: 90 } }) },
        {
            name: 'grouped-category',
            options: {
                data: MONTH_LABELS.map((month, units) => ({ month: ['2025', month], units })),
                series: [{ type: 'bar', xKey: 'month', yKey: 'units' }],
                axes: {
                    x: {
                        type: 'grouped-category',
                        position: 'bottom',
                        depthOptions: [{ label: { rotation: 30 } }, {}],
                        listeners: { click: () => {} },
                    },
                    y: { type: 'number', position: 'left' },
                },
            } as AgCartesianChartOptions,
        },
    ])('keeps axis-aligned focus boxes for $name', async ({ name, options }) => {
        await createChart(options);
        expect(getAxisLabelNodes(chart, 'bottom').some(isSlanted)).toBe(name === 'grouped-category');

        const buttons = getTickButtons(chart, 'x');
        expect(buttons.length).toBeGreaterThan(0);
        for (const button of buttons) {
            expect(getPositionedStyle(button).transform).toBe('');
        }
    });

    test('keeps the band box for a tick whose label is not drawn', async () => {
        const hidden = MONTH_LABELS[2];
        await createChart(
            monthsOptions({
                label: { rotation: 30, formatter: ({ value }: { value: string }) => (value === hidden ? '' : value) },
            })
        );

        const tickData = getA11YTickData(chart, 'x');
        const buttons = getTickButtons(chart, 'x');
        const hiddenIndex = tickData.findIndex((tick) => tick.value === hidden);
        expect(hiddenIndex).toBeGreaterThanOrEqual(0);
        for (const [i, button] of buttons.entries()) {
            expect(getPositionedStyle(button).transform === '').toBe(i === hiddenIndex);
        }
    });

    // Known gap: collision avoidance drops whole category ticks, leaving the unlabelled ones keyboard-unreachable.
    test.skip('reaches every category when collision avoidance drops some labels', async () => {
        const months = Array.from({ length: 60 }, (_, i) => `${MONTH_LABELS[i % 12]} #${Math.floor(i / 12)}`);
        await createChart(monthsOptions({}, months));

        expect(getAxisLabelNodes(chart, 'bottom').length).toBeLessThan(months.length);
        expect(getTickButtons(chart, 'x').map((button) => button.getElement().textContent)).toEqual(months);
    });

    test('removing and re-adding a titled axis leaves a single title', async () => {
        const withY2: AgCartesianChartOptions = {
            data: DATA,
            listeners: { axisClick: () => {} },
            series: [
                { type: 'line', xKey: 'x', yKey: 'y' },
                { type: 'line', xKey: 'x', yKey: 'y2', yKeyAxis: 'y2' },
            ],
            axes: {
                x: { type: 'number', position: 'bottom' },
                y: { type: 'number', position: 'left' },
                y2: { type: 'number', position: 'right', title: { text: 'Y2TITLE' } },
            },
        };
        const withoutY2: AgCartesianChartOptions = {
            data: DATA,
            listeners: { axisClick: () => {} },
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            axes: { x: { type: 'number', position: 'bottom' }, y: { type: 'number', position: 'left' } },
        };

        await createChart(withY2);
        expect(countText('Y2TITLE')).toBe(1);

        await chart.update(prepareEnterpriseTestOptions(withoutY2));
        await waitForChartStability(chart);
        expect(countText('Y2TITLE')).toBe(0);

        await chart.update(prepareEnterpriseTestOptions(withY2));
        await waitForChartStability(chart);
        expect(countText('Y2TITLE')).toBe(1);
    });
});

describe('AxisInteraction keyboard navigation after an animated layout change', () => {
    setupMockCanvas();
    setupMockConsole();
    const frames = spyOnAnimationFrames();
    let chart: AgChartInstance;

    afterEach(() => {
        chart?.destroy();
    });

    // The proxies are only correct if they match what a fresh read of the settled chart reports.
    function expectProxiesMatchSettledLayout(axisId: string) {
        const axisCtx = deproxy(chart).ctx.axisManager.getAxisIdContext(axisId as any)!;
        const axisWidget = getWidgets(chart).acquireAxisWidget(axisId as any);
        expectBoxCloseTo(axisWidget.getBounds(), axisCtx.getCanvasBounds()!);

        const expectedTicks = axisCtx.getA11YTickData();
        const buttons = getTickButtons(chart, axisId);
        expect(buttons).toHaveLength(expectedTicks.length);
        for (const [i, button] of buttons.entries()) {
            expectBoxCloseTo(button.getBounds(), expectedTicks[i].focusBounds);
            const { angle } = expectedTicks[i].focusRotation ?? {};
            expect(getPositionedStyle(button).transform).toBe(angle == null ? '' : `rotate(${angle}rad)`);
        }
    }

    function expectBoxCloseTo(actual: BoxBounds, expected: BoxBounds) {
        const keys = ['x', 'y', 'width', 'height'] as const;
        expect(Object.fromEntries(keys.map((k) => [k, actual[k]]))).toEqual(
            Object.fromEntries(keys.map((k) => [k, expect.closeTo(expected[k], 6)]))
        );
    }

    async function createAndUpdate(before: AgCartesianChartOptions, after: AgCartesianChartOptions) {
        chart = await createEnterpriseChart(prepareEnterpriseTestOptions({ animation: { enabled: true }, ...before }));
        await frames.runToEnd(chart);
        await chart.update(prepareEnterpriseTestOptions({ animation: { enabled: true }, ...after }));
        await frames.runToEnd(chart);
    }

    test('follows the axes to their new positions', async () => {
        const options = (flipped: boolean): AgCartesianChartOptions => ({
            data: DATA,
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            axes: {
                x: { type: 'number', position: flipped ? 'top' : 'bottom', listeners: { click: () => {} } },
                y: { type: 'number', position: flipped ? 'right' : 'left', listeners: { click: () => {} } },
            },
        });
        await createAndUpdate(options(false), options(true));

        const seriesRect = deproxy(chart).seriesRect!;
        const xBounds = getWidgets(chart)
            .acquireAxisWidget('x' as any)
            .getBounds();
        const yBounds = getWidgets(chart)
            .acquireAxisWidget('y' as any)
            .getBounds();
        expect(xBounds.y + xBounds.height).toBeLessThanOrEqual(seriesRect.y + EPSILON);
        expect(yBounds.x).toBeGreaterThanOrEqual(seriesRect.x + seriesRect.width - EPSILON);
        expectProxiesMatchSettledLayout('x');
        expectProxiesMatchSettledLayout('y');
    });

    test('follows the tick labels when the axis narrows', async () => {
        const options = (max: number): AgCartesianChartOptions => ({
            data: DATA,
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            axes: {
                x: { type: 'number', position: 'bottom', listeners: { click: () => {} } },
                y: { type: 'number', position: 'left', min: 0, max, listeners: { click: () => {} } },
            },
        });
        await createAndUpdate(options(100_000), options(90));

        expectProxiesMatchSettledLayout('x');
        expectProxiesMatchSettledLayout('y');
    });

    test('follows the tick labels when their rotation changes', async () => {
        const data = Array.from({ length: 36 }, (_, i) => ({ category: `Category ${i + 1}`, value: i }));
        const options = (alwaysShow: boolean): AgCartesianChartOptions => ({
            data,
            series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
            axes: {
                x: {
                    type: 'category',
                    position: 'bottom',
                    label: { collision: { alwaysShow } },
                    listeners: { click: () => {} },
                },
                y: { type: 'number', position: 'left', listeners: { click: () => {} } },
            },
        });
        await createAndUpdate(options(false), options(true));

        expectProxiesMatchSettledLayout('x');
        expectProxiesMatchSettledLayout('y');
    });
});

// Focus follows series item focus: it keeps its position when the focused tick survives an update and falls back to
// the previous tick when the focused tick was the last one.
describe('AxisInteraction keyboard focus when ticks change', () => {
    setupMockCanvas();
    setupMockConsole();
    let chart: AgChartInstance;

    afterEach(() => {
        chart?.destroy();
    });

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => ({ month, units: 10 + i }));
    const withListener = { listeners: { click: () => {} } };

    function monthOptions({
        data = MONTHS,
        x = withListener,
        y = withListener,
        ...rest
    }: { data?: object[]; x?: object; y?: object } & AgCartesianChartOptions = {}): AgCartesianChartOptions {
        return prepareEnterpriseTestOptions({
            data,
            series: [{ type: 'bar', xKey: 'month', yKey: 'units' }],
            axes: {
                x: { type: 'category', position: 'bottom', ...x },
                y: { type: 'number', position: 'left', ...y },
            },
            ...rest,
        });
    }

    async function focusXTick(options: AgCartesianChartOptions, label: string) {
        chart = await createEnterpriseChart(options);
        await waitForChartStability(chart);
        const button = getTickButtons(chart, 'x').find((b) => b.getElement().textContent === label);
        button!.focus();
        expect(document.activeElement?.textContent).toBe(label);
    }

    async function update(options: AgCartesianChartOptions) {
        await chart.update(options);
        await waitForChartStability(chart);
    }

    function expectSeriesAreaFocused() {
        expect(document.activeElement?.classList.contains('ag-charts-swapchain')).toBe(true);
    }

    test('moves to the previous tick when the focused last tick is removed', async () => {
        await focusXTick(monthOptions(), 'Jun');

        await update(monthOptions({ data: MONTHS.slice(0, -1) }));

        const buttons = getTickButtons(chart, 'x');
        expect(buttons.map((b) => b.getElement().textContent)).toEqual(['Jan', 'Feb', 'Mar', 'Apr', 'May']);
        expect(document.activeElement).toBe(buttons[4].getElement());
        expect(buttons[4].getElement().tabIndex).toBe(0);
    });

    test('moves to the new last tick when several ticks after the focused tick are removed', async () => {
        await focusXTick(monthOptions(), 'Jun');

        await update(monthOptions({ data: MONTHS.slice(0, 3) }));

        expect(document.activeElement?.textContent).toBe('Mar');
    });

    test('keeps its position when a tick before the focused tick is removed', async () => {
        await focusXTick(monthOptions(), 'Mar');

        await update(monthOptions({ data: MONTHS.filter(({ month }) => month !== 'Mar') }));

        expect(document.activeElement).toBe(getTickButtons(chart, 'x')[2].getElement());
        expect(document.activeElement?.textContent).toBe('Apr');
    });

    test('moves to the series area when no ticks are left', async () => {
        await focusXTick(monthOptions(), 'Jun');

        await update(monthOptions({ data: [] }));

        expect(getTickButtons(chart, 'x')).toHaveLength(0);
        expectSeriesAreaFocused();
        expect(getSwapChainText()).toBe('No data to display');
    });

    test('moves to the series area when the axis loses its click listener', async () => {
        await focusXTick(monthOptions(), 'Mar');

        await update(monthOptions({ x: {} }));

        expectSeriesAreaFocused();
    });

    test('moves to the series area when no axis interaction is left', async () => {
        await focusXTick(monthOptions({ contextMenu: { enabled: false } }), 'Mar');

        await update(monthOptions({ x: {}, y: {}, contextMenu: { enabled: false } }));

        expectSeriesAreaFocused();
    });

    test('moves to the series area when the axis is removed', async () => {
        const series = [
            { type: 'bar' as const, xKey: 'month', yKey: 'units' },
            { type: 'line' as const, xKey: 'month', yKey: 'units', yKeyAxis: 'y2' },
        ];
        const axes = {
            x: { type: 'category' as const, position: 'bottom' as const },
            y: { type: 'number' as const, position: 'left' as const },
        };
        chart = await createEnterpriseChart(
            prepareEnterpriseTestOptions({
                data: MONTHS,
                series,
                axes: { ...axes, y2: { type: 'number', position: 'right', ...withListener } },
            })
        );
        await waitForChartStability(chart);
        const y2 = deproxy(chart)
            .ctx.axisManager.getAxisContext(ChartAxisDirection.Y)
            .find(({ userAxisId }) => userAxisId === 'y2')!;
        const [button] = getTickButtons(chart, y2.axisId);
        button.focus();
        expect(document.activeElement).toBe(button.getElement());

        await update(prepareEnterpriseTestOptions({ data: MONTHS, series: [series[0]], axes }));

        expectSeriesAreaFocused();
    });

    test('leaves focus alone when no tick had focus', async () => {
        chart = await createEnterpriseChart(monthOptions());
        await waitForChartStability(chart);
        const outside = document.createElement('button');
        document.body.append(outside);
        outside.focus();

        await update(monthOptions({ data: [] }));

        expect(document.activeElement).toBe(outside);
        outside.remove();
    });
});
