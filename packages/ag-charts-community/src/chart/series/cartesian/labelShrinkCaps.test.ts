import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartInstance } from 'ag-charts-types';

import { AgCharts } from '../../../api/agCharts';
import {
    deproxy,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../../test/utils';

// `truncate: false` with `collision.alwaysShow: false` is what the engine reads as
// `overflowStrategy: 'hide'`; neither is on the line series' typed label surface, hence the casts.
describe('label shrink pass overflow caps', () => {
    setupMockConsole();

    let chart: AgChartInstance;
    setupMockCanvas();

    afterEach(() => {
        chart?.destroy();
    });

    // The first label placed becomes the second's only obstacle, so the second has to shrink to fit
    // beside it; markers are off so nothing else obstructs, and the axes hold a pixel-like domain.
    const renderTwoLabelledPoints = async (second: { x: number; y: number }, label: object) => {
        const options = {
            data: [{ x: 400, y: 200 }, second],
            legend: { enabled: false },
            axes: {
                x: { type: 'number', position: 'bottom', min: 0, max: 800 },
                y: { type: 'number', position: 'left', min: 0, max: 400 },
            },
            series: [
                {
                    type: 'line',
                    xKey: 'x',
                    yKey: 'y',
                    marker: { enabled: false },
                    label: {
                        enabled: true,
                        fontSize: 12,
                        placement: ['top'],
                        truncate: false,
                        collision: { alwaysShow: false },
                        ...label,
                    },
                },
            ],
        };
        prepareTestOptions(options as any);
        chart = AgCharts.create(options as any);
        await waitForChartStability(chart);
    };

    // Rendered label text has no public accessor, so the label selection is the only channel for it.
    const renderedLabelTexts = (): string[] => {
        const series = deproxy(chart as any).series[0] as unknown as {
            labelSelection: { nodes(): { visible: boolean; text?: unknown }[] };
        };
        expect(series).toHaveProperty('labelSelection');
        return series.labelSelection
            .nodes()
            .filter((node) => node.visible)
            .map((node) => String(node.text ?? ''));
    };

    // 'MMMM' is wider than the room left over, so its line is dropped without an ellipsis — not the
    // truncation `'hide'` erases on — leaving 'i', which is narrower than a single 'M', to draw.
    it('keeps the lines of a multi-line hide label that still fit the room an obstacle leaves', async () => {
        await renderTwoLabelledPoints({ x: 408, y: 200 }, { wrapping: 'on-space', formatter: () => 'MMMM\ni' });

        expect(renderedLabelTexts()).toEqual(['MMMM\ni', 'i']);
    });

    // A blank line ends a `'never'` wrap early, so losing a line of height leaves 'a' drawn whole.
    it('keeps the first line of a hide label whose blank line ends the wrap', async () => {
        await renderTwoLabelledPoints({ x: 400, y: 184 }, { wrapping: 'never', formatter: () => 'a\n\nb' });

        expect(renderedLabelTexts()).toEqual(['a\n\nb', 'a']);
    });
});
