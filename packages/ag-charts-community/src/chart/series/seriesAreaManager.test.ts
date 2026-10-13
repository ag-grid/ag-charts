import { afterEach, describe, expect, it } from 'vitest';

import type { AgBarSeriesOptions, AgCartesianChartOptions } from 'ag-charts-types';

import {
    createChart,
    getCursor,
    hoverAction,
    isTooltipVisible,
    pressKey,
    setupMockCanvas,
    setupMockConsole,
    tabIntoChart,
    waitForChartStability,
} from '../test/utils';

const data = [
    { month: 'January', sales: 1200, expenses: 800 },
    { month: 'February', sales: 1500, expenses: 950 },
    { month: 'March', sales: 1700, expenses: 1100 },
];

// Coordinate over the first 'sales' bar; bar Rect nodes are hit-testable in JSDOM.
const overBar = { x: 133, y: 333 } as const;

function barOptions(extra?: Partial<AgBarSeriesOptions>): AgCartesianChartOptions {
    return {
        data,
        series: [
            { type: 'bar', xKey: 'month', yKey: 'sales', ...extra },
            { type: 'bar', xKey: 'month', yKey: 'expenses', ...extra },
        ],
    };
}

describe('CRT-1122 hover cursor', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Awaited<ReturnType<typeof createChart>>;

    afterEach(() => {
        chart?.destroy();
    });

    it('shows the default cursor on a non-interactive series', async () => {
        chart = await createChart(barOptions());

        await hoverAction(overBar.x, overBar.y)(chart);
        await waitForChartStability(chart);

        expect(getCursor(chart)).toBe('default');
    });

    it('shows the pointer cursor when selection is enabled', async () => {
        chart = await createChart(barOptions({ selection: { enabled: true } }));

        await hoverAction(overBar.x, overBar.y)(chart);
        await waitForChartStability(chart);

        expect(getCursor(chart)).toBe('pointer');
    });

    it('shows the pointer cursor when a seriesNodeClick listener is present', async () => {
        chart = await createChart(barOptions({ listeners: { seriesNodeClick: () => undefined } }));

        await hoverAction(overBar.x, overBar.y)(chart);
        await waitForChartStability(chart);

        expect(getCursor(chart)).toBe('pointer');
    });
});

describe('AG-18673 Escape dismisses the keyboard focus tooltip', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Awaited<ReturnType<typeof createChart>>;

    afterEach(() => {
        chart?.destroy();
    });

    function getFocus() {
        const { datumIndex, seriesIndex } = (chart as any).seriesAreaManager.focus;
        return { datumIndex, seriesIndex };
    }

    async function pressEscape() {
        const seriesArea = document.querySelector<HTMLElement>('.ag-charts-series-area')!;
        const event = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true, cancelable: true });
        seriesArea.dispatchEvent(event);
        await waitForChartStability(chart);
        return event;
    }

    async function focusFirstDatum() {
        await tabIntoChart(chart);
        // jsdom cannot detect :focus-visible, so an arrow key is what switches to the keyboard device.
        await pressKey(chart, 'ArrowRight');
        await pressKey(chart, 'ArrowLeft');
        expect(getFocus()).toEqual({ datumIndex: 0, seriesIndex: 0 });
        expect(isTooltipVisible(chart)).toBe(true);
    }

    it('hides the tooltip and keeps focus on the datum', async () => {
        chart = await createChart(barOptions());
        await focusFirstDatum();
        const announcer = document.activeElement;

        const event = await pressEscape();

        expect(isTooltipVisible(chart)).toBe(false);
        expect(event.defaultPrevented).toBe(true);
        expect(getFocus()).toEqual({ datumIndex: 0, seriesIndex: 0 });
        expect(document.activeElement).toBe(announcer);
        expect(document.activeElement?.classList.contains('ag-charts-swapchain')).toBe(true);
        expect(document.querySelector<HTMLElement>('.ag-charts-focus-indicator')?.style.display).not.toBe('none');
    });

    it('shows the tooltip again when focus moves to another datum', async () => {
        chart = await createChart(barOptions());
        await focusFirstDatum();
        await pressEscape();
        expect(isTooltipVisible(chart)).toBe(false);

        await pressKey(chart, 'ArrowRight');
        expect(getFocus()).toEqual({ datumIndex: 1, seriesIndex: 0 });
        expect(isTooltipVisible(chart)).toBe(true);

        await pressKey(chart, 'ArrowLeft');
        expect(getFocus()).toEqual({ datumIndex: 0, seriesIndex: 0 });
        expect(isTooltipVisible(chart)).toBe(true);
    });

    it('shows the tooltip again when focus moves to another series', async () => {
        chart = await createChart(barOptions());
        await focusFirstDatum();
        await pressEscape();

        await pressKey(chart, 'ArrowDown');
        expect(getFocus()).toEqual({ datumIndex: 0, seriesIndex: 1 });
        expect(isTooltipVisible(chart)).toBe(true);
    });

    it('keeps the tooltip hidden when an arrow key cannot move focus', async () => {
        chart = await createChart(barOptions());
        await focusFirstDatum();
        await pressEscape();

        await pressKey(chart, 'ArrowLeft');
        expect(getFocus()).toEqual({ datumIndex: 0, seriesIndex: 0 });
        expect(isTooltipVisible(chart)).toBe(false);
    });

    it('keeps the tooltip hidden across a chart redraw', async () => {
        chart = await createChart(barOptions());
        await focusFirstDatum();
        await pressEscape();

        await chart.publicApi!.updateDelta({ title: { text: 'Redrawn' } });
        await waitForChartStability(chart);

        expect(getFocus()).toEqual({ datumIndex: 0, seriesIndex: 0 });
        expect(isTooltipVisible(chart)).toBe(false);
    });

    it('does not consume Escape when the chart is not keyboard-focused', async () => {
        chart = await createChart(barOptions());

        const event = await pressEscape();

        expect(event.defaultPrevented).toBe(false);
        expect(isTooltipVisible(chart)).toBe(false);
    });

    it('does not consume a second Escape once the tooltip is dismissed', async () => {
        chart = await createChart(barOptions());
        await focusFirstDatum();
        await pressEscape();

        const event = await pressEscape();

        expect(event.defaultPrevented).toBe(false);
        expect(isTooltipVisible(chart)).toBe(false);
    });

    it('does not consume Escape when the series tooltip is disabled', async () => {
        chart = await createChart(barOptions({ tooltip: { enabled: false } }));
        await tabIntoChart(chart);
        await pressKey(chart, 'ArrowRight');
        expect(isTooltipVisible(chart)).toBe(false);

        const event = await pressEscape();

        expect(event.defaultPrevented).toBe(false);
    });

    it('does not dismiss a pointer hover tooltip', async () => {
        chart = await createChart(barOptions());
        await hoverAction(overBar.x, overBar.y)(chart);
        await waitForChartStability(chart);
        expect(isTooltipVisible(chart)).toBe(true);

        const event = await pressEscape();

        expect(event.defaultPrevented).toBe(false);
        expect(isTooltipVisible(chart)).toBe(true);
    });
});
