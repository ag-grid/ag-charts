import { vi } from 'vitest';

import type { AgCartesianChartOptions } from 'ag-charts-community';
import { deproxy, setupMockCanvas, waitForChartStability } from 'ag-charts-community-test';
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
    return deproxy(chart).ctx.axisManager.getAxisIdContext(axisId as any)!.getA11YTickData();
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

        const xTitle = getWidgets(chart).acquireAxisWidget('x' as any).acquireTitle().getBounds();
        for (const button of getTickButtons(chart, 'x')) {
            const { y, height } = button.getBounds();
            expect(y + height).toBeLessThanOrEqual(xTitle.y + EPSILON);
        }

        const yTitle = getWidgets(chart).acquireAxisWidget('y' as any).acquireTitle().getBounds();
        for (const button of getTickButtons(chart, 'y')) {
            expect(button.getBounds().x).toBeGreaterThanOrEqual(yTitle.x + yTitle.width - EPSILON);
        }
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
