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

        test('invalid text', async () => {
            const invalidObj = { text: 0 as unknown as string };
            chart = await createChart({ overlays: { noData: invalidObj, noVisibleSeries: invalidObj } });
            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - Option \`overlays.noData.text\` cannot be set to \`0\`; expecting a string, ignoring.",
  ],
  [
    "AG Charts - Option \`overlays.noVisibleSeries.text\` cannot be set to \`0\`; expecting a string, ignoring.",
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
                    { xKey: 'x', yKey: 'y1' },
                    { xKey: 'x', yKey: 'y2' },
                ],
            });
            const overlayEl = getDocument('body').querySelector('.ag-charts-overlay')?.firstChild as HTMLElement;
            expect(overlayEl?.innerText).toEqual('No data to display');
        });

        test('no visible series', async () => {
            chart = await createChart({
                data: [
                    { x: 'a', y1: 2, y2: 1 },
                    { x: 'b', y1: 3, y2: 1 },
                    { x: 'c', y1: 5, y2: 2 },
                ],
                series: [
                    { xKey: 'x', yKey: 'y1', visible: false },
                    { xKey: 'x', yKey: 'y2', visible: false },
                ],
            });
            const overlayEl = getDocument('body').querySelector('.ag-charts-overlay')?.firstChild as HTMLElement;
            expect(overlayEl?.innerText).toEqual('No visible series');
        });

        test('neither data nor visible series', async () => {
            chart = await createChart({
                data: [],
                series: [
                    { xKey: 'x', yKey: 'y1', visible: false },
                    { xKey: 'x', yKey: 'y2', visible: false },
                ],
            });
            const overlayEl = getDocument('body').querySelector('.ag-charts-overlay')?.firstChild as HTMLElement;
            expect(overlayEl?.innerText).toEqual('No data to display');
        });

        test('custom no data text', async () => {
            chart = await createChart({
                data: [],
                series: [
                    { xKey: 'x', yKey: 'y1' },
                    { xKey: 'x', yKey: 'y2' },
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
                series: [{ xKey: 'x', yKey: 'y1' }],
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
                series: [{ xKey: 'x', yKey: 'y1' }],
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
                    { xKey: 'x', yKey: 'y1', visible: false },
                    { xKey: 'x', yKey: 'y2', visible: false },
                ],
                overlays: {
                    noVisibleSeries: { text: 'TEST CUSTOM NO VISIBLE SERIES TEXT' },
                },
            });
            const overlayEl = getDocument('body').querySelector('.ag-charts-overlay')?.firstChild as HTMLElement;
            expect(overlayEl?.innerText).toEqual('TEST CUSTOM NO VISIBLE SERIES TEXT');
        });
    });
});
