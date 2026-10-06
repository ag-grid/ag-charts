import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AgCartesianChartOptions, AgChartInstance } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';
import { deproxy, setupMockCanvas, setupMockConsole, waitForChartStability } from 'ag-charts-community-test';
import type { AgRangesButtonValueFunctionParams, AgRangesButtonValueSource } from 'ag-charts-types';

import { prepareEnterpriseTestOptions } from '../../test/utils';
import { Ranges } from './ranges';

describe('Ranges', () => {
    setupMockConsole();
    let chart: AgChartInstance;
    setupMockCanvas();

    afterEach(() => {
        if (chart != null) {
            chart.destroy();
            (chart as any) = undefined;
        }
    });

    describe('toolbar height caching', () => {
        // Exercises the private helper directly: JSDOM reports offsetHeight as 0, so a full-chart
        // test cannot drive the non-zero measurement path this cache is about.
        interface RangesInternals {
            getToolbarHeight(opts: object, toolbar: { getBounds(): { height: number } }): number;
            invalidateToolbarHeightCache(): void;
            isDropdown?: boolean;
            dropdownLabel?: string;
        }
        function createRanges(): RangesInternals {
            return Object.create(Ranges.prototype) as RangesInternals;
        }

        it('measures once and reuses the height while the key is unchanged', () => {
            const ranges = createRanges();
            const opts = {};
            const toolbar = { getBounds: vi.fn(() => ({ height: 24 })) };

            expect(ranges.getToolbarHeight(opts, toolbar)).toBe(24);
            expect(ranges.getToolbarHeight(opts, toolbar)).toBe(24);
            expect(toolbar.getBounds).toHaveBeenCalledTimes(1);
        });

        it('re-measures when the resolved options reference changes', () => {
            const ranges = createRanges();
            const toolbar = { getBounds: vi.fn(() => ({ height: 24 })) };

            ranges.getToolbarHeight({}, toolbar);
            ranges.getToolbarHeight({}, toolbar);

            expect(toolbar.getBounds).toHaveBeenCalledTimes(2);
        });

        it('re-measures when the shown toolbar toggles to the dropdown', () => {
            const ranges = createRanges();
            const opts = {};
            const toolbar = { getBounds: vi.fn(() => ({ height: 24 })) };

            ranges.isDropdown = false;
            ranges.getToolbarHeight(opts, toolbar);
            ranges.isDropdown = true;
            ranges.getToolbarHeight(opts, toolbar);

            expect(toolbar.getBounds).toHaveBeenCalledTimes(2);
        });

        // Text metrics are not part of the key, so the `font:load` listener must reset the cache;
        // without this a late webfont leaves the height pinned to fallback-font metrics.
        it('re-measures after the cache is invalidated by a font load', () => {
            const ranges = createRanges();
            const opts = {};
            const toolbar = { getBounds: vi.fn(() => ({ height: 24 })) };

            ranges.getToolbarHeight(opts, toolbar);
            ranges.invalidateToolbarHeightCache();

            expect(ranges.getToolbarHeight(opts, toolbar)).toBe(24);
            expect(toolbar.getBounds).toHaveBeenCalledTimes(2);
        });

        it('never caches a zero height (toolbar not yet laid out)', () => {
            const ranges = createRanges();
            const opts = {};
            const toolbar = { getBounds: vi.fn(() => ({ height: 0 })) };

            expect(ranges.getToolbarHeight(opts, toolbar)).toBe(0);
            expect(ranges.getToolbarHeight(opts, toolbar)).toBe(0);
            expect(toolbar.getBounds).toHaveBeenCalledTimes(2);
        });
    });

    describe('buttonSize', () => {
        const create = async (ranges: Record<string, unknown>) => {
            const options: AgCartesianChartOptions = prepareEnterpriseTestOptions({
                data: Array.from({ length: 20 }, (_, i) => ({ x: i, y: i * 10 })),
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
                ranges: { enabled: true, buttons: [{ label: 'All', value: [0, 19] }], ...ranges },
            } as any);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            return deproxy(chart as any) as any;
        };

        const rangeButtons = (proxy: any, toolbar: 'buttons' | 'dropdown') =>
            Array.from<HTMLElement>(
                proxy.ctx.agDocument.body.querySelectorAll(
                    `.ag-charts-range-buttons--${toolbar} .ag-charts-toolbar__button`
                )
            );

        it('sizes the range buttons and the dropdown button when set', async () => {
            const proxy = await create({ buttonSize: 44 });

            for (const toolbar of ['buttons', 'dropdown'] as const) {
                const buttons = rangeButtons(proxy, toolbar);
                expect(buttons.length).toBeGreaterThan(0);
                for (const button of buttons) {
                    expect(button.classList.contains('ag-charts-toolbar__button--sized')).toBe(true);
                    expect(button.style.getPropertyValue('--toolbar-button-size')).toBe('44px');
                }
            }
        });

        it('emits no sizing when unset, leaving minSize in effect', async () => {
            const proxy = await create({ minSize: 34 });

            for (const toolbar of ['buttons', 'dropdown'] as const) {
                for (const button of rangeButtons(proxy, toolbar)) {
                    expect(button.classList.contains('ag-charts-toolbar__button--sized')).toBe(false);
                    expect(button.style.getPropertyValue('--toolbar-button-size')).toBe('');
                }
            }
        });

        it('takes precedence over minSize', async () => {
            const proxy = await create({ buttonSize: 44, minSize: 34 });

            for (const button of rangeButtons(proxy, 'buttons')) {
                expect(button.style.getPropertyValue('--toolbar-button-size')).toBe('44px');
            }
        });

        it('resets the dropdown minimum width when the size changes', async () => {
            const ranges = {
                enabled: true,
                dropdown: { visible: 'always' },
                buttons: [{ label: 'All', value: [0, 19] }],
            };
            const proxy = await create({ ...ranges, buttonSize: 40 });
            const module = proxy.modulesManager.getModule('ranges');
            const withSize = (buttonSize: number) =>
                chart.update({
                    data: Array.from({ length: 20 }, (_, i) => ({ x: i, y: i * 10 })),
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    ranges: { ...ranges, buttonSize },
                } as any);

            module.dropdownMinWidth = 999;
            await withSize(40);
            await waitForChartStability(chart);
            expect(module.dropdownMinWidth).toBe(999);

            await withSize(50);
            await waitForChartStability(chart);
            expect(module.dropdownMinWidth).not.toBe(999);
        });

        // `getBounds()` prefers the inline width written during the previous layout, so a stale width
        // would hide the resized buttons from the overflow check and the alignment.
        it('re-measures both toolbars instead of reusing their inline widths when the size changes', async () => {
            const ranges = { enabled: true, buttons: [{ label: 'All', value: [0, 19] }] };
            const proxy = await create({ ...ranges, buttonSize: 40 });
            const toolbars = (['buttons', 'dropdown'] as const).map(
                (toolbar) =>
                    proxy.ctx.agDocument.body.querySelector(`.ag-charts-range-buttons--${toolbar}`) as HTMLElement
            );
            const withSize = (buttonSize: number) =>
                chart.update({
                    data: Array.from({ length: 20 }, (_, i) => ({ x: i, y: i * 10 })),
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    ranges: { ...ranges, buttonSize },
                } as any);
            const staleWidth = () => {
                for (const toolbar of toolbars) toolbar.style.width = '999px';
            };

            staleWidth();
            await withSize(40);
            await waitForChartStability(chart);
            expect(toolbars.map((toolbar) => toolbar.style.width)).toEqual(['999px', '999px']);

            staleWidth();
            await withSize(50);
            await waitForChartStability(chart);
            for (const toolbar of toolbars) {
                expect(toolbar.style.width).not.toBe('999px');
            }
        });
    });

    describe('AG-16886 button value function source parameter', () => {
        it('should pass source parameter to AgRangesButtonValueFunction', async () => {
            const receivedSources: AgRangesButtonValueSource[] = [];

            const options: AgCartesianChartOptions = prepareEnterpriseTestOptions({
                data: Array.from({ length: 20 }, (_, i) => ({ x: i, y: i * 10 })),
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
                ranges: {
                    enabled: true,
                    buttons: [
                        {
                            label: 'Custom',
                            value: ({ source }: AgRangesButtonValueFunctionParams) => {
                                receivedSources.push(source);
                                return [5, 15];
                            },
                        },
                    ],
                },
            } as any);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            // The range-check source should have been received during initial button enablement validation
            expect(receivedSources).toContain('range-check');
        });
    });

    describe('AG-16892 button value function params object', () => {
        it('should pass a params object with the domain and window bounds', async () => {
            const receivedParams: AgRangesButtonValueFunctionParams[] = [];

            const options: AgCartesianChartOptions = prepareEnterpriseTestOptions({
                data: Array.from({ length: 20 }, (_, i) => ({ x: i, y: i * 10 })),
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
                ranges: {
                    enabled: true,
                    buttons: [
                        {
                            label: 'Custom',
                            value: (params: AgRangesButtonValueFunctionParams) => {
                                receivedParams.push(params);
                                return [5, 15];
                            },
                        },
                    ],
                },
            } as any);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expect(receivedParams.length).toBeGreaterThan(0);
            const params = receivedParams[0];
            expect(typeof params.start).toBe('number');
            expect(typeof params.end).toBe('number');
            expect(typeof params.windowStart).toBe('number');
            expect(typeof params.windowEnd).toBe('number');
        });
    });

    describe('AG-17538 button value function context parameter', () => {
        interface RangesContext {
            tz: string;
        }

        it('should pass the chart-level context to the value function', async () => {
            const receivedContexts: Array<RangesContext | undefined> = [];

            const options: AgCartesianChartOptions = prepareEnterpriseTestOptions({
                data: Array.from({ length: 20 }, (_, i) => ({ x: i, y: i * 10 })),
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
                context: { tz: 'UTC' },
                ranges: {
                    enabled: true,
                    buttons: [
                        {
                            label: 'Custom',
                            value: ({ context }: AgRangesButtonValueFunctionParams<RangesContext>) => {
                                receivedContexts.push(context);
                                return [5, 15];
                            },
                        },
                    ],
                },
            } as any);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expect(receivedContexts.length).toBeGreaterThan(0);
            expect(receivedContexts[0]).toEqual({ tz: 'UTC' });
        });

        it('should pass undefined context when none is configured', async () => {
            const receivedContexts: Array<RangesContext | undefined> = [];

            const options: AgCartesianChartOptions = prepareEnterpriseTestOptions({
                data: Array.from({ length: 20 }, (_, i) => ({ x: i, y: i * 10 })),
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
                ranges: {
                    enabled: true,
                    buttons: [
                        {
                            label: 'Custom',
                            value: ({ context }: AgRangesButtonValueFunctionParams) => {
                                receivedContexts.push(context as RangesContext | undefined);
                                return [5, 15];
                            },
                        },
                    ],
                },
            } as any);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expect(receivedContexts.length).toBeGreaterThan(0);
            expect(receivedContexts[0]).toBeUndefined();
        });
    });

    describe('theme params', () => {
        const resolvedRanges = async (params: Record<string, unknown>) => {
            const options: AgCartesianChartOptions = prepareEnterpriseTestOptions({
                data: Array.from({ length: 20 }, (_, i) => ({ x: i, y: i * 10 })),
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
                ranges: { enabled: true, buttons: [{ label: 'All', value: [0, 19] }] },
                theme: { params },
            } as any);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            return (deproxy(chart as any) as any).ctx.chartState.getValue('options', 'ranges');
        };

        it('button text follows buttonTextColor, not chromeTextColor', async () => {
            const ranges = await resolvedRanges({ buttonTextColor: 'red', chromeTextColor: 'blue' });

            expect(ranges.button.textColor).toBe('red');
        });

        it('button hover text follows buttonTextColor', async () => {
            const ranges = await resolvedRanges({ buttonTextColor: 'red', chromeTextColor: 'blue' });

            expect(ranges.button.hover.textColor).toBe('red');
        });

        it('disabled button text fades buttonTextColor, not chromeTextColor', async () => {
            const { textColor } = (await resolvedRanges({ buttonTextColor: 'red', chromeTextColor: 'blue' })).button
                .disabled;
            chart.destroy();
            const expected = (await resolvedRanges({ chromeTextColor: 'red' })).button.disabled.textColor;

            expect(textColor).toBe(expected);
        });

        it('button text falls back to chromeTextColor when buttonTextColor is unset', async () => {
            const ranges = await resolvedRanges({ chromeTextColor: 'blue' });

            expect(ranges.button.textColor).toBe('blue');
        });

        it('button text ignores textColor once chromeTextColor is set', async () => {
            const ranges = await resolvedRanges({ textColor: 'green', chromeTextColor: 'blue' });

            expect(ranges.button.textColor).toBe('blue');
        });

        it('button states keep their default styling', async () => {
            const ranges = await resolvedRanges({ borderColor: 'gray', accentColor: 'teal' });

            expect(ranges.button.hover.fill).toBe(ranges.button.active.fill);
            expect(ranges.button.hover.stroke).toBe('gray');
            expect(ranges.button.disabled.stroke).toBe('gray');
            expect(ranges.button.active.stroke).toBe('teal');
            expect(ranges.button.active.textColor).toBe('teal');
        });

        it('button states follow the button state params', async () => {
            const ranges = await resolvedRanges({
                buttonHoverBackgroundColor: 'rgb(1, 1, 1)',
                buttonHoverTextColor: 'rgb(2, 2, 2)',
                buttonHoverBorder: { color: 'rgb(3, 3, 3)' },
                buttonActiveBackgroundColor: 'rgb(4, 4, 4)',
                buttonActiveTextColor: 'rgb(5, 5, 5)',
                buttonActiveBorder: { color: 'rgb(6, 6, 6)' },
                buttonDisabledBackgroundColor: 'rgb(7, 7, 7)',
                buttonDisabledTextColor: 'rgb(8, 8, 8)',
                buttonDisabledBorder: { color: 'rgb(9, 9, 9)' },
            });

            expect(ranges.button.hover).toMatchObject({
                fill: 'rgb(1, 1, 1)',
                textColor: 'rgb(2, 2, 2)',
                stroke: 'rgb(3, 3, 3)',
            });
            expect(ranges.button.active).toMatchObject({
                fill: 'rgb(4, 4, 4)',
                textColor: 'rgb(5, 5, 5)',
                stroke: 'rgb(6, 6, 6)',
            });
            expect(ranges.button.disabled).toMatchObject({
                fill: 'rgb(7, 7, 7)',
                textColor: 'rgb(8, 8, 8)',
                stroke: 'rgb(9, 9, 9)',
            });
        });

        it('hover and disabled states inherit a user-set text colour and stroke', async () => {
            const options: AgCartesianChartOptions = prepareEnterpriseTestOptions({
                data: Array.from({ length: 20 }, (_, i) => ({ x: i, y: i * 10 })),
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
                ranges: {
                    enabled: true,
                    textColor: 'red',
                    stroke: 'green',
                    buttons: [{ label: 'All', value: [0, 19] }],
                },
            } as any);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            const ranges = (deproxy(chart as any) as any).ctx.chartState.getValue('options', 'ranges');

            expect(ranges.button.hover.textColor).toBe('red');
            expect(ranges.button.hover.stroke).toBe('green');
            expect(ranges.button.disabled.stroke).toBe('green');
        });

        it('a false state border hides the border colour', async () => {
            const ranges = await resolvedRanges({ buttonHoverBorder: false });

            expect(ranges.button.hover.stroke).toBe('transparent');
        });

        it('boolean state borders use borderColor', async () => {
            const ranges = await resolvedRanges({ borderColor: 'purple', buttonActiveBorder: true });

            expect(ranges.button.active.stroke).toBe('purple');
        });

        it('button padding defaults to the button padding params', async () => {
            const ranges = await resolvedRanges({});

            expect(ranges.button.padding).toEqual({ top: 6, right: 9, bottom: 6, left: 9 });
        });

        it('button padding follows the button padding params', async () => {
            const ranges = await resolvedRanges({ buttonHorizontalPadding: 12, buttonVerticalPadding: 3 });

            expect(ranges.button.padding).toEqual({ top: 3, right: 12, bottom: 3, left: 12 });
        });

        const resolvedUserPadding = async (padding: unknown) => {
            const options: AgCartesianChartOptions = prepareEnterpriseTestOptions({
                data: Array.from({ length: 20 }, (_, i) => ({ x: i, y: i * 10 })),
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                ranges: { enabled: true, padding, buttons: [{ label: 'All', value: [0, 19] }] },
                theme: { params: { buttonHorizontalPadding: 12 } },
            } as any);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            return (deproxy(chart as any) as any).ctx.chartState.getValue('options', 'ranges').button.padding;
        };

        it('a user-set padding number replaces the button padding params', async () => {
            expect(await resolvedUserPadding(4)).toBe(4);
        });

        it('a user-set partial padding object replaces the button padding params', async () => {
            expect(await resolvedUserPadding({ top: 2 })).toEqual({ top: 2 });
        });
    });
});
