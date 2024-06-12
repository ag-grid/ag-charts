import { afterEach, describe, expect, it } from '@jest/globals';

import type {
    AgCartesianChartOptions,
    AgCartesianCrossLineOptions,
    AgChartInstance,
    AgCrossLineLabelPosition,
} from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import type { CartesianTestCase } from '../test/utils';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    cartesianChartAssertions,
    expectWarningMessages,
    extractImageData,
    prepareTestOptions,
    repeat,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';
import * as examples from './test/examples';

const labelPositions: AgCrossLineLabelPosition[] = [
    'top',
    'left',
    'right',
    'bottom',
    'topLeft',
    'topRight',
    'bottomLeft',
    'bottomRight',
    'inside',
    'insideLeft',
    'insideRight',
    'insideTop',
    'insideBottom',
    'insideTopLeft',
    'insideBottomLeft',
    'insideTopRight',
    'insideBottomRight',
];

const flipCrossLinesRange = (crossLineOptions: AgCartesianCrossLineOptions): AgCartesianCrossLineOptions => {
    const flippedRange: [any, any] = [crossLineOptions.range?.[1], crossLineOptions.range?.[0]];
    return {
        ...crossLineOptions,
        range: flippedRange,
    };
};

const applyCrossLinesLabelPosition = (
    crossLineOptions: AgCartesianCrossLineOptions,
    position: AgCrossLineLabelPosition
): AgCartesianCrossLineOptions => {
    return {
        ...crossLineOptions,
        label: {
            ...crossLineOptions.label,
            position,
        },
    };
};

const mixinFlippedRangeCases = (
    baseRangeCases: Record<string, CartesianTestCase>
): Record<string, CartesianTestCase> => {
    const result: Record<string, CartesianTestCase> = { ...baseRangeCases };

    const examplesToFlip = Object.entries(baseRangeCases).slice(0, -2);

    examplesToFlip.forEach(([name, example]) => {
        const prefix = name.substring(0, name.indexOf('_'));
        const suffix = name.substring(name.indexOf('_'));
        result[`${prefix}_FLIPPED${suffix}`] = {
            ...example,
            options: {
                ...example.options,
                axes: example.options.axes?.map((axis) =>
                    axis.crossLines
                        ? {
                              ...axis,
                              crossLines: axis.crossLines.map((c) => flipCrossLinesRange(c)),
                          }
                        : axis
                ),
            },
        };
    });

    return result;
};

const mixinLabelPositionCases = (example: CartesianTestCase): Record<string, CartesianTestCase> => {
    const result: Record<string, CartesianTestCase> = { DEFAULT_LABEL_POSITION_CROSSLINES: { ...example } };

    for (const position of labelPositions) {
        result[`${position}_LABEL_POSITION_CROSSLINES`] = {
            ...example,
            options: {
                ...example.options,
                axes: example.options.axes?.map((axis) =>
                    axis.crossLines
                        ? {
                              ...axis,
                              crossLines: axis.crossLines.map((c) => applyCrossLinesLabelPosition(c, position)),
                          }
                        : axis
                ),
            },
        };
    }

    return result;
};

const CROSSLINES_LABEL_POSITION_EXAMPLES: Record<string, CartesianTestCase> = mixinLabelPositionCases({
    options: examples.DEFAULT_LABEL_POSITION_CROSSLINES,
    assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: repeat('line', 2) }),
});

const CROSSLINES_RANGE_EXAMPLES: Record<string, CartesianTestCase> = mixinFlippedRangeCases({
    VALID_RANGE_CROSSLINES: {
        options: examples.VALID_RANGE_CROSSLINES,
        assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: repeat('line', 2) }),
    },
    RANGE_OUTSIDE_DOMAIN_MAX_CROSSLINES: {
        options: examples.RANGE_OUTSIDE_DOMAIN_MAX_CROSSLINES,
        assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: repeat('line', 2) }),
    },
    RANGE_OUTSIDE_DOMAIN_MIN_CROSSLINES: {
        options: examples.RANGE_OUTSIDE_DOMAIN_MIN_CROSSLINES,
        assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: repeat('line', 2) }),
    },
    RANGE_OUTSIDE_DOMAIN_MIN_MAX_CROSSLINES: {
        options: examples.RANGE_OUTSIDE_DOMAIN_MIN_MAX_CROSSLINES,
        assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: repeat('line', 2) }),
    },
    RANGE_OUTSIDE_DOMAIN_CROSSLINES: {
        options: examples.RANGE_OUTSIDE_DOMAIN_CROSSLINES,
        assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: repeat('line', 2) }),
    },
});

const EXAMPLES: Record<string, CartesianTestCase> = {
    ...CROSSLINES_RANGE_EXAMPLES,
    ...CROSSLINES_LABEL_POSITION_EXAMPLES,
    SCATTER_CROSSLINES: {
        options: examples.SCATTER_CROSSLINES,
        assertions: cartesianChartAssertions({ axisTypes: ['number', 'number'], seriesTypes: ['scatter'] }),
    },
    LINE_CROSSLINES: {
        options: examples.LINE_CROSSLINES,
        assertions: cartesianChartAssertions({
            axisTypes: ['category', 'number'],
            seriesTypes: repeat('line', 16),
        }),
    },
    AREA_CROSSLINES: {
        options: examples.AREA_CROSSLINES,
        assertions: cartesianChartAssertions({
            axisTypes: ['category', 'number'],
            seriesTypes: repeat('area', 5),
        }),
    },
    COLUMN_CROSSLINES: {
        options: examples.COLUMN_CROSSLINES,
        assertions: cartesianChartAssertions({
            axisTypes: ['category', 'number'],
            seriesTypes: repeat('bar', 7),
        }),
    },
    BAR_CROSSLINES: {
        options: examples.BAR_CROSSLINES,
        assertions: cartesianChartAssertions({
            axisTypes: ['category', 'number'],
            seriesTypes: repeat('bar', 2),
        }),
    },
};

const INVALID_EXAMPLES: Record<string, CartesianTestCase & { warningMessages: string[] }> = {
    INVALID_RANGE_CROSSLINES: {
        options: examples.INVALID_RANGE_VALUE_CROSSLINE,
        assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: repeat('line', 2) }),
        warningMessages: [`AG Charts - Expecting crossLine range start undefined to match the axis scale domain.`],
    },
    INVALID_RANGE_LENGTH_CROSSLINE: {
        options: examples.INVALID_RANGE_LENGTH_CROSSLINE,
        assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: repeat('line', 2) }),
        warningMessages: [
            `AG Charts - Property [range] of [CrossLine] cannot be set to [[128,134,135]]; expecting an array of length 2, ignoring.`,
        ],
    },
    INVALID_RANGE_WITHOUT_TYPE_CROSSLINE: {
        options: examples.INVALID_RANGE_WITHOUT_TYPE_CROSSLINE,
        assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: repeat('line', 2) }),
        warningMessages: [
            `AG Charts - Property [range] of [CrossLine] cannot be set to [[128,134]]; expecting crossLine property 'type' to be 'range', ignoring.`,
        ],
    },
    INVALID_LINE_VALUE_CROSSLINES: {
        options: examples.INVALID_LINE_VALUE_CROSSLINES,
        assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: repeat('line', 2) }),
        warningMessages: [
            `AG Charts - Expecting crossLine value "a string instead of number" to match the axis scale domain.`,
        ],
    },
    INVALID_RANGE_WITH_LINE_TYPE_CROSSLINE: {
        options: examples.INVALID_RANGE_WITH_LINE_TYPE_CROSSLINE,
        assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: repeat('line', 2) }),
        warningMessages: [
            `AG Charts - Property [range] of [CrossLine] cannot be set to [[128,134]]; expecting crossLine type 'line' to have a 'value' property instead of 'range', ignoring.`,
        ],
    },
    INVALID_LINE_WITHOUT_TYPE_CROSSLINE: {
        options: examples.INVALID_LINE_WITHOUT_TYPE_CROSSLINE,
        assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: repeat('line', 2) }),
        warningMessages: [
            `AG Charts - Property [value] of [CrossLine] cannot be set to [128]; expecting crossLine property 'type' to be 'line', ignoring.`,
        ],
    },
    INVALID_LINE_WITH_RANGE_TYPE_CROSSLINE: {
        options: examples.INVALID_LINE_WITH_RANGE_TYPE_CROSSLINE,
        assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: repeat('line', 2) }),
        warningMessages: [
            `AG Charts - Property [value] of [CrossLine] cannot be set to [128]; expecting crossLine type 'range' to have a 'range' property instead of 'value', ignoring.`,
        ],
    },
};

describe('CrossLine', () => {
    setupMockConsole();

    let chart: AgChartInstance;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    describe('#create', () => {
        it.each(Object.entries(EXAMPLES))(
            'for %s it should create chart instance as expected',
            async (_exampleName, example) => {
                const options: AgCartesianChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                await example.assertions(chart);
            }
        );

        it.each(Object.entries(EXAMPLES))(
            'for %s it should render to canvas as expected',
            async (_exampleName, example) => {
                const options: AgCartesianChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await compare();
            }
        );
    });

    describe('#invalid options', () => {
        it.each(Object.entries(INVALID_EXAMPLES))(
            'for %s it should render to canvas without crossLines and show warning',
            async (_exampleName, example) => {
                const options: AgCartesianChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await compare();

                expectWarningMessages(example.warningMessages);
            }
        );
    });
});
