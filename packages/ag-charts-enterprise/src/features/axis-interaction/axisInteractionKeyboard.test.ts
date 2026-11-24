import { vi } from 'vitest';

import type { AgCartesianChartOptions } from 'ag-charts-community';
import { deproxy, setupMockCanvas, spyOnAnimationFrames, waitForChartStability } from 'ag-charts-community-test';
import type { BoxBounds } from 'ag-charts-core';
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
        const options = (avoidCollisions: boolean): AgCartesianChartOptions => ({
            data,
            series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
            axes: {
                x: { type: 'category', position: 'bottom', label: { avoidCollisions }, listeners: { click: () => {} } },
                y: { type: 'number', position: 'left', listeners: { click: () => {} } },
            },
        });
        await createAndUpdate(options(true), options(false));

        expectProxiesMatchSettledLayout('x');
        expectProxiesMatchSettledLayout('y');
    });
});
