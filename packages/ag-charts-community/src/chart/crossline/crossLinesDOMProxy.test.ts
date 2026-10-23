import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AgCartesianChartOptions, AgCartesianCrossLineOptions, AgChartInstance } from 'ag-charts-types';

import {
    createChart,
    deproxy,
    getTabStopGroups,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';
import { getCrossLinesPlugin } from './test/crossLineAccessors';

const X_CROSS_LINES: AgCartesianCrossLineOptions[] = [{ type: 'line', value: 'Feb', label: { text: 'X1' } }];

function crossLineOptions(crossLineClick = vi.fn()): AgCartesianChartOptions {
    return {
        data: [
            { x: 'Jan', y: 2 },
            { x: 'Feb', y: 8 },
        ],
        series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
        legend: { enabled: true },
        listeners: { crossLineClick },
        axes: {
            x: { type: 'category', crossLines: X_CROSS_LINES },
            y: {
                type: 'number',
                min: 0,
                max: 10,
                crossLines: [
                    { type: 'line', value: 3, label: { text: 'Y1' } },
                    { type: 'range', range: [5, 6] },
                ],
            },
        },
    };
}

function crossLineButtons() {
    return Array.from(document.querySelectorAll<HTMLButtonElement>('.ag-charts-proxy-cross-lines button'));
}

function buttonTexts() {
    return crossLineButtons().map((button) => button.textContent);
}

function pressKeyOnFocused(key: string) {
    document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key, code: key, bubbles: true }));
}

describe('CrossLinesDOMProxy', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    it('places the cross-line list after the series area and before the legend in the tab order', async () => {
        chart = await createChart(crossLineOptions());

        expect(getTabStopGroups()).toEqual([
            'ag-charts-series-area',
            'ag-charts-proxy-cross-lines',
            'ag-charts-proxy-legend-toolbar',
        ]);
    });

    it('lists the cross lines in axis order with only the first tabbable', async () => {
        chart = await createChart(crossLineOptions());

        expect(buttonTexts()).toEqual(['X1, Feb', 'Y1, 3', '5 - 6']);
        expect(crossLineButtons().map((button) => button.tabIndex)).toEqual([0, -1, -1]);
    });

    it('keeps axis order when an earlier axis gains its first cross lines', async () => {
        const options = crossLineOptions();
        options.axes!.x!.crossLines = undefined;
        chart = await createChart(options);
        expect(buttonTexts()).toEqual(['Y1, 3', '5 - 6']);

        await chart.updateDelta({ axes: { x: { crossLines: X_CROSS_LINES } } });
        await waitForChartStability(chart);
        expect(buttonTexts()).toEqual(['X1, Feb', 'Y1, 3', '5 - 6']);
    });

    it('keeps the cross lines of a recreated axis', async () => {
        chart = await createChart({
            ...crossLineOptions(),
            data: [
                { x: 1, y: 2 },
                { x: 4, y: 8 },
            ],
            axes: {
                x: { type: 'number', crossLines: [{ type: 'line', value: 2, label: { text: 'X1' } }] },
                y: { type: 'number', crossLines: [{ type: 'line', value: 3, label: { text: 'Y1' } }] },
            },
        });

        await chart.updateDelta({ axes: { x: { type: 'log' } } });
        await waitForChartStability(chart);
        expect(buttonTexts()).toEqual(['X1, 2', 'Y1, 3']);
    });

    it('moves focus through the list with the arrow keys', async () => {
        chart = await createChart(crossLineOptions());
        const buttons = crossLineButtons();

        buttons[0].focus();
        pressKeyOnFocused('ArrowDown');
        expect(document.activeElement).toBe(buttons[1]);
        pressKeyOnFocused('ArrowRight');
        expect(document.activeElement).toBe(buttons[2]);
        pressKeyOnFocused('ArrowDown');
        expect(document.activeElement).toBe(buttons[2]);
        pressKeyOnFocused('ArrowUp');
        expect(document.activeElement).toBe(buttons[1]);
        expect(crossLineButtons().map((button) => button.tabIndex)).toEqual([-1, 0, -1]);
    });

    it('fires crossLineClick for the focused cross line on Enter or Space', async () => {
        const crossLineClick = vi.fn();
        chart = await createChart(crossLineOptions(crossLineClick));

        // Browsers activate a focused button on Enter and Space by dispatching a click.
        crossLineButtons()[2].click();

        expect(crossLineClick).toHaveBeenCalledTimes(1);
        expect(crossLineClick).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'crossLineClick', axisId: 'y', crossLineType: 'range', range: [5, 6] })
        );
    });

    it('ignores a focused proxy whose cross line was replaced before the proxies are rebuilt', async () => {
        const crossLineClick = vi.fn();
        const options = crossLineOptions(crossLineClick);
        chart = await createChart(options);
        const yPlugin = getCrossLinesPlugin(deproxy(chart).axes.findById('y')!)!;
        const focused = crossLineButtons()[1];
        focused.focus();

        // Proxies rebuild just before the scene renders, so the button outlives its cross line until then.
        const applyOptions = yPlugin.applyOptions.bind(yPlugin);
        vi.spyOn(yPlugin, 'applyOptions').mockImplementation((crossLines) => {
            applyOptions(crossLines);
            focused.click();
        });
        await chart.update({ ...options, axes: { ...options.axes, y: { ...options.axes!.y, crossLines: [] } } });

        expect(crossLineClick).not.toHaveBeenCalled();
    });

    it('omits cross lines that are not clickable', async () => {
        const options = crossLineOptions();
        options.listeners = {};
        chart = await createChart(options);

        expect(crossLineButtons()).toEqual([]);
    });
});
