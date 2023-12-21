import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

import type { TextAlign } from '../options/agChartOptions';
import type { Chart } from './chart';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    createChart,
    extractImageData,
    setupMockCanvas,
    waitForChartStability,
} from './test/utils';

expect.extend({ toMatchImageSnapshot });

describe('Caption', () => {
    beforeEach(() => {
        // eslint-disable-nextline no-console
        [console.warn, console.error] = [jest.fn(), jest.fn()];
    });

    afterEach(() => {
        if (chart) chart.destroy();
        // eslint-disable-next-line no-console
        expect(console.error).not.toBeCalled();
    });

    const compare = async () => {
        await waitForChartStability(chart);
        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot({ ...IMAGE_SNAPSHOT_DEFAULTS, failureThreshold: 0 });
    };

    const expectWarnings = (warnings: string[]) => {
        /* eslint-disable no-console */
        for (let i = 0; i < warnings.length; i++) {
            expect(console.warn).nthCalledWith(i + 1, warnings[i]);
        }
        expect(console.warn).toBeCalledTimes(warnings.length);
        /* eslint-enable no-console */
    };

    let chart: Chart;
    const ctx = setupMockCanvas();

    describe('#create', () => {
        afterEach(() => {
            // eslint-disable-next-line no-console
            expect(console.warn).not.toBeCalled();
        });

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
            expectWarnings([
                `AG Charts - Property [textAlign] of [CaptionWithContext] cannot be set to ["LEFT"]; expecting a text align keyword such as 'left', 'center' or 'right', ignoring.`,
                `AG Charts - Property [textAlign] of [CaptionWithContext] cannot be set to ["centre"]; expecting a text align keyword such as 'left', 'center' or 'right', ignoring.`,
                `AG Charts - Property [textAlign] of [CaptionWithContext] cannot be set to ["abc"]; expecting a text align keyword such as 'left', 'center' or 'right', ignoring.`,
            ]);
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });
});
