import { describe, expect, test } from '@jest/globals';

import type { TextAlign } from 'ag-charts-types';

import { Transformable } from '../scene/transformable';
import type { Caption } from './caption';
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

        describe('truncate', () => {
            const longText =
                'This is an extremely long title that should definitely exceed the width of the chart container and be truncated under normal circumstances';

            test('truncate: false on title', async () => {
                chart = await createChart({
                    title: { text: longText, truncate: false } as any,
                    subtitle: { text: longText },
                    footnote: { text: longText },
                });
                await compare();
            });

            test('truncate: false on all captions', async () => {
                chart = await createChart({
                    title: { text: longText, truncate: false } as any,
                    subtitle: { text: longText, truncate: false } as any,
                    footnote: { text: longText, truncate: false } as any,
                });
                await compare();
            });

            test('truncate: false with maxWidth', async () => {
                chart = await createChart({
                    title: { text: longText, truncate: false, maxWidth: 200 } as any,
                    subtitle: { text: longText },
                    footnote: { text: longText },
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
    "AG Charts - Option \`title.textAlign\` cannot be set to \`"LEFT"\`; expecting a keyword such as 'left', 'center' or 'right', ignoring.",
  ],
  [
    "AG Charts - Option \`subtitle.textAlign\` cannot be set to \`"centre"\`; expecting a keyword such as 'left', 'center' or 'right', ignoring.",
  ],
  [
    "AG Charts - Option \`footnote.textAlign\` cannot be set to \`"abc"\`; expecting a keyword such as 'left', 'center' or 'right', ignoring.",
  ],
]
`);
        });
    });

    // CRT-1041: Footnote caption with multi-line rich text should have correct bounding box
    // for the accessibility proxy element.
    describe('CRT-1041 footnote caption bounds', () => {
        function assertProxyBoundsMatchCanvas(caption: Caption) {
            const canvasBBox = Transformable.toCanvas(caption.node);
            const proxyBBox = (caption as any).lastProxyBBox as
                | { x: number; y: number; width: number; height: number }
                | undefined;

            expect(proxyBBox).toBeDefined();
            expect(proxyBBox!.x).toBeCloseTo(canvasBBox.x, 0);
            expect(proxyBBox!.y).toBeCloseTo(canvasBBox.y, 0);
            expect(proxyBBox!.width).toBeCloseTo(canvasBBox.width, 0);
            expect(proxyBBox!.height).toBeCloseTo(canvasBBox.height, 0);
        }

        test('multi-line footnote proxy bounds match canvas position', async () => {
            chart = await createChart({
                title: { text: 'Chart Title' },
                footnote: { text: 'Source: Test Data\nUpdated: 2026' },
            });
            await compare();

            const { footnote } = chart;
            assertProxyBoundsMatchCanvas(footnote);

            // Footnote proxy must be fully within the canvas area.
            const proxyBBox = (footnote as any).lastProxyBBox;
            expect(proxyBBox.y).toBeGreaterThan(0);
            expect(proxyBBox.y + proxyBBox.height).toBeLessThanOrEqual(chart.height!);
        });

        test('multi-line captions proxy bounds match canvas position', async () => {
            chart = await createChart({
                title: { text: 'Title Line 1\nTitle Line 2' },
                subtitle: { text: 'Subtitle Line 1\nSubtitle Line 2' },
                footnote: { text: 'Footnote Line 1\nFootnote Line 2' },
            });
            await compare();

            assertProxyBoundsMatchCanvas(chart.title);
            assertProxyBoundsMatchCanvas(chart.subtitle);
            assertProxyBoundsMatchCanvas(chart.footnote);

            // All proxy elements must be fully within the canvas area.
            for (const caption of [chart.title, chart.subtitle, chart.footnote]) {
                const proxyBBox = (caption as any).lastProxyBBox;
                expect(proxyBBox.y).toBeGreaterThanOrEqual(0);
                expect(proxyBBox.y + proxyBBox.height).toBeLessThanOrEqual(chart.height!);
            }
        });
    });
});
