import { afterEach, describe, expect, vi } from 'vitest';

import type { AgCaptionListeners, AgCartesianChartOptions } from 'ag-charts-types';

import { AgCharts } from '../api/agCharts';
import type { Chart } from './chart';
import type { ChartCaption } from './chartCaption';
import {
    createChart,
    delay,
    deproxy,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from './test/utils';
import type { AgChartProxy } from './test/utils';

function options(overrides: Partial<AgCartesianChartOptions> = {}): AgCartesianChartOptions {
    return {
        data: [
            { x: 'Jan', y: 2 },
            { x: 'Feb', y: 8 },
        ],
        series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
        title: { text: 'Title text' },
        subtitle: { text: 'Subtitle text' },
        footnote: { text: 'Footnote text' },
        ...overrides,
    };
}

/** Captions with `listeners` on all three, so one options factory drives the per-caption cases. */
function withListeners(listeners: AgCaptionListeners): Partial<AgCartesianChartOptions> {
    return {
        title: { text: 'Title text', listeners },
        subtitle: { text: 'Subtitle text', listeners },
        footnote: { text: 'Footnote text', listeners },
    };
}

/**
 * Captions are click targets via their accessibility proxy element, not via canvas hit-testing, so
 * the test drives a real DOM event on that element rather than going through `clickAction`.
 * `bubbles` matches a genuine click, so the event also reaches the chart-background handler that
 * AC4 requires to stay silent.
 */
function captionElement(caption: ChartCaption): HTMLElement | undefined {
    const { proxyText } = caption as unknown as { proxyText?: { getElement(): HTMLElement } };
    return proxyText?.getElement();
}

async function clickCaption(caption: ChartCaption, type: 'click' | 'dblclick' = 'click') {
    const element = captionElement(caption);
    if (element == null) {
        throw new Error('caption has no proxy element');
    }
    element.dispatchEvent(new MouseEvent(type, { bubbles: true }));
    return delay(50);
}

/** Clicks a caption only if it has a click target, for the cases where it should not have one. */
async function clickCaptionIfPresent(caption: ChartCaption) {
    captionElement(caption)?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return delay(50);
}

describe('Caption listeners', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Chart;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    describe('caption-level listeners', () => {
        test('AC1: clicking the title fires `click` with the title discriminator', async () => {
            const click = vi.fn();
            chart = await createChart(options(withListeners({ click })));

            await clickCaption(chart.title);

            expect(click).toHaveBeenCalledTimes(1);
            expect(click).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'click',
                    captionType: 'title',
                    text: 'Title text',
                    event: expect.any(MouseEvent),
                })
            );
        });

        test('AC3: clicking the subtitle fires `click` with the subtitle discriminator', async () => {
            const click = vi.fn();
            chart = await createChart(options(withListeners({ click })));

            await clickCaption(chart.subtitle);

            expect(click).toHaveBeenCalledTimes(1);
            expect(click).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'click', captionType: 'subtitle', text: 'Subtitle text' })
            );
        });

        test('AC3: clicking the footnote fires `click` with the footnote discriminator', async () => {
            const click = vi.fn();
            chart = await createChart(options(withListeners({ click })));

            await clickCaption(chart.footnote);

            expect(click).toHaveBeenCalledTimes(1);
            expect(click).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'click', captionType: 'footnote', text: 'Footnote text' })
            );
        });

        test('AC2: double-clicking the footnote fires `doubleClick`', async () => {
            const doubleClick = vi.fn();
            chart = await createChart(options(withListeners({ doubleClick })));

            await clickCaption(chart.footnote, 'dblclick');

            expect(doubleClick).toHaveBeenCalledTimes(1);
            expect(doubleClick).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'doubleClick', captionType: 'footnote' })
            );
        });

        // The browser precedes every `dblclick` with two `click` events, so both listeners fire.
        test('AC2: a real double-click sequence fires `click` twice and `doubleClick` once', async () => {
            const click = vi.fn();
            const doubleClick = vi.fn();
            chart = await createChart(options(withListeners({ click, doubleClick })));

            await clickCaption(chart.title);
            await clickCaption(chart.title);
            await clickCaption(chart.title, 'dblclick');

            expect(click).toHaveBeenCalledTimes(2);
            expect(doubleClick).toHaveBeenCalledTimes(1);
        });

        test('AC3: clicking one caption does not fire the others', async () => {
            const titleClick = vi.fn();
            const subtitleClick = vi.fn();
            const footnoteClick = vi.fn();
            chart = await createChart(
                options({
                    title: { text: 'Title text', listeners: { click: titleClick } },
                    subtitle: { text: 'Subtitle text', listeners: { click: subtitleClick } },
                    footnote: { text: 'Footnote text', listeners: { click: footnoteClick } },
                })
            );

            await clickCaption(chart.subtitle);

            expect(subtitleClick).toHaveBeenCalledTimes(1);
            expect(titleClick).not.toHaveBeenCalled();
            expect(footnoteClick).not.toHaveBeenCalled();
        });

        test('the chart `context` is passed to the listener', async () => {
            const click = vi.fn();
            const context = { source: 'unit-test' };
            chart = await createChart(options({ ...withListeners({ click }), context }));

            await clickCaption(chart.title);

            expect(click).toHaveBeenCalledWith(expect.objectContaining({ context }));
        });

        test('listeners added by a later update are picked up', async () => {
            const click = vi.fn();
            const proxy = AgCharts.create(prepareTestOptions(options())) as AgChartProxy;
            chart = deproxy(proxy);
            await waitForChartStability(chart);

            await proxy.update(prepareTestOptions(options(withListeners({ click }))));
            await waitForChartStability(chart);
            await clickCaption(chart.title);

            expect(click).toHaveBeenCalledTimes(1);
        });
    });

    describe('chart-level listeners', () => {
        test('AC6: clicking the title fires `captionClick`', async () => {
            const captionClick = vi.fn();
            chart = await createChart(options({ listeners: { captionClick } }));

            await clickCaption(chart.title);

            expect(captionClick).toHaveBeenCalledTimes(1);
            expect(captionClick).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'captionClick', captionType: 'title', text: 'Title text' })
            );
        });

        test('AC6: clicking the footnote fires the same `captionClick` listener', async () => {
            const captionClick = vi.fn();
            chart = await createChart(options({ listeners: { captionClick } }));

            await clickCaption(chart.footnote);

            expect(captionClick).toHaveBeenCalledTimes(1);
            expect(captionClick).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'captionClick', captionType: 'footnote' })
            );
        });

        test('AC6: double-clicking a caption fires `captionDoubleClick`', async () => {
            const captionDoubleClick = vi.fn();
            chart = await createChart(options({ listeners: { captionDoubleClick } }));

            await clickCaption(chart.footnote, 'dblclick');

            expect(captionDoubleClick).toHaveBeenCalledTimes(1);
            expect(captionDoubleClick).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'captionDoubleClick', captionType: 'footnote' })
            );
        });

        test('AC6: the chart-level listener fires alongside the caption-level one', async () => {
            const click = vi.fn();
            const captionClick = vi.fn();
            chart = await createChart(options({ ...withListeners({ click }), listeners: { captionClick } }));

            await clickCaption(chart.title);

            expect(click).toHaveBeenCalledTimes(1);
            expect(captionClick).toHaveBeenCalledTimes(1);
        });
    });

    // A caption click must not double up as a click on the chart background. The chart-level `click`
    // listener only fires for events targeting the chart container itself, so a caption click is
    // already excluded — these tests pin that down so the exclusion cannot regress silently.
    describe('AC4/AC5: interaction with the chart-background handler', () => {
        // Control for the two negative assertions below: proves the chart `click` listener really is
        // reachable in this setup, so "not called" means the caption excluded it rather than the test
        // never being able to trigger it.
        test('a click on the chart background does fire the chart `click` listener', async () => {
            const chartClick = vi.fn();
            chart = await createChart(options({ listeners: { click: chartClick } }));

            chart.ctx.widgets.containerWidget.getElement().dispatchEvent(new MouseEvent('click', { bubbles: true }));
            await delay(50);

            expect(chartClick).toHaveBeenCalledTimes(1);
        });

        test('AC4: a caption click does not also fire the chart `click` listener', async () => {
            const captionClickListener = vi.fn();
            const chartClick = vi.fn();
            chart = await createChart(
                options({ ...withListeners({ click: captionClickListener }), listeners: { click: chartClick } })
            );

            await clickCaption(chart.title);

            expect(captionClickListener).toHaveBeenCalledTimes(1);
            expect(chartClick).not.toHaveBeenCalled();
        });

        test('AC5: with no caption listener nothing is fired', async () => {
            const chartClick = vi.fn();
            chart = await createChart(options({ listeners: { click: chartClick } }));

            await clickCaption(chart.title);

            expect(chartClick).not.toHaveBeenCalled();
        });
    });

    // The trailing positive click in each case proves the listener is wired up at all, so the
    // preceding `not.toHaveBeenCalled()` cannot pass for the wrong reason.
    describe('TC1: only present captions are interactive', () => {
        // The chart-level listener is used here because it needs no per-caption configuration: adding
        // a `subtitle` key at all would give it the theme's default text and make it a real caption.
        test('an unconfigured subtitle and footnote are not clickable', async () => {
            const captionClick = vi.fn();
            chart = await createChart({
                data: [
                    { x: 'Jan', y: 2 },
                    { x: 'Feb', y: 8 },
                ],
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                title: { text: 'Title text' },
                listeners: { captionClick },
            });

            await clickCaptionIfPresent(chart.subtitle);
            await clickCaptionIfPresent(chart.footnote);
            expect(captionClick).not.toHaveBeenCalled();

            await clickCaption(chart.title);
            expect(captionClick).toHaveBeenCalledTimes(1);
            expect(captionClick).toHaveBeenCalledWith(expect.objectContaining({ captionType: 'title' }));
        });

        test('a disabled caption is not clickable', async () => {
            const click = vi.fn();
            chart = await createChart(
                options({
                    title: { text: 'Title text', enabled: false, listeners: { click } },
                    subtitle: { text: 'Subtitle text', listeners: { click } },
                })
            );

            await clickCaptionIfPresent(chart.title);
            expect(click).not.toHaveBeenCalled();

            await clickCaption(chart.subtitle);
            expect(click).toHaveBeenCalledTimes(1);
        });
    });
});
