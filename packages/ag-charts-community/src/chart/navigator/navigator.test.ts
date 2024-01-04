import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { AgCharts } from '../../main';
import type { AgCartesianChartOptions } from '../../options/agChartOptions';
import * as CROSSLINE_EXAMPLES from '../crossline/test/examples';
import {
    type CartesianTestCase,
    IMAGE_SNAPSHOT_DEFAULTS,
    cartesianChartAssertions,
    extractImageData,
    prepareTestOptions,
    repeat,
    setupMockCanvas,
    waitForChartStability,
} from '../test/utils';

const { VALID_RANGE_CROSSLINES } = CROSSLINE_EXAMPLES;

const NAVIGATOR_ZOOM_EXAMPLES: Record<string, CartesianTestCase> = {
    NAV_ZOOMED_CROSSLINES: {
        options: {
            ...VALID_RANGE_CROSSLINES,
            navigator: { min: 0.4, max: 0.6 },
        },
        assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: repeat('line', 2) }),
    },
    NAV_ZOOMED_NO_CROSSLINES: {
        options: {
            ...VALID_RANGE_CROSSLINES,
            navigator: { min: 0.0, max: 0.05 },
        },
        assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: repeat('line', 2) }),
    },
    NAV_ZOOMED_NO_CROSSLINES_2: {
        options: {
            ...VALID_RANGE_CROSSLINES,
            navigator: { min: 0.95, max: 1.0 },
        },
        assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: repeat('line', 2) }),
    },
    NAV_ZOOMED_CLIPPED_CROSSLINES_1: {
        options: {
            ...VALID_RANGE_CROSSLINES,
            navigator: { min: 0.0, max: 0.5 },
        },
        assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: repeat('line', 2) }),
    },
    NAV_ZOOMED_CLIPPED_CROSSLINES_2: {
        options: {
            ...VALID_RANGE_CROSSLINES,
            navigator: { min: 0.5, max: 1.0 },
        },
        assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: repeat('line', 2) }),
    },
    NAV_ZOOMED_INSIDE_CROSSLINES_1: {
        options: {
            ...VALID_RANGE_CROSSLINES,
            navigator: { min: 0.4, max: 0.6 },
        },
        assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: repeat('line', 2) }),
    },
    NAV_ZOOMED_INSIDE_CROSSLINES_2: {
        options: {
            ...VALID_RANGE_CROSSLINES,
            navigator: { min: 0.51, max: 0.55 },
        },
        assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: repeat('line', 2) }),
    },
    NAV_ZOOMED_EDGE_CROSSLINES_1: {
        options: {
            ...VALID_RANGE_CROSSLINES,
            navigator: { min: 0.14661198412976173, max: 0.3286788694841538 },
        },
        assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: repeat('line', 2) }),
    },
    NAV_ZOOMED_EDGE_CROSSLINES_2: {
        options: {
            ...VALID_RANGE_CROSSLINES,
            navigator: { min: 0.15, max: 0.3286788694841538 + 0.001 },
        },
        assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: repeat('line', 2) }),
    },
    NAV_ZOOMED_EDGE_CROSSLINES_3: {
        options: {
            ...VALID_RANGE_CROSSLINES,
            navigator: { min: 1 - 0.3286788694841538, max: 1 - 0.14661198412976173 },
        },
        assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: repeat('line', 2) }),
    },
    NAV_ZOOMED_EDGE_CROSSLINES_4: {
        options: {
            ...VALID_RANGE_CROSSLINES,
            navigator: { min: 1 - 0.3286788694841538 - 0.006, max: 0.85 },
        },
        assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: repeat('line', 2) }),
    },
};

const EXAMPLES: Record<string, CartesianTestCase> = {
    ...NAVIGATOR_ZOOM_EXAMPLES,
};

describe('Navigator', () => {
    let chart: any;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    describe('#create', () => {
        beforeEach(() => {
            console.warn = jest.fn();
        });

        afterEach(() => {
            expect(console.warn).not.toBeCalled();
        });

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
                const compare = async () => {
                    await waitForChartStability(chart);

                    const imageData = extractImageData(ctx);
                    expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
                };

                const options: AgCartesianChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await compare();
            }
        );
    });
});
