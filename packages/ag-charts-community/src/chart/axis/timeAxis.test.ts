import { afterEach, describe, expect, it } from '@jest/globals';

import { AgCharts } from '../../api/agChart';
import type { AgCartesianChartOptions } from '../../options/agChartOptions';
import type { ChartAxis } from '../chartAxis';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    deproxy,
    extractImageData,
    prepareTestOptions,
    setupMockCanvas,
    waitForChartStability,
} from '../test/utils';

function calculateAxisBBox(axis: ChartAxis): { x: number; y: number; width: number; height: number } {
    const bbox = axis.computeBBox();

    const { x, y, width, height } = bbox;
    return { x, y, width, height };
}

const TIME_AXIS_DATA = [];
for (let i = 0; i < 200; i++) {
    TIME_AXIS_DATA.push({
        date: new Date(2004, 3 + i, 1),
        'Tate Modern': 82215 + (i % 5) * 10_000,
    });
}

const TIME_AXIS_EXAMPLE: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Navigator Styling',
    },
    data: TIME_AXIS_DATA,
    series: [
        {
            type: 'bar',
            xKey: 'date',
            yKey: 'Tate Modern',
            fill: '#c16068',
            stroke: '#874349',
        },
    ],
    axes: [
        {
            type: 'time',
            position: 'bottom',
            nice: false,
            tick: { maxSpacing: 150 },
        },
        {
            type: 'number',
            position: 'left',
            label: {
                formatter: (params) => params.value / 1000 + 'k',
            },
        },
    ],
    navigator: {
        height: 50,
        min: 0,
        max: 1,
    },
};

describe('Time Axis Examples', () => {
    let chart: any;
    const ctx = setupMockCanvas();

    const axisCompare = async () => {
        await waitForChartStability(chart);

        for (const axis of deproxy(chart).axes) {
            if (axis.type !== 'time') continue;

            const axisBbox = calculateAxisBBox(axis);
            expect(axisBbox).toMatchSnapshot();

            const { width, height } = axisBbox;

            if (width > 0 && height > 0) {
                const imageData = extractImageData({ ...ctx, bbox: axisBbox });
                expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
            }
        }
    };

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    describe('when zooming', () => {
        const ZOOM_LEVELS: [number, number][] = [
            [0, 1],
            [0.2, 0.5],
            [0.25, 0.35],
            [0.3, 0.35],
            [0.35, 0.375],
            [0.4, 0.4125],
            [0.45, 0.45625],
        ];
        for (const [min, max] of ZOOM_LEVELS) {
            it(`for should render as expected as zoom [${min}, ${max}]`, async () => {
                chart = AgCharts.create(prepareTestOptions({ ...TIME_AXIS_EXAMPLE }));
                chart.updateDelta({ navigator: { min, max } });
                await axisCompare();
            });
        }
    });
});
