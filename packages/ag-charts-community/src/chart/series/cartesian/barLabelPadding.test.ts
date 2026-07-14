import { afterEach, describe, expect, it } from 'vitest';

import type { AgCartesianChartOptions, AgChartInstance, Padding } from 'ag-charts-types';

import { AgCharts } from '../../../api/agCharts';
import {
    deproxy,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../../test/utils';

// A per-side `label.padding` object must offset a bar label away from the bar by the facing-side
// padding, exactly as an equivalent scalar padding does — otherwise the label box overlaps the bar
// instead of floating clear of it. The mixed positive/negative data exercises the facing-side flip
// between upward and downward bars.
describe('bar label per-side padding offset', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;
    afterEach(() => chart?.destroy());

    const data = [
        { cat: 'A', value: 60 },
        { cat: 'B', value: -40 },
        { cat: 'C', value: 70 },
    ];

    const visibleLabelPositions = async (
        padding: Padding,
        placement: 'outside-end' | 'outside-start',
        direction: 'vertical' | 'horizontal'
    ) => {
        const vertical = direction === 'vertical';
        const options: AgCartesianChartOptions = {
            data,
            legend: { enabled: false },
            axes: {
                x: { type: 'category', position: vertical ? 'bottom' : 'left' },
                y: { type: 'number', position: vertical ? 'left' : 'bottom' },
            } as any,
            series: [
                {
                    type: 'bar',
                    direction,
                    xKey: 'cat',
                    yKey: 'value',
                    label: { enabled: true, placement, fill: '#eeeeee', padding },
                },
            ],
        };
        prepareTestOptions(options);
        chart = AgCharts.create(options);
        await waitForChartStability(chart);
        const series = deproxy(chart as any).series[0] as any;
        const nodes = series.labelSelection.nodes().filter((node: any) => node.visible);
        expect(nodes.length).toBe(data.length);
        return nodes.map((node: any) => ({ x: node.x as number, y: node.y as number }));
    };

    const expectPerSideMatchesScalar = async (
        placement: 'outside-end' | 'outside-start',
        direction: 'vertical' | 'horizontal',
        perSidePadding: Padding
    ) => {
        const scalar = await visibleLabelPositions(10, placement, direction);
        chart.destroy();
        const perSide = await visibleLabelPositions(perSidePadding, placement, direction);
        const axis = direction === 'vertical' ? 'y' : 'x';
        for (let i = 0; i < perSide.length; i++) {
            expect(perSide[i][axis]).toBeCloseTo(scalar[i][axis]);
        }
    };

    it('offsets vertical outside-end labels by the facing padding, matching scalar padding', async () => {
        await expectPerSideMatchesScalar('outside-end', 'vertical', { top: 10, bottom: 10, left: 0, right: 0 });
    });

    it('offsets vertical outside-start labels by the facing padding, matching scalar padding', async () => {
        await expectPerSideMatchesScalar('outside-start', 'vertical', { top: 10, bottom: 10, left: 0, right: 0 });
    });

    it('offsets horizontal outside-end labels by the facing padding, matching scalar padding', async () => {
        await expectPerSideMatchesScalar('outside-end', 'horizontal', { top: 0, bottom: 0, left: 10, right: 10 });
    });
});
