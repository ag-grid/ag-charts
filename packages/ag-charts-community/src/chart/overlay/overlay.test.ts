import { afterEach, describe, expect } from '@jest/globals';

import type { Chart } from '../chart';
import { createChart, expectWarningsCalls, setupMockCanvas, setupMockConsole } from '../test/utils';

describe('Overlay', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Chart;

    afterEach(() => {
        if (chart) {
            chart.destroy();
        }
    });

    describe('#validation', () => {
        test('invalid objects', async () => {
            const invalidObj = 0 as unknown as object;
            chart = await createChart({ overlays: { noData: invalidObj, noVisibleSeries: invalidObj } });
            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - Option \`overlays.noData\` cannot be set to \`0\`; expecting an object, ignoring.",
  ],
  [
    "AG Charts - Option \`overlays.noVisibleSeries\` cannot be set to \`0\`; expecting an object, ignoring.",
  ],
]
`);
        });

        // Skip until we normalize text segment validation
        test.skip('invalid text', async () => {
            const invalidObj = { text: 0 as unknown as string };
            chart = await createChart({ overlays: { noData: invalidObj, noVisibleSeries: invalidObj } });
            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - Option \`overlays.noData.text\` cannot be set to \`0\`; expecting a string or text segments array, ignoring.",
  ],
  [
    "AG Charts - Option \`overlays.noVisibleSeries.text\` cannot be set to \`0\`; expecting a string or text segments array, ignoring.",
  ],
]
`);
        });

        test('invalid renderer', async () => {
            const invalidObj = { renderer: 0 as unknown as () => string };
            chart = await createChart({ overlays: { noData: invalidObj, noVisibleSeries: invalidObj } });
            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - Option \`overlays.noData.renderer\` cannot be set to \`0\`; expecting a function, ignoring.",
  ],
  [
    "AG Charts - Option \`overlays.noVisibleSeries.renderer\` cannot be set to \`0\`; expecting a function, ignoring.",
  ],
]
`);
        });
    });

    describe('#create', () => {
        test('no data', async () => {
            chart = await createChart({
                data: [],
                series: [
                    { type: 'line', xKey: 'x', yKey: 'y1' },
                    { type: 'line', xKey: 'x', yKey: 'y2' },
                ],
            });
            const overlayEl = chart.ctx.agDocument.body.querySelector('.ag-charts-overlay')?.firstChild as HTMLElement;
            expect(overlayEl?.innerText).toEqual('No data to display');
        });

        test('invalid data', async () => {
            chart = await createChart({
                data: [{ invalid: 'invalid' }],
                series: [
                    { type: 'line', xKey: 'x', yKey: 'y1' },
                    { type: 'line', xKey: 'x', yKey: 'y2' },
                ],
            });
            const overlayEl = chart.ctx.agDocument.body.querySelector('.ag-charts-overlay')?.firstChild as HTMLElement;
            expect(overlayEl?.innerText).toEqual('No data to display');
            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [undefined] for [LineSeries-1,LineSeries-2 / xKey] ignored:",
    "[undefined]",
  ],
  [
    "AG Charts - the key 'x' was not found in any data element for LineSeries-1.",
  ],
  [
    "AG Charts - the key 'x' was not found in any data element for LineSeries-2.",
  ],
  [
    "AG Charts - the key 'y1' was not found in any data element for LineSeries-1.",
  ],
  [
    "AG Charts - the key 'y2' was not found in any data element for LineSeries-2.",
  ],
]
`);
        });

        test('primitive data - string', async () => {
            chart = await createChart({
                data: ['f'],
                series: [{ type: 'bar', xKey: 'quarter', yKey: 'iphone' }],
            });
            const overlayEl = chart.ctx.agDocument.body.querySelector('.ag-charts-overlay')?.firstChild as HTMLElement;
            expect(overlayEl?.innerText).toEqual('No data to display');
        });

        test('primitive data - number', async () => {
            chart = await createChart({
                data: [123, 456],
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            });
            const overlayEl = chart.ctx.agDocument.body.querySelector('.ag-charts-overlay')?.firstChild as HTMLElement;
            expect(overlayEl?.innerText).toEqual('No data to display');
        });

        test('primitive data - mixed types', async () => {
            chart = await createChart({
                data: ['string', 123, true, null],
                series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
            });
            const overlayEl = chart.ctx.agDocument.body.querySelector('.ag-charts-overlay')?.firstChild as HTMLElement;
            expect(overlayEl?.innerText).toEqual('No data to display');
        });

        test('mixed valid objects and primitives', async () => {
            chart = await createChart({
                data: [{ x: 'a', y: 1 }, 'invalid', { x: 'b', y: 2 }],
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            });
            // Should NOT show overlay because there are some valid data items
            const overlayEl = chart.ctx.agDocument.body.querySelector('.ag-charts-overlay')?.firstChild as HTMLElement;
            expect(overlayEl).toBeFalsy();
        });

        test('no visible series', async () => {
            chart = await createChart({
                data: [
                    { x: 'a', y1: 2, y2: 1 },
                    { x: 'b', y1: 3, y2: 1 },
                    { x: 'c', y1: 5, y2: 2 },
                ],
                series: [
                    { type: 'line', xKey: 'x', yKey: 'y1', visible: false },
                    { type: 'line', xKey: 'x', yKey: 'y2', visible: false },
                ],
            });
            const overlayEl = chart.ctx.agDocument.body.querySelector('.ag-charts-overlay')?.firstChild as HTMLElement;
            expect(overlayEl?.innerText).toEqual('No visible series');
        });

        test('neither data nor visible series', async () => {
            chart = await createChart({
                data: [],
                series: [
                    { type: 'line', xKey: 'x', yKey: 'y1', visible: false },
                    { type: 'line', xKey: 'x', yKey: 'y2', visible: false },
                ],
            });
            const overlayEl = chart.ctx.agDocument.body.querySelector('.ag-charts-overlay')?.firstChild as HTMLElement;
            expect(overlayEl?.innerText).toEqual('No data to display');
        });

        test('custom no data text', async () => {
            chart = await createChart({
                data: [],
                series: [
                    { type: 'line', xKey: 'x', yKey: 'y1' },
                    { type: 'line', xKey: 'x', yKey: 'y2' },
                ],
                overlays: {
                    noData: { text: 'TEST CUSTOM NO DATA TEXT' },
                },
            });
            const overlayEl = chart.ctx.agDocument.body.querySelector('.ag-charts-overlay')?.firstChild as HTMLElement;
            expect(overlayEl?.innerText).toEqual('TEST CUSTOM NO DATA TEXT');
        });

        test('custom no data text with html', async () => {
            chart = await createChart({
                data: [],
                series: [{ type: 'line', xKey: 'x', yKey: 'y1' }],
                overlays: {
                    noData: { renderer: () => '<div>TEST CUSTOM NO DATA TEXT</div>' },
                },
            });
            const overlayEl = chart.ctx.agDocument.body.querySelector('.ag-charts-overlay')?.children;
            expect(overlayEl).toMatchInlineSnapshot(`
HTMLCollection [
  <div>
    TEST CUSTOM NO DATA TEXT
  </div>,
]
`);
        });

        test('custom no data text with multiple html elements', async () => {
            chart = await createChart({
                data: [],
                series: [{ type: 'line', xKey: 'x', yKey: 'y1' }],
                overlays: {
                    noData: { renderer: () => '<div>TEST CUSTOM NO DATA TEXT</div><div>CUSTOM NO DATA TEXT 2</div>' },
                },
            });
            const overlayEl = chart.ctx.agDocument.body.querySelector('.ag-charts-overlay')?.children;
            expect(overlayEl).toMatchInlineSnapshot(`
HTMLCollection [
  <div>
    <div>
      TEST CUSTOM NO DATA TEXT
    </div>
    <div>
      CUSTOM NO DATA TEXT 2
    </div>
  </div>,
]
`);
        });

        test('custom no visible series text', async () => {
            chart = await createChart({
                data: [
                    { x: 'a', y1: 2, y2: 1 },
                    { x: 'b', y1: 3, y2: 1 },
                    { x: 'c', y1: 5, y2: 2 },
                ],
                series: [
                    { type: 'line', xKey: 'x', yKey: 'y1', visible: false },
                    { type: 'line', xKey: 'x', yKey: 'y2', visible: false },
                ],
                overlays: {
                    noVisibleSeries: { text: 'TEST CUSTOM NO VISIBLE SERIES TEXT' },
                },
            });
            const overlayEl = chart.ctx.agDocument.body.querySelector('.ag-charts-overlay')?.firstChild as HTMLElement;
            expect(overlayEl?.innerText).toEqual('TEST CUSTOM NO VISIBLE SERIES TEXT');
        });

        describe.each<'bar' | 'line' | 'area'>(['bar', 'line', 'area'])(
            'AG-16074 for %s series',
            (seriesType: 'bar' | 'line' | 'area') => {
                test('should not show no data overlay when first series has null y-value but other series have data', async () => {
                    chart = await createChart({
                        data: [
                            {
                                quarter: "Q1'18",
                                iphone: null, // First series has null
                                mac: 16,
                            },
                        ],
                        series: [
                            { type: seriesType, xKey: 'quarter', yKey: 'iphone', yName: 'iPhone' },
                            { type: seriesType, xKey: 'quarter', yKey: 'mac', yName: 'Mac' },
                        ],
                    });

                    // Check that no data overlay is NOT shown
                    const overlayEl = chart.ctx.agDocument.body.querySelector('.ag-charts-no-data-overlay');
                    expect(overlayEl).toBe(null);
                });

                test('should show no data overlay when all series have null values', async () => {
                    chart = await createChart({
                        data: [
                            {
                                quarter: "Q1'18",
                                iphone: null,
                                mac: null,
                            },
                        ],
                        series: [
                            { type: seriesType, xKey: 'quarter', yKey: 'iphone' },
                            { type: seriesType, xKey: 'quarter', yKey: 'mac' },
                        ],
                    });

                    // Check that no data overlay IS shown
                    const overlayEl = chart.ctx.agDocument.body.querySelector('.ag-charts-no-data-overlay');
                    expect(overlayEl).not.toBe(null);
                });

                test('should show no data overlay when all series have missing values', async () => {
                    chart = await createChart({
                        data: [
                            {
                                quarter: "Q1'18",
                            },
                        ],
                        series: [
                            { type: seriesType, xKey: 'quarter', yKey: 'iphone' },
                            { type: seriesType, xKey: 'quarter', yKey: 'mac' },
                        ],
                    });

                    const seriesTypeCapitalized = seriesType.charAt(0).toUpperCase() + seriesType.slice(1);
                    expectWarningsCalls().toEqual([
                        [
                            `AG Charts - the key 'iphone' was not found in any data element for ${seriesTypeCapitalized}Series-1.`,
                        ],
                        [
                            `AG Charts - the key 'mac' was not found in any data element for ${seriesTypeCapitalized}Series-2.`,
                        ],
                    ]);

                    // Check that no data overlay IS shown
                    const overlayEl = chart.ctx.agDocument.body.querySelector('.ag-charts-no-data-overlay');
                    expect(overlayEl).not.toBe(null);
                });

                test('should not show no data overlay when first series has empty data but other series have data', async () => {
                    chart = await createChart({
                        series: [
                            {
                                type: seriesType,
                                data: [], // First series has no data
                                xKey: 'quarter',
                                yKey: 'value',
                            },
                            {
                                type: seriesType,
                                data: [{ quarter: "Q1'18", value: 16 }], // Second series has data
                                xKey: 'quarter',
                                yKey: 'value',
                            },
                        ],
                    });

                    // Check that no data overlay is NOT shown
                    const overlayEl = chart.ctx.agDocument.body.querySelector('.ag-charts-no-data-overlay');
                    expect(overlayEl).toBe(null);
                });

                test('should not show no data overlay when first series has some invalid data', async () => {
                    chart = await createChart({
                        data: [
                            { quarter: "Q1'18", iphone: null },
                            { quarter: "Q2'18", iphone: 16 },
                        ],
                        series: [{ type: seriesType, xKey: 'quarter', yKey: 'iphone' }],
                    });

                    // Check that no data overlay is NOT shown
                    const overlayEl = chart.ctx.agDocument.body.querySelector('.ag-charts-no-data-overlay');
                    expect(overlayEl).toBe(null);
                });
            }
        );

        describe('CRT-1016', () => {
            test('custom renderer text should be available for accessibility (screenreader)', async () => {
                const customMessage = 'Custom message for missing data';
                chart = await createChart({
                    data: [],
                    series: [{ type: 'line', xKey: 'x', yKey: 'y1' }],
                    overlays: {
                        noData: { renderer: () => `<div>${customMessage}</div>` },
                    },
                });

                // Verify the overlay element contains the custom text
                const overlayEl = chart.ctx.agDocument.body.querySelector('.ag-charts-overlay');
                expect(overlayEl?.textContent?.trim()).toEqual(customMessage);

                // Verify the overlay's getFocusInfo returns the custom text for screenreaders
                const chartInstance = chart as any;
                const focusInfo = chartInstance.overlays?.getFocusInfo(chartInstance.ctx?.localeManager);
                expect(focusInfo?.text).toEqual(customMessage);
            });

            test('custom renderer with nested HTML should extract text for accessibility', async () => {
                const customMessage = 'Nested custom text';
                chart = await createChart({
                    data: [],
                    series: [{ type: 'line', xKey: 'x', yKey: 'y1' }],
                    overlays: {
                        noData: { renderer: () => `<div><span><strong>${customMessage}</strong></span></div>` },
                    },
                });

                // Verify the overlay element contains the custom text
                const overlayEl = chart.ctx.agDocument.body.querySelector('.ag-charts-overlay');
                expect(overlayEl?.textContent?.trim()).toEqual(customMessage);

                // Verify the overlay's getFocusInfo returns the custom text for screenreaders
                const chartInstance = chart as any;
                const focusInfo = chartInstance.overlays?.getFocusInfo(chartInstance.ctx?.localeManager);
                expect(focusInfo?.text).toEqual(customMessage);
            });
        });
    });
});
