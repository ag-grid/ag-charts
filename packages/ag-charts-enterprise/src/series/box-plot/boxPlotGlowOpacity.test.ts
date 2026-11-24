import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartInstance, AgChartOptions } from 'ag-charts-community';
import { deproxy, hoverDatum, setupMockCanvas, setupMockConsole } from 'ag-charts-community-test';

import { BOX_PLOT } from '../../test/glowSeriesCases';
import { createEnterpriseChart } from '../../test/utils';

describe('the glow of a dimmed box plot item', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance | undefined;
    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    // The glow is red over a white chart with no blur, so that the green channel of a pixel in it is 255 * (1 - strength).
    // The first box is hovered, which dims the second to `opacity`, and its glow is read from the right half of the chart.
    const dimmedGlowStrength = async (glow: object, opacity: number) => {
        chart = await createEnterpriseChart({
            data: BOX_PLOT,
            animation: { enabled: false },
            legend: { enabled: false },
            series: [
                {
                    type: 'box-plot',
                    xKey: 'x',
                    minKey: 'min',
                    q1Key: 'q1',
                    medianKey: 'median',
                    q3Key: 'q3',
                    maxKey: 'max',
                    fill: '#0000ff',
                    glow: { enabled: true, fill: 'red', blur: 0, spread: 6, ...glow },
                    highlight: { unhighlightedItem: { opacity } },
                },
            ],
        } as AgChartOptions);
        await hoverDatum(chart, 0, 0);

        const { canvas } = deproxy(chart).ctx.scene;
        const { data } = canvas.context.getImageData(canvas.width / 2, 0, canvas.width / 2, canvas.height);
        const greens = new Map<number, number>();
        for (let i = 0; i < data.length; i += 4) {
            if (data[i] === 255 && data[i + 1] === data[i + 2] && data[i + 1] < 255) {
                greens.set(data[i + 1], (greens.get(data[i + 1]) ?? 0) + 1);
            }
        }
        const [[green]] = [...greens].sort(([, a], [, b]) => b - a);
        return 1 - green / 255;
    };

    it.each([
        [1, 1],
        [0.5, 0.5],
    ])(
        'should cast a glow with a fillOpacity of 1 on an item at an opacity of %s at a strength of %s',
        async (opacity, strength) => {
            expect(await dimmedGlowStrength({ fillOpacity: 1 }, opacity)).toBeCloseTo(strength, 1);
        }
    );
});
