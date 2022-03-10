import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import { AgCartesianChartOptions, AgChartOptions } from './agChartOptions';
import { AgChartV2 } from './agChartV2';
import { Chart } from './chart';
import * as examples from './test/examples';
import {
    repeat,
    waitForChartStability,
    cartesianChartAssertions,
    combineAssertions,
    hoverAction,
    IMAGE_SNAPSHOT_DEFAULTS,
} from './test/utils';

expect.extend({ toMatchImageSnapshot });

function consoleWarnAssertions(options: AgCartesianChartOptions) {
    return async (chart: Chart) => {
        expect(console.warn).toBeCalledTimes(1);
        expect(console.warn).toBeCalledWith(
            'AG Charts - the axis label format string %H:%M is invalid. No formatting will be applied'
        );

        jest.clearAllMocks();
        options.axes[0].label.format = '%X %M'; // format string for Date objects, not valid for number values
        AgChartV2.update(chart, options);

        expect(console.warn).toBeCalledTimes(1);
        expect(console.warn).toBeCalledWith(
            'AG Charts - the axis label format string %X %M is invalid. No formatting will be applied'
        );

        jest.clearAllMocks();
        options.axes[0].label.format = '%'; // multiply by 100, and then decimal notation with a percent sign - valid format string for number values
        AgChartV2.update(chart, options);

        expect(console.warn).not.toBeCalled();

        // hovering on chart calls getTooltipHtml() which uses formatDatum() from NumberAxis to format the data points
        // if formatting non-numeric values (Date objects), a warning will be displayed
        await waitForChartStability(chart);
        await hoverAction(200, 100)(chart);

        expect(console.warn).toBeCalledTimes(1);
        expect(console.warn).toBeCalledWith(
            'AG Charts - Data contains Date objects which are being plotted against a number axis, please only use a number axis for numbers.'
        );

        jest.clearAllMocks(); // this is to make sure the afterAll check for console warnings passes
    };
}

type TestCase = {
    options: AgChartOptions;
    assertions: (chart: Chart) => Promise<void>;
    extraScreenshotActions?: (chart: Chart) => Promise<void>;
};
const EXAMPLES: Record<string, TestCase> = {
    AREA_MISSING_DATA_EXAMPLE: {
        options: examples.AREA_MISSING_DATA_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: ['category', 'number'], seriesTypes: ['area'] }),
    },
    STACKED_AREA_MISSING_DATA_EXAMPLE: {
        options: examples.STACKED_AREA_MISSING_DATA_EXAMPLE,
        assertions: cartesianChartAssertions({ axisTypes: ['category', 'number'], seriesTypes: ['area'] }),
    },
    LINE_TIME_X_AXIS_NUMBER_Y_AXIS: {
        options: examples.LINE_TIME_X_AXIS_NUMBER_Y_AXIS,
        assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: repeat('line', 2) }),
    },
    LINE_NUMBER_X_AXIS_TIME_Y_AXIS: {
        options: examples.LINE_NUMBER_X_AXIS_TIME_Y_AXIS,
        assertions: cartesianChartAssertions({ axisTypes: ['number', 'time'], seriesTypes: repeat('line', 2) }),
    },
    LINE_NUMBER_AXES_0_X_DOMAIN: {
        options: examples.LINE_NUMBER_AXES_0_X_DOMAIN,
        assertions: cartesianChartAssertions({ axisTypes: ['number', 'number'], seriesTypes: repeat('line', 2) }),
    },
    LINE_NUMBER_AXES_0_Y_DOMAIN: {
        options: examples.LINE_NUMBER_AXES_0_Y_DOMAIN,
        assertions: cartesianChartAssertions({ axisTypes: ['number', 'number'], seriesTypes: repeat('line', 2) }),
    },
    AREA__TIME_X_AXIS_NUMBER_Y_AXIS: {
        options: examples.AREA_TIME_X_AXIS_NUMBER_Y_AXIS,
        assertions: cartesianChartAssertions({ axisTypes: ['time', 'number'], seriesTypes: repeat('area', 2) }),
    },
    AREA_NUMBER_X_AXIS_TIME_Y_AXIS: {
        options: examples.AREA_NUMBER_X_AXIS_TIME_Y_AXIS,
        assertions: cartesianChartAssertions({ axisTypes: ['number', 'time'], seriesTypes: repeat('area', 2) }),
    },
    AREA_NUMBER_AXES_0_X_DOMAIN: {
        options: examples.AREA_NUMBER_AXES_0_X_DOMAIN,
        assertions: cartesianChartAssertions({ axisTypes: ['number', 'number'], seriesTypes: repeat('area', 2) }),
    },
    AREA_NUMBER_AXES_0_Y_DOMAIN: {
        options: examples.AREA_NUMBER_AXES_0_Y_DOMAIN,
        assertions: cartesianChartAssertions({ axisTypes: ['number', 'number'], seriesTypes: repeat('area', 2) }),
    },
    INVALID_AXIS_LABEL_FORMAT: {
        options: examples.INVALID_AXIS_LABEL_FORMAT,
        assertions: combineAssertions(
            cartesianChartAssertions({ axisTypes: ['number', 'number'], seriesTypes: ['line'] }),
            consoleWarnAssertions(examples.INVALID_AXIS_LABEL_FORMAT)
        ),
    },
};

describe('AgChartV2', () => {
    describe('#create', () => {
        beforeEach(() => {
            console.warn = jest.fn();
        });

        afterEach(() => {
            expect(console.warn).not.toBeCalled();
        });

        for (const [exampleName, example] of Object.entries(EXAMPLES)) {
            it(`for ${exampleName} it should create chart instance as expected`, async () => {
                const options: AgChartOptions = example.options;
                const chart = AgChartV2.create<any>(options);
                await example.assertions(chart);
            });

            it(`for ${exampleName} it should render to canvas as expected`, async () => {
                const compare = async () => {
                    await waitForChartStability(chart);

                    const canvas = chart.scene.canvas;
                    const imageDataUrl = canvas.getDataURL('image/png');
                    const imageData = Buffer.from(imageDataUrl.split(',')[1], 'base64');

                    (expect(imageData) as any).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
                };

                const options: AgChartOptions = { ...example.options };
                options.autoSize = false;
                options.width = 800;
                options.height = 600;

                const chart = AgChartV2.create<any>(options) as Chart;
                await compare();

                if (example.extraScreenshotActions) {
                    await example.extraScreenshotActions(chart);
                    await compare();
                }
            });
        }
    });
});
