import { afterEach, describe, expect, it } from 'vitest';

import type { Text } from 'ag-charts-core';
import type { AgPieSeriesOptions } from 'ag-charts-types';

import type { Chart } from '../../chart';
import { seedRandom } from '../../test/random';
import { getSeriesSelectionNodes } from '../../test/seriesAccessors';
import { createChart, deproxy, extractImageData, setupMockCanvas, setupMockConsole } from '../../test/utils';

describe('DonutSeries sector labels in wedges too thin for a line', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();
    let chart: Chart | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const render = async (data: object[], series: AgPieSeriesOptions) => {
        chart?.destroy();
        chart = deproxy(await createChart({ data, series: [series], legend: { enabled: false } }));
        const labels = getSeriesSelectionNodes<Text<{ datumIndex: number }>>(chart, 'labelSelection').map((node) => ({
            placed: node.text != null,
            drawn: node.visible ? { text: node.text, x: node.x, y: node.y, font: node.font } : undefined,
        }));
        return { image: extractImageData(ctx), labels };
    };

    // A state-dependent style turns the fast path off, and a styler restyling nothing draws the style it is fitted in, so
    // the two charts differ only in the placements the fast path leaves out, which the visibility gate hides.
    it('draws the same chart as the full fit, across random slivers and rich text', async () => {
        const random = seedRandom(18765);
        const pick = <T>(values: readonly T[]) => values[Math.floor(random() * values.length)];
        let richSkipped = 0;
        for (let i = 0; i < 24; i += 1) {
            // A few large sectors leave the rest as slivers of up to a few degrees.
            const data = Array.from({ length: 12 + Math.floor(random() * 40) }, (_, id) => ({
                id,
                name: pick(['North', 'Category 12', 'x', 'Long sector label']),
                size: id < 3 ? 100 + random() * 300 : 0.05 + random() * 3,
            }));
            const segments = data.map(() =>
                Array.from({ length: 1 + Math.floor(random() * 3) }, () => ({
                    text: pick(['Alpha ', 'Bravo 12', ' ', 'One\nTwo', '%']),
                    ...(random() < 0.4 && { fontSize: pick([4, 8, 14]) }),
                    ...(random() < 0.3 && { lineHeight: pick([2, 6, 16]) }),
                    ...(random() < 0.3 && { fontWeight: 'bold' as const }),
                }))
            );
            const rich = random() < 0.75;
            const type = pick(['pie', 'donut']);
            const series = {
                type,
                angleKey: 'size',
                sectorLabelKey: 'name',
                showInLegend: false,
                rotation: random() * 360,
                ...(type === 'donut' && { innerRadiusRatio: 0.4 + random() * 0.4 }),
                sectorLabel: {
                    fontSize: pick([8, 12, 16]),
                    ...(random() < 0.3 && { lineHeight: pick([6, 14, 22]) }),
                    ...(random() < 0.3 && { minimumFontSize: pick([4, 6]) }),
                    ...(random() < 0.7 && { truncate: random() < 0.3 }),
                    ...(random() < 0.5 && { wrapping: pick(['never', 'always', 'on-space']) }),
                    ...(random() < 0.3 && { fill: '#eeeeee', padding: pick([0, 3, 6]) }),
                    ...(rich && { formatter: ({ datum }: { datum: { id: number } }) => segments[datum.id] }),
                },
            } as AgPieSeriesOptions;

            const fast = await render(data, series);
            const full = await render(data, {
                ...series,
                sectorLabel: { ...series.sectorLabel, itemStyler: () => ({}) },
            });
            expect(fast.labels.map(({ drawn }) => drawn)).toEqual(full.labels.map(({ drawn }) => drawn));
            expect(fast.image.equals(full.image)).toBe(true);
            if (rich) {
                richSkipped += fast.labels.filter(({ placed }, index) => !placed && full.labels[index].placed).length;
            }
        }
        expect(richSkipped).toBeGreaterThan(100);
    });
});
