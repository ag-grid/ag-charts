import { afterEach, describe, expect, it, jest } from '@jest/globals';

import { getDocument } from 'ag-charts-core';
import { type AgChartOptions } from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import type { AgChartProxy, Chart } from '../test/utils';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    createChart,
    expectWarningsCalls,
    extractImageData,
    hoverAction,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';

describe('Tooltip', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();
    let chart: AgChartProxy | Chart;

    afterEach(() => {
        chart?.destroy();
    });

    const compare = async () => {
        await waitForChartStability(chart);
        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    describe('Validation', () => {
        it('should show 1 warning for invalid tooltip value', async () => {
            chart = await createChart({
                data: [
                    { month: 'Jun', sweaters: 50 },
                    { month: 'Jul', sweaters: 70 },
                    { month: 'Aug', sweaters: 60 },
                ],
                series: [{ type: 'line', xKey: 'month', yKey: 'sweaters', yName: 'Sweaters Made' }],
                tooltip: {
                    position: '2' as any,
                },
            });

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - Option \`tooltip.position\` cannot be set to \`"2"\`; expecting an object, ignoring.",
  ],
]
`);
        });

        it('should show 1 warning for invalid tooltip anchorTo value', async () => {
            chart = await createChart({
                data: [
                    { month: 'Jun', sweaters: 50 },
                    { month: 'Jul', sweaters: 70 },
                    { month: 'Aug', sweaters: 60 },
                ],
                series: [{ type: 'line', xKey: 'month', yKey: 'sweaters', yName: 'Sweaters Made' }],
                tooltip: {
                    position: { anchorTo: 'ponter' as any, xOffset: 80, yOffset: 80 },
                },
            });

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - Option \`tooltip.position.anchorTo\` cannot be set to \`"ponter"\`; expecting a keyword such as 'pointer', 'node' or 'chart', ignoring.",
  ],
]
`);
        });
    });

    describe('Realtime', () => {
        it('should update tooltip correctly', async () => {
            // See AG-10409: The tooltip should update when the mouse stays in place but the data is updated.
            const opts: AgChartOptions = prepareTestOptions({});
            opts.data = [
                { step: 0, voltage: 1.362460821419385 },
                { step: 1, voltage: 1.3072694395877953 },
                { step: 2, voltage: 1.1967684308904354 },
                { step: 3, voltage: 1.2362572382997417 },
                { step: 4, voltage: 1.479504186572628 },
                { step: 5, voltage: 1.401144010767596 },
                { step: 6, voltage: 1.2192725536972913 },
                { step: 7, voltage: 1.1097886105628154 },
                { step: 8, voltage: 1.4869931693640273 },
                { step: 9, voltage: 1.1720928254975662 },
            ];
            opts.series = [{ type: 'line', xKey: 'step', yKey: 'voltage' }];

            chart = AgCharts.create(opts) as AgChartProxy;
            await waitForChartStability(chart);

            const nextValue = async (step: number, voltage: number) => {
                opts.data = opts.data?.slice(1);
                opts.data?.push({ step, voltage });
                await (chart as AgChartProxy).update(opts);
                await waitForChartStability(chart);
            };

            await hoverAction(400, 300)(chart);
            await waitForChartStability(chart);

            const element = Array.from(getDocument('body').getElementsByClassName('ag-charts-tooltip'));
            expect(element.map((e) => e.textContent).join('')).toEqual('4 1.48');

            await nextValue(10, 1.3249187570726666);
            expect(element.map((e) => e.textContent).join('')).toEqual('5 1.401');

            await nextValue(11, 1.2651169069335022);
            expect(element.map((e) => e.textContent).join('')).toEqual('6 1.219');

            await nextValue(12, 1.3627720015958902);
            expect(element.map((e) => e.textContent).join('')).toEqual('7 1.11');

            await nextValue(13, 1.490244608234256);
            expect(element.map((e) => e.textContent).join('')).toEqual('8 1.487');

            await nextValue(14, 1.490244608234256);
            expect(element.map((e) => e.textContent).join('')).toEqual('9 1.172');
        });
    });

    describe('AG-11591 Range', () => {
        const testHover = async (x: number, y: number) => {
            await hoverAction(x, y)(chart);
            await compare();
        };

        it('should use the same default behaviour as v9', async () => {
            chart = await createChart({
                data: [
                    { x: 'Q1', a: 22, b: 25, L: 3.4 },
                    { x: 'Q2', a: 18, b: 13, L: 4 },
                ],
                series: [
                    { type: 'bar', xKey: 'x', yKey: 'a' },
                    { type: 'bar', xKey: 'x', yKey: 'b' },
                    { type: 'line', xKey: 'x', yKey: 'L', yKeyAxis: 'ySecondary' },
                ],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                    ySecondary: { type: 'number', position: 'right' },
                },
            });
            await testHover(221, 256); // highlight datum Q1 series L
            await testHover(666, 251); // highlight datum Q2 series L
            await testHover(152, 217); // highlight datum Q1 series a
            await testHover(659, 327); // highlight datum Q2 series b
        });

        it('should use chart tooltip.range as default', async () => {
            chart = await createChart({
                tooltip: { range: 20 },
                data: [{ x: 'Q1', a: 22 }],
                series: [{ type: 'bar', xKey: 'x', yKey: 'a' }],
            });
            await testHover(58, 28); // highlight nothing
            await testHover(160, 137); // highlight datum Q1 series b
        });

        it('should use series tooltip.range as default', async () => {
            chart = await createChart({
                data: [{ x: 'Q1', a: 22, b: 25 }],
                series: [
                    { type: 'bar', xKey: 'x', yKey: 'a' },
                    { type: 'bar', xKey: 'x', yKey: 'b', tooltip: { range: 'nearest' } },
                ],
            });
            await testHover(250, 250); // exact match on series a
            await testHover(100, 300); // nearest match on series b (even though series a is nearest)
        });

        it('should prefer series tooltip.range over chart tooltip.range', async () => {
            chart = await createChart({
                tooltip: { range: 'nearest' },
                data: [{ x: 'Q1', a: 22 }],
                series: [{ type: 'bar', xKey: 'x', yKey: 'a', tooltip: { range: 20 } }],
            });
            await testHover(58, 28); // no highlight match
            await testHover(140, 140); // match within range <= 20
        });
    });

    describe('Symbol', () => {
        it('should allow disabling symbol', async () => {
            chart = await createChart({
                data: [{ step: 0, voltage: 1 }],
                series: [
                    {
                        type: 'bar',
                        xKey: 'step',
                        yKey: 'voltage',
                        tooltip: {
                            renderer() {
                                return { symbol: { marker: { enabled: false } } };
                            },
                        },
                    },
                ],
                tooltip: {
                    mode: 'shared',
                },
            });
            await hoverAction(400, 300)(chart);
            await waitForChartStability(chart);

            const element = Array.from(getDocument('body').getElementsByClassName('ag-charts-tooltip')).at(0);
            expect(element?.innerHTML).not.toContain('ag-charts-tooltip-symbol');
        });

        it('should allow disabling symbol line only', async () => {
            chart = await createChart({
                data: [{ step: 0, voltage: 1 }],
                series: [
                    {
                        type: 'line',
                        xKey: 'step',
                        yKey: 'voltage',
                        tooltip: {
                            renderer() {
                                return { symbol: { line: { enabled: false } } };
                            },
                        },
                    },
                ],
                tooltip: {
                    mode: 'shared',
                },
            });
            await hoverAction(400, 300)(chart);
            await waitForChartStability(chart);

            const element = Array.from(getDocument('body').getElementsByClassName('ag-charts-tooltip')).at(0);
            expect(element?.innerHTML).toContain('ag-charts-tooltip-symbol');
            expect(element?.innerHTML).toContain('<path');
            expect(element?.innerHTML).not.toContain('<line');
        });

        it('should allow disabling symbol marker only', async () => {
            chart = await createChart({
                data: [{ step: 0, voltage: 1 }],
                series: [
                    {
                        type: 'line',
                        xKey: 'step',
                        yKey: 'voltage',
                        tooltip: {
                            renderer() {
                                return { symbol: { marker: { enabled: false } } };
                            },
                        },
                    },
                ],
                tooltip: {
                    mode: 'shared',
                },
            });
            await hoverAction(400, 300)(chart);
            await waitForChartStability(chart);

            const element = Array.from(getDocument('body').getElementsByClassName('ag-charts-tooltip')).at(0);
            expect(element?.innerHTML).toContain('ag-charts-tooltip-symbol');
            expect(element?.innerHTML).not.toContain('<path');
            expect(element?.innerHTML).toContain('<line');
        });

        it('should allow customizing symbol fill and shape', async () => {
            chart = await createChart({
                data: [{ step: 0, voltage: 1 }],
                series: [
                    {
                        type: 'line',
                        xKey: 'step',
                        yKey: 'voltage',
                        tooltip: {
                            renderer() {
                                return { symbol: { marker: { fill: 'red', shape: 'square' } } };
                            },
                        },
                    },
                ],
                tooltip: {
                    mode: 'shared',
                },
            });
            await hoverAction(400, 300)(chart);
            await waitForChartStability(chart);

            const element = Array.from(getDocument('body').getElementsByClassName('ag-charts-tooltip')).at(0);
            expect(element?.innerHTML).toContain('ag-charts-tooltip-symbol');
            expect(element?.innerHTML).toContain('d="M 4 0 L 16 0 L 16 12 L 4 12 Z"');
            expect(element?.innerHTML).toContain('fill="red"');
        });

        it('should render symbol line when user specifies it on non-line series', async () => {
            chart = await createChart({
                data: [{ step: 0, voltage: 1 }],
                series: [
                    {
                        type: 'bar',
                        xKey: 'step',
                        yKey: 'voltage',
                        tooltip: {
                            renderer() {
                                return { symbol: { line: { enabled: true, stroke: 'red', strokeWidth: 2 } } };
                            },
                        },
                    },
                ],
                tooltip: {
                    mode: 'shared',
                },
            });
            await hoverAction(400, 300)(chart);
            await waitForChartStability(chart);

            const element = Array.from(getDocument('body').getElementsByClassName('ag-charts-tooltip')).at(0);
            expect(element?.innerHTML).toContain('<line');
            expect(element?.innerHTML).toContain('stroke="red"');
        });

        it('should default line stroke properties from marker when not specified', async () => {
            chart = await createChart({
                data: [{ step: 0, voltage: 1 }],
                series: [
                    {
                        type: 'bar',
                        xKey: 'step',
                        yKey: 'voltage',
                        stroke: 'purple',
                        strokeWidth: 3,
                        tooltip: {
                            renderer() {
                                return {
                                    symbol: {
                                        marker: { stroke: 'purple', strokeWidth: 3 },
                                        line: { enabled: true },
                                    },
                                };
                            },
                        },
                    },
                ],
                tooltip: {
                    mode: 'shared',
                },
            });
            await hoverAction(400, 300)(chart);
            await waitForChartStability(chart);

            const element = Array.from(getDocument('body').getElementsByClassName('ag-charts-tooltip')).at(0);
            expect(element?.innerHTML).toContain('<line');
            expect(element?.innerHTML).toContain('stroke="purple"');
        });

        it('should default line.enabled to true when user provides line properties', async () => {
            chart = await createChart({
                data: [{ step: 0, voltage: 1 }],
                series: [
                    {
                        type: 'bar',
                        xKey: 'step',
                        yKey: 'voltage',
                        tooltip: {
                            renderer() {
                                return { symbol: { line: { stroke: 'orange' } } };
                            },
                        },
                    },
                ],
                tooltip: {
                    mode: 'shared',
                },
            });
            await hoverAction(400, 300)(chart);
            await waitForChartStability(chart);

            const element = Array.from(getDocument('body').getElementsByClassName('ag-charts-tooltip')).at(0);
            expect(element?.innerHTML).toContain('<line');
        });

        it('should not render line when user explicitly sets enabled to false on non-line series', async () => {
            chart = await createChart({
                data: [{ step: 0, voltage: 1 }],
                series: [
                    {
                        type: 'bar',
                        xKey: 'step',
                        yKey: 'voltage',
                        tooltip: {
                            renderer() {
                                return { symbol: { line: { enabled: false, stroke: 'red' } } };
                            },
                        },
                    },
                ],
                tooltip: {
                    mode: 'shared',
                },
            });
            await hoverAction(400, 300)(chart);
            await waitForChartStability(chart);

            const element = Array.from(getDocument('body').getElementsByClassName('ag-charts-tooltip')).at(0);
            expect(element?.innerHTML).not.toContain('<line');
        });
    });

    describe('AG-16272 Missing Values', () => {
        it('should not show rows for series with missing data in shared tooltips', async () => {
            chart = await createChart({
                data: [
                    { x: 'Q1', y1: 10, y2: 20, y3: null },
                    { x: 'Q2', y1: 15, y2: 25, y3: 30 },
                ],
                series: [
                    { type: 'bar', xKey: 'x', yKey: 'y1', yName: 'Series 1' },
                    { type: 'bar', xKey: 'x', yKey: 'y2', yName: 'Series 2' },
                    { type: 'bar', xKey: 'x', yKey: 'y3', yName: 'Series 3' },
                ],
                tooltip: {
                    mode: 'shared',
                },
            });
            // Hover over the first bar group (Q1)
            await hoverAction(200, 250)(chart);
            await waitForChartStability(chart);

            const element = Array.from(getDocument('body').getElementsByClassName('ag-charts-tooltip')).at(0);
            const content = element?.textContent ?? '';
            // Should contain Series 1 and 2, but not Series 3 (missing data)
            expect(content).toContain('Series 1');
            expect(content).toContain('Series 2');
            expect(content).not.toContain('Series 3');
        });

        it('should not show empty row for missing bubble size', async () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
            try {
                chart = await createChart({
                    data: [
                        { x: 10, y: 20, size: 30, age: 25 },
                        { x: 15, y: 25 }, // Missing size and age
                    ],
                    series: [
                        {
                            type: 'bubble',
                            xKey: 'x',
                            xName: 'X Value',
                            yKey: 'y',
                            yName: 'Y Value',
                            sizeKey: 'size',
                            sizeName: 'Size',
                            labelKey: 'age',
                            labelName: 'Age',
                        },
                    ],
                });
                // Hover the second bubble (at far right, missing size and age)
                await hoverAction(500, 300)(chart);
                await waitForChartStability(chart);

                const element = Array.from(getDocument('body').getElementsByClassName('ag-charts-tooltip')).at(0);
                const content = element?.textContent ?? '';
                // Should show X and Y, but not Size or Age
                expect(content).toContain('X Value');
                expect(content).toContain('Y Value');
                expect(content).not.toContain('Size');
                expect(content).not.toContain('Age');
            } finally {
                consoleWarnSpy.mockRestore();
            }
        });

        it('should show label with empty string value from custom renderer', async () => {
            chart = await createChart({
                data: [{ x: 'Q1', y: 10 }],
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        tooltip: {
                            renderer: () => {
                                return {
                                    data: [
                                        { label: 'label 1', value: '' },
                                        { label: 'label 2', value: 'value 2' },
                                    ],
                                };
                            },
                        },
                    },
                ],
            });
            await hoverAction(400, 300)(chart);
            await waitForChartStability(chart);

            const element = Array.from(getDocument('body').getElementsByClassName('ag-charts-tooltip')).at(0);
            const content = element?.textContent ?? '';
            // Should show both labels even though first has empty value
            expect(content).toContain('label 1');
            expect(content).toContain('label 2');
        });

        it('should not show rows for series with non-finite values (NaN, Infinity) in shared tooltips', async () => {
            chart = await createChart({
                data: [
                    { x: 'Q1', y1: 10, y2: Number.NaN, y3: Infinity },
                    { x: 'Q2', y1: 15, y2: 25, y3: 30 },
                ],
                series: [
                    { type: 'line', xKey: 'x', yKey: 'y1', yName: 'Valid Series' },
                    { type: 'line', xKey: 'x', yKey: 'y2', yName: 'NaN Series' },
                    { type: 'line', xKey: 'x', yKey: 'y3', yName: 'Infinity Series' },
                ],
                tooltip: {
                    mode: 'shared',
                },
            });
            // Hover near the first data point (Q1) - use a coordinate that should trigger the tooltip
            await hoverAction(150, 200)(chart);
            await waitForChartStability(chart);

            const element = Array.from(getDocument('body').getElementsByClassName('ag-charts-tooltip')).at(0);
            const content = element?.textContent ?? '';
            // Should contain only Valid Series, not NaN or Infinity series
            expect(content).toContain('Valid Series');
            expect(content).not.toContain('NaN Series');
            expect(content).not.toContain('Infinity Series');
            // Should not show the formatted NaN or Infinity values
            expect(content).not.toContain('NaN');
            expect(content).not.toContain('∞');
            expect(content).not.toContain('Infinity');
        });
    });

    describe('Delayed Tooltip Hiding', () => {
        afterEach(() => {
            jest.useRealTimers();
        });

        it('tooltip removal is immediate by default', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 0, y: 10 },
                    { x: 1, y: 20 },
                    { x: 2, y: 15 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        tooltip: { enabled: true },
                    },
                ],
            };

            chart = await createChart(options);
            await waitForChartStability(chart);

            // Manually show tooltip
            chart.ctx.tooltipManager.updateTooltip('test', { canvasX: 100, canvasY: 200 } as any, [
                { type: 'structured', title: 'Test' },
            ]);
            await waitForChartStability(chart);
            expect(chart.tooltip.isVisible()).toBe(true);

            // Remove tooltip immediately (default)
            chart.ctx.tooltipManager.removeTooltip('test');
            await waitForChartStability(chart);

            // Should be immediately hidden (no wait needed)
            expect(chart.tooltip.isVisible()).toBe(false);
        });

        it('tooltip removal is delayed when delayed=true', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 0, y: 10 },
                    { x: 1, y: 20 },
                    { x: 2, y: 15 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        tooltip: { enabled: true },
                    },
                ],
            };

            chart = await createChart(options);
            await waitForChartStability(chart);

            // Enable fake timers
            jest.useFakeTimers();

            // Show tooltip
            chart.ctx.tooltipManager.updateTooltip('test', { canvasX: 100, canvasY: 200 } as any, [
                { type: 'structured', title: 'Test' },
            ]);
            await waitForChartStability(chart);
            expect(chart.tooltip.isVisible()).toBe(true);

            // Request delayed removal
            chart.ctx.tooltipManager.removeTooltip('test', undefined, true);

            // Should still be visible immediately
            expect(chart.tooltip.isVisible()).toBe(true);

            // Wait 50ms - still visible (delay is 100ms)
            jest.advanceTimersByTime(50);
            expect(chart.tooltip.isVisible()).toBe(true);

            // Wait another 75ms (total 125ms) - now hidden
            jest.advanceTimersByTime(75);
            await waitForChartStability(chart);
            expect(chart.tooltip.isVisible()).toBe(false);
        });

        it('new tooltip cancels pending delayed removal', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 0, y: 10 },
                    { x: 1, y: 20 },
                    { x: 2, y: 15 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        tooltip: { enabled: true },
                    },
                ],
            };

            chart = await createChart(options);
            await waitForChartStability(chart);

            // Enable fake timers
            jest.useFakeTimers();

            // Show first tooltip
            chart.ctx.tooltipManager.updateTooltip('test', { canvasX: 100, canvasY: 200 } as any, [
                { type: 'structured', title: 'First' },
            ]);
            await waitForChartStability(chart);
            expect(chart.tooltip.isVisible()).toBe(true);

            // Request delayed removal
            chart.ctx.tooltipManager.removeTooltip('test', undefined, true);

            // Wait 50ms (less than 100ms delay)
            jest.advanceTimersByTime(50);
            expect(chart.tooltip.isVisible()).toBe(true);

            // Show new tooltip before delay completes
            chart.ctx.tooltipManager.updateTooltip('test', { canvasX: 200, canvasY: 200 } as any, [
                { type: 'structured', title: 'Second' },
            ]);
            await waitForChartStability(chart);

            // Should still be visible with new content
            expect(chart.tooltip.isVisible()).toBe(true);

            // Wait for original delay to complete (another 75ms)
            jest.advanceTimersByTime(75);
            await waitForChartStability(chart);

            // Should STILL be visible (delayed removal was cancelled)
            expect(chart.tooltip.isVisible()).toBe(true);
        });

        it('repeated delayed removal calls do not reset countdown', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 0, y: 10 },
                    { x: 1, y: 20 },
                    { x: 2, y: 15 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        tooltip: { enabled: true },
                    },
                ],
            };

            chart = await createChart(options);
            await waitForChartStability(chart);

            // Enable fake timers
            jest.useFakeTimers();

            // Show tooltip
            chart.ctx.tooltipManager.updateTooltip('test', { canvasX: 100, canvasY: 200 } as any, [
                { type: 'structured', title: 'Test' },
            ]);
            await waitForChartStability(chart);
            expect(chart.tooltip.isVisible()).toBe(true);

            // First delayed removal call - starts countdown
            chart.ctx.tooltipManager.removeTooltip('test', undefined, true);

            // Wait 50ms (halfway through 100ms countdown)
            jest.advanceTimersByTime(50);
            expect(chart.tooltip.isVisible()).toBe(true);

            // Second delayed removal call - should NOT reset countdown
            chart.ctx.tooltipManager.removeTooltip('test', undefined, true);

            // Wait another 25ms (total 75ms from first call, 25ms from second call)
            jest.advanceTimersByTime(25);
            expect(chart.tooltip.isVisible()).toBe(true);

            // Third delayed removal call - should still NOT reset countdown
            chart.ctx.tooltipManager.removeTooltip('test', undefined, true);

            // Wait another 50ms (total 125ms from first call)
            jest.advanceTimersByTime(50);
            await waitForChartStability(chart);

            // Should be hidden now (100ms from FIRST call has elapsed)
            expect(chart.tooltip.isVisible()).toBe(false);
        });

        it('immediate removal cancels pending delayed removal', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 0, y: 10 },
                    { x: 1, y: 20 },
                    { x: 2, y: 15 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        tooltip: { enabled: true },
                    },
                ],
            };

            chart = await createChart(options);
            await waitForChartStability(chart);

            // Enable fake timers
            jest.useFakeTimers();

            // Show tooltip
            chart.ctx.tooltipManager.updateTooltip('test', { canvasX: 100, canvasY: 200 } as any, [
                { type: 'structured', title: 'Test' },
            ]);
            await waitForChartStability(chart);
            expect(chart.tooltip.isVisible()).toBe(true);

            // Request delayed removal
            chart.ctx.tooltipManager.removeTooltip('test', undefined, true);

            // Wait 50ms
            jest.advanceTimersByTime(50);
            expect(chart.tooltip.isVisible()).toBe(true);

            // Request immediate removal before delay completes
            chart.ctx.tooltipManager.removeTooltip('test', undefined, false);
            await waitForChartStability(chart);

            // Should be immediately hidden
            expect(chart.tooltip.isVisible()).toBe(false);

            // Wait for original delay period to verify no double-hide
            jest.advanceTimersByTime(75);
            await waitForChartStability(chart);

            // Should still be hidden (no errors)
            expect(chart.tooltip.isVisible()).toBe(false);
        });
    });
});
