import { afterEach, describe, expect } from '@jest/globals';

import { getDocument } from 'ag-charts-core';

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
            const overlayEl = getDocument('body').querySelector('.ag-charts-overlay')?.firstChild as HTMLElement;
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
            const overlayEl = getDocument('body').querySelector('.ag-charts-overlay')?.firstChild as HTMLElement;
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
            const overlayEl = getDocument('body').querySelector('.ag-charts-overlay')?.firstChild as HTMLElement;
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
            const overlayEl = getDocument('body').querySelector('.ag-charts-overlay')?.firstChild as HTMLElement;
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
            const overlayEl = getDocument('body').querySelector('.ag-charts-overlay')?.firstChild as HTMLElement;
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
            const overlayEl = getDocument('body').querySelector('.ag-charts-overlay')?.children;
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
            const overlayEl = getDocument('body').querySelector('.ag-charts-overlay')?.children;
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
            const overlayEl = getDocument('body').querySelector('.ag-charts-overlay')?.firstChild as HTMLElement;
            expect(overlayEl?.innerText).toEqual('TEST CUSTOM NO VISIBLE SERIES TEXT');
        });

        describe('AG-16074', () => {
            test('should not show no data overlay when first series has null y-value but other series have data', async () => {
                chart = await createChart({
                    data: [
                        {
                            quarter: "Q1'18",
                            iphone: null, // First series has null
                            mac: 16,
                            ipad: 14,
                            wearables: 12,
                            services: 20,
                        },
                    ],
                    series: [
                        { type: 'bar', xKey: 'quarter', yKey: 'iphone', yName: 'iPhone' },
                        { type: 'bar', xKey: 'quarter', yKey: 'mac', yName: 'Mac' },
                        { type: 'bar', xKey: 'quarter', yKey: 'ipad', yName: 'iPad' },
                        { type: 'bar', xKey: 'quarter', yKey: 'wearables', yName: 'Wearables' },
                        { type: 'bar', xKey: 'quarter', yKey: 'services', yName: 'Services' },
                    ],
                });

                // Check that no data overlay is NOT shown
                const overlayEl = getDocument('body').querySelector('.ag-charts-no-data-overlay');
                expect(overlayEl).toBe(null);
            });

            test('should show no data overlay when all series have null values', async () => {
                chart = await createChart({
                    data: [
                        {
                            quarter: "Q1'18",
                            iphone: null,
                            mac: null,
                            ipad: null,
                        },
                    ],
                    series: [
                        { type: 'bar', xKey: 'quarter', yKey: 'iphone' },
                        { type: 'bar', xKey: 'quarter', yKey: 'mac' },
                        { type: 'bar', xKey: 'quarter', yKey: 'ipad' },
                    ],
                });

                // Check that no data overlay IS shown
                const overlayEl = getDocument('body').querySelector('.ag-charts-no-data-overlay');
                expect(overlayEl).not.toBe(null);
            });

            test('should not show no data overlay when first series has empty data but other series have data', async () => {
                chart = await createChart({
                    series: [
                        {
                            type: 'bar',
                            data: [], // First series has no data
                            xKey: 'quarter',
                            yKey: 'value',
                        },
                        {
                            type: 'bar',
                            data: [{ quarter: "Q1'18", value: 16 }], // Second series has data
                            xKey: 'quarter',
                            yKey: 'value',
                        },
                    ],
                });

                // Check that no data overlay is NOT shown
                const overlayEl = getDocument('body').querySelector('.ag-charts-no-data-overlay');
                expect(overlayEl).toBe(null);
            });
        });
    });
});
