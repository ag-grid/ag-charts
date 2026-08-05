import { afterEach, describe, expect, vi } from 'vitest';

import type { AgCaptionListeners, AgCaptionType, AgCartesianChartOptions } from 'ag-charts-types';

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

const CAPTION_TYPES: AgCaptionType[] = ['title', 'subtitle', 'footnote'];

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
function captionElement(caption: ChartCaption): HTMLElement {
    const { proxyText } = caption as unknown as { proxyText?: { getElement(): HTMLElement } };
    if (proxyText == null) {
        throw new Error('caption has no proxy element');
    }
    return proxyText.getElement();
}

async function clickCaption(caption: ChartCaption, type: 'click' | 'dblclick' = 'click') {
    captionElement(caption).dispatchEvent(new MouseEvent(type, { bubbles: true }));
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
        test.each(CAPTION_TYPES)('AC1/AC3: clicking the %s fires `click` with that discriminator', async (key) => {
            const click = vi.fn();
            chart = await createChart(options(withListeners({ click })));

            await clickCaption(chart[key]);

            expect(click).toHaveBeenCalledTimes(1);
            expect(click).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'click',
                    caption: key,
                    text: `${key[0].toUpperCase()}${key.slice(1)} text`,
                    event: expect.any(MouseEvent),
                })
            );
        });

        test.each(CAPTION_TYPES)('AC2/AC3: double-clicking the %s fires `doubleClick`', async (key) => {
            const doubleClick = vi.fn();
            chart = await createChart(options(withListeners({ doubleClick })));

            await clickCaption(chart[key], 'dblclick');

            expect(doubleClick).toHaveBeenCalledTimes(1);
            expect(doubleClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'doubleClick', caption: key }));
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
        test.each(CAPTION_TYPES)('AC6: clicking the %s fires `captionClick`', async (key) => {
            const captionClick = vi.fn();
            chart = await createChart(options({ listeners: { captionClick } }));

            await clickCaption(chart[key]);

            expect(captionClick).toHaveBeenCalledTimes(1);
            expect(captionClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'captionClick', caption: key }));
        });

        test('AC6: double-clicking a caption fires `captionDoubleClick`', async () => {
            const captionDoubleClick = vi.fn();
            chart = await createChart(options({ listeners: { captionDoubleClick } }));

            await clickCaption(chart.footnote, 'dblclick');

            expect(captionDoubleClick).toHaveBeenCalledTimes(1);
            expect(captionDoubleClick).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'captionDoubleClick', caption: 'footnote' })
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

    describe('TC1: only present captions are interactive', () => {
        test('an unconfigured subtitle and footnote have no proxy element', async () => {
            const click = vi.fn();
            chart = await createChart({
                data: [
                    { x: 'Jan', y: 2 },
                    { x: 'Feb', y: 8 },
                ],
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                title: { text: 'Title text', listeners: { click } },
            });

            expect(() => captionElement(chart.subtitle)).toThrow();
            expect(() => captionElement(chart.footnote)).toThrow();

            await clickCaption(chart.title);
            expect(click).toHaveBeenCalledTimes(1);
        });

        test('a disabled caption is not clickable', async () => {
            const click = vi.fn();
            chart = await createChart(
                options({
                    title: { text: 'Title text', enabled: false, listeners: { click } },
                    subtitle: { text: 'Subtitle text', listeners: { click } },
                })
            );

            expect(() => captionElement(chart.title)).toThrow();

            await clickCaption(chart.subtitle);
            expect(click).toHaveBeenCalledTimes(1);
        });
    });

    describe('cursor affordance', () => {
        test('a caption with a listener gets a pointer cursor, one without does not', async () => {
            chart = await createChart(
                options({
                    title: { text: 'Title text', listeners: { click: vi.fn() } },
                    subtitle: { text: 'Subtitle text' },
                })
            );

            expect(captionElement(chart.title).style.cursor).toBe('pointer');
            expect(captionElement(chart.subtitle).style.cursor).toBe('');
        });

        test('a chart-level listener makes every caption a pointer cursor', async () => {
            chart = await createChart(options({ listeners: { captionClick: vi.fn() } }));

            for (const key of CAPTION_TYPES) {
                expect(captionElement(chart[key]).style.cursor).toBe('pointer');
            }
        });
    });
});
