import { describe, expect, test } from '@jest/globals';

import type { TextAlign } from 'ag-charts-types';

import type { Chart } from './chart';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    createChart,
    expectWarningsCalls,
    extractImageData,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from './test/utils';

describe('Caption', () => {
    setupMockConsole();

    const compare = async () => {
        await waitForChartStability(chart);
        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot({ ...IMAGE_SNAPSHOT_DEFAULTS, failureThreshold: 0 });
    };

    let chart: Chart;
    const ctx = setupMockCanvas();

    describe('#create', () => {
        describe('text align', () => {
            test('left', async () => {
                chart = await createChart({
                    title: { text: 'Monthly Sales Report\n2023', textAlign: 'left' },
                    subtitle: { text: 'Region: North America\n(Values in USD)', textAlign: 'left' },
                    footnote: { text: 'Source: Sales Department\nGenerated on 2023-12-20', textAlign: 'left' },
                });
                await compare();
            });

            test('center', async () => {
                chart = await createChart({
                    title: { text: 'Monthly Sales Report\n2023', textAlign: 'center' },
                    subtitle: { text: 'Region: North America\n(Values in USD)', textAlign: 'center' },
                    footnote: { text: 'Source: Sales Department\nGenerated on 2023-12-20', textAlign: 'center' },
                });
                await compare();
            });

            test('right', async () => {
                chart = await createChart({
                    title: { text: 'Monthly Sales Report\n2023', textAlign: 'right' },
                    subtitle: { text: 'Region: North America\n(Values in USD)', textAlign: 'right' },
                    footnote: { text: 'Source: Sales Department\nGenerated on 2023-12-20', textAlign: 'right' },
                });
                await compare();
            });

            test('mixed', async () => {
                chart = await createChart({
                    title: { text: 'Monthly Sales Report\n2023', textAlign: 'left' },
                    subtitle: { text: 'Region: North America\n(Values in USD)', textAlign: 'center' },
                    footnote: { text: 'Source: Sales Department\nGenerated on 2023-12-20', textAlign: 'right' },
                });
                await compare();
            });
        });
    });

    describe('#validation', () => {
        test('invalid text align', async () => {
            await createChart({
                title: { text: 'Monthly Sales Report\n2023', textAlign: 'LEFT' as TextAlign },
                subtitle: { text: 'Region: North America\n(Values in USD)', textAlign: 'centre' as TextAlign },
                footnote: { text: 'Source: Sales Department\nGenerated on 2023-12-20', textAlign: 'abc' as TextAlign },
            });
            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - Property [textAlign] of [Caption] cannot be set to ["LEFT"]; expecting a text align keyword such as 'left', 'center' or 'right', ignoring.",
  ],
  [
    "AG Charts - Property [textAlign] of [Caption] cannot be set to ["centre"]; expecting a text align keyword such as 'left', 'center' or 'right', ignoring.",
  ],
  [
    "AG Charts - Property [textAlign] of [Caption] cannot be set to ["abc"]; expecting a text align keyword such as 'left', 'center' or 'right', ignoring.",
  ],
]
`);
        });
    });
});
