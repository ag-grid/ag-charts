import { afterEach, describe, expect, it } from '@jest/globals';

import type {
    AgAreaSeriesOptions,
    AgBarSeriesOptions,
    AgCartesianAxesOptions,
    AgCartesianAxisPosition,
    AgCartesianChartOptions,
    AgChartOptions,
} from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    extractImageData,
    hoverAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import { mapValues } from 'ag-charts-core';

import { prepareEnterpriseTestOptions } from '../../test/utils';

function applyAxesFlip<T extends AgCartesianChartOptions>(opts: T): T {
    const positionFlip = (position?: AgCartesianAxisPosition) => {
        switch (position) {
            case 'top':
                return 'bottom';
            case 'left':
                return 'right';
            case 'bottom':
                return 'top';
            case 'right':
                return 'left';
            default:
                return position;
        }
    };

    return {
        ...opts,
        axes: mapValues(opts['axes'] ?? {}, (axis) => ({ ...axis, position: positionFlip(axis?.position) })),
    };
}

const BASE_OPTIONS: AgCartesianChartOptions = {
    theme: {
        overrides: {
            line: {
                series: {
                    marker: {
                        size: 10,
                    },
                },
            },
            area: {
                series: {
                    marker: {
                        enabled: true,
                        size: 10,
                    },
                },
            },
        },
    },
    data: [
        { x: 0, y1: 100, y2: 2, y3: 64 },
        { x: 1, y1: 50, y2: 20, y3: 55 },
        { x: 2, y1: 25, y2: 200, y3: 48 },
        { x: 3, y1: 75, y2: 2000, y3: 72 },
    ],
    series: [
        { type: 'line', xKey: 'x', yKey: 'y1' },
        { type: 'line', xKey: 'x', yKey: 'y2' },
        { type: 'line', xKey: 'x', yKey: 'y3' },
    ],
};

const SIMPLE_AXIS_OPTIONS: AgCartesianAxesOptions = {
    y: {
        position: 'left',
        type: 'number',
    },
    x: {
        position: 'bottom',
        type: 'category',
        bandHighlight: {
            enabled: true,
        },
    },
};

const SECONDARY_AXIS_OPTIONS: AgCartesianAxesOptions = {
    y: {
        position: 'left',
        type: 'number',
    },
    ySecondary: {
        position: 'left',
        type: 'number',
    },
    x: {
        position: 'bottom',
        type: 'category',
        bandHighlight: {
            enabled: true,
        },
    },
};

const SIMPLE_LINE_OPTIONS: AgCartesianChartOptions = {
    ...BASE_OPTIONS,
    axes: {
        y: {
            position: 'left',
            type: 'category',
            bandHighlight: {
                enabled: true,
            },
        },
        x: {
            position: 'bottom',
            type: 'category',
            bandHighlight: {
                enabled: true,
            },
        },
    },
};

const SIMPLE_COLUMN_OPTIONS: AgCartesianChartOptions = {
    ...BASE_OPTIONS,
    axes: SIMPLE_AXIS_OPTIONS,
    tooltip: { range: 'exact' },
    series: BASE_OPTIONS.series?.map((s) => ({ ...s, type: 'bar' })) as AgBarSeriesOptions[],
};

const LINE_SECONDARY_AXIS_OPTIONS: AgCartesianChartOptions = {
    ...BASE_OPTIONS,
    axes: SECONDARY_AXIS_OPTIONS,
    series: BASE_OPTIONS.series?.map((s) => ({ ...s, yKeyAxis: 'yKey' in s && s.yKey === 'y2' ? 'ySecondary' : 'y' })),
};

const GROUPED_STACKED_COLUMN_OPTIONS: AgCartesianChartOptions = {
    data: [
        {
            dolphin: 'Peter',
            interactionDurationTM: 1.23,
            interactionDurationTMLower: 0.8,
            interactionDurationTMUpper: 1.44,
            interactionDurationYM: 2.85,
            interactionDurationYMLower: 2.22,
            interactionDurationYMUpper: 3.61,
            numberOfLooksTM: 60,
            numberOfLooksYM: 64,
        },
        {
            dolphin: 'Mary',
            interactionDurationTM: 1.35,
            interactionDurationTMLower: 0.9,
            interactionDurationTMUpper: 1.59,
            interactionDurationYM: 2.59,
            interactionDurationYMLower: 2.09,
            interactionDurationYMUpper: 2.85,
            numberOfLooksTM: 57,
            numberOfLooksYM: 93,
        },
        {
            dolphin: 'Mercutio',
            interactionDurationTM: 1.4,
            interactionDurationTMLower: 1.32,
            interactionDurationTMUpper: 1.46,
            interactionDurationYM: 1.45,
            interactionDurationYMLower: 1.1,
            interactionDurationYMUpper: 1.54,
            numberOfLooksTM: 238,
            numberOfLooksYM: 217,
        },
        {
            dolphin: 'Ada',
            interactionDurationTM: 1.1,
            interactionDurationTMLower: 0.89,
            interactionDurationTMUpper: 1.45,
            interactionDurationYM: 1.47,
            interactionDurationYMLower: 1.35,
            interactionDurationYMUpper: 1.64,
            numberOfLooksTM: 237,
            numberOfLooksYM: 217,
        },
    ],
    series: [
        {
            type: 'bar',
            xKey: 'dolphin',
            yKey: 'interactionDurationTM',
            yName: 'Interaction Duration - Transparent Mirror',
            legendItemName: 'Interaction Duration - Transparent Mirror',
            stackGroup: 'ID',
            errorBar: {
                yLowerKey: 'interactionDurationTMLower',
                yUpperKey: 'interactionDurationTMUpper',
            },
        },
        {
            type: 'bar',
            xKey: 'dolphin',
            yKey: 'interactionDurationYM',
            yName: 'Interaction Duration - Yellow Mirror',
            legendItemName: 'Interaction Duration - Yellow Mirror',
            stackGroup: 'ID',
            errorBar: {
                yLowerKey: 'interactionDurationYMLower',
                yUpperKey: 'interactionDurationYMUpper',
            },
        },
        {
            type: 'bar',
            xKey: 'dolphin',
            yKey: 'numberOfLooksTM',
            yName: 'Number of Looks - Transparent Mirror',
            yKeyAxis: 'ySecondary',
            legendItemName: 'Number of Looks - Transparent Mirror',
            stackGroup: 'NOL',
        },
        {
            type: 'bar',
            xKey: 'dolphin',
            yKey: 'numberOfLooksYM',
            yName: 'Number of Looks - Yellow Mirror',
            yKeyAxis: 'ySecondary',
            legendItemName: 'Number of Looks - Yellow Mirror',
            stackGroup: 'NOL',
        },
    ],
    axes: {
        x: {
            position: 'top',
            type: 'category',
            bandHighlight: {
                enabled: true,
            },
        },
        y: {
            position: 'left',
            type: 'number',
        },
        ySecondary: {
            position: 'right',
            type: 'number',
        },
    },
};

const STACKED_BAR_OPTIONS: AgCartesianChartOptions = {
    ...BASE_OPTIONS,
    axes: {
        x: {
            position: 'bottom',
            type: 'number',
        },
        y: {
            position: 'left',
            type: 'category',
            bandHighlight: {
                enabled: true,
            },
        },
    },
    tooltip: { range: 'exact' },
    series: BASE_OPTIONS.series?.map((s) => ({
        ...s,
        type: 'bar',
        direction: 'horizontal',
        stacked: true,
    })) as AgBarSeriesOptions[],
};

const GROUPED_BAR_OPTIONS: AgCartesianChartOptions = {
    ...BASE_OPTIONS,
    data: [
        { x: 0, y1: 100, y2: 2, y3: 1700 },
        { x: 1, y1: 50, y2: 20, y3: 55 },
        { x: 2, y1: 25, y2: 200, y3: 48 },
        { x: 3, y1: 75, y2: 2000, y3: 72 },
    ],
    tooltip: { range: 'exact' },
    axes: {
        x: {
            position: 'bottom',
            type: 'number',
        },
        y: {
            position: 'left',
            type: 'category',
            bandHighlight: {
                enabled: true,
            },
        },
    },
    series: BASE_OPTIONS.series?.map((s) => ({
        ...s,
        type: 'bar',
        direction: 'horizontal',
        stacked: false,
    })) as AgBarSeriesOptions[],
};

const STACKED_AREA_OPTIONS: AgCartesianChartOptions = {
    ...BASE_OPTIONS,
    axes: SIMPLE_AXIS_OPTIONS,
    series: BASE_OPTIONS.series?.map((s) => ({ ...s, type: 'area', stacked: true })) as AgAreaSeriesOptions[],
};

const ORDINAL_TIME_OPTIONS: AgCartesianChartOptions = {
    data: [
        {
            date: new Date('Monday, July 31, 2023'),
            open: 4584.82,
            high: 4594.22,
            low: 4573.14,
            close: 4588.96,
            volume: 2411537985000,
        },
        {
            date: new Date('Tuesday, August 01, 2023'),
            open: 4578.83,
            high: 4584.62,
            low: 4567.53,
            close: 4576.73,
            volume: 2172699881000,
        },
        {
            date: new Date('Wednesday, August 02, 2023'),
            open: 4550.93,
            high: 4550.93,
            low: 4505.75,
            close: 4513.39,
            volume: 2466207896000,
        },
        {
            date: new Date('Thursday, August 03, 2023'),
            open: 4494.27,
            high: 4519.49,
            low: 4485.54,
            close: 4501.89,
            volume: 2351421483000,
        },
        {
            date: new Date('Friday, August 04, 2023'),
            open: 4513.96,
            high: 4540.34,
            low: 4474.55,
            close: 4478.03,
            volume: 2386696495000,
        },
        {
            date: new Date('Monday, August 07, 2023'),
            open: 4491.58,
            high: 4519.84,
            low: 4491.15,
            close: 4518.44,
            volume: 2055431221000,
        },
        {
            date: new Date('Tuesday, August 08, 2023'),
            open: 4498.03,
            high: 4503.31,
            low: 4464.39,
            close: 4499.38,
            volume: 2172253124000,
        },
        {
            date: new Date('Wednesday, August 09, 2023'),
            open: 4501.57,
            high: 4502.44,
            low: 4461.33,
            close: 4467.71,
            volume: 2046722089000,
        },
        {
            date: new Date('Thursday, August 10, 2023'),
            open: 4487.16,
            high: 4527.37,
            low: 4457.92,
            close: 4468.83,
            volume: 2111185396000,
        },
        {
            date: new Date('Friday, August 11, 2023'),
            open: 4450.69,
            high: 4476.23,
            low: 4443.98,
            close: 4464.05,
            volume: 1850766477000,
        },
    ],
    series: [
        {
            type: 'candlestick',
            xKey: 'date',
            xName: 'Date',
            lowKey: 'low',
            highKey: 'high',
            openKey: 'open',
            closeKey: 'close',
        },
    ],
    theme: {
        overrides: {
            common: {
                axes: {
                    'ordinal-time': {
                        bandHighlight: {
                            enabled: true,
                        },
                    },
                },
            },
        },
    },
};

describe('bandHighlight', () => {
    setupMockConsole();

    let chart: any;
    const ctx = setupMockCanvas();

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    const CASES = [
        SIMPLE_LINE_OPTIONS,
        applyAxesFlip(SIMPLE_LINE_OPTIONS),
        SIMPLE_COLUMN_OPTIONS,
        LINE_SECONDARY_AXIS_OPTIONS,
        applyAxesFlip(LINE_SECONDARY_AXIS_OPTIONS),
        STACKED_BAR_OPTIONS,
        STACKED_AREA_OPTIONS,
        applyAxesFlip(STACKED_AREA_OPTIONS),
        ORDINAL_TIME_OPTIONS,
        GROUPED_STACKED_COLUMN_OPTIONS,
        GROUPED_BAR_OPTIONS,
    ];

    it.each(CASES)(`should follow mouse pointer on series hover`, async (TEST_CASE) => {
        const options: AgChartOptions = TEST_CASE;
        prepareEnterpriseTestOptions(options);

        chart = AgCharts.create(options);
        await waitForChartStability(chart);
        await hoverAction(605, 300)(chart);
        await compare();
    });

    it.each(CASES)(`should layout correctly with series area padding`, async (TEST_CASE) => {
        const options: AgChartOptions = TEST_CASE;
        prepareEnterpriseTestOptions(options);
        options.seriesArea = {
            padding: {
                left: 100,
                right: 100,
                bottom: 100,
                top: 100,
            },
        };

        chart = AgCharts.create(options);
        await waitForChartStability(chart);
        await hoverAction(300, 300)(chart);
        await compare();
    });
});
