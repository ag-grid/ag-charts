import { describe } from '@jest/globals';
import 'jest-canvas-mock';

import { seriesRegistry } from '../chart/factory/seriesRegistry';
import type {
    AgAreaSeriesOptions,
    AgBarSeriesOptions,
    AgChartOptions,
    AgLineSeriesOptions,
} from '../options/agChartOptions';
import { doOnce } from '../util/function';
import { ChartOptions } from './optionsModule';
import type { SeriesType } from './optionsModuleTypes';

function prepareOptions<T extends AgChartOptions>(userOptions: T): T {
    const chartOptions = new ChartOptions(userOptions);
    return chartOptions.processedOptions as T;
}

function getSeriesOptions(seriesType: string, mapper?: <T>(series: T) => T) {
    const seriesOptions = seriesOptionsMap[seriesType];
    return mapper ? seriesOptions.map(mapper) : seriesOptions;
}

function switchSeriesType(
    type: 'bar' | 'line' | 'area',
    series: AgBarSeriesOptions | AgLineSeriesOptions | AgAreaSeriesOptions
): AgBarSeriesOptions | AgLineSeriesOptions | AgAreaSeriesOptions {
    return { ...series, type } as any;
}

const baseSeriesIPhone = {
    xKey: 'quarter',
    yKey: 'iphone',
    yName: 'IPhone',
};
const baseSeriesMac = {
    xKey: 'quarter',
    yKey: 'mac',
    yName: 'Mac',
};
const baseSeriesWearables = {
    xKey: 'quarter',
    yKey: 'wearables',
    yName: 'Wearables',
};
const baseSeriesServices = {
    xKey: 'quarter',
    yKey: 'services',
    yName: 'Services',
};

const colSeriesIPhone = switchSeriesType('bar', baseSeriesIPhone);
const colSeriesMac = switchSeriesType('bar', baseSeriesMac);
const colSeriesWearables = switchSeriesType('bar', baseSeriesWearables);
const colSeriesServices = switchSeriesType('bar', baseSeriesServices);
const lineSeriesIPhone = switchSeriesType('line', baseSeriesIPhone);
const lineSeriesMac = switchSeriesType('line', baseSeriesMac);
const areaSeriesIPhone = switchSeriesType('area', baseSeriesIPhone);
const areaSeriesMac = switchSeriesType('area', baseSeriesMac);
const areaSeriesWearables = switchSeriesType('area', baseSeriesWearables);
const areaSeriesServices = switchSeriesType('area', baseSeriesServices);

const seriesOptions: Array<AgBarSeriesOptions | AgLineSeriesOptions | AgAreaSeriesOptions> = [
    {
        ...colSeriesIPhone,
        fill: 'pink',
        showInLegend: true,
    } as AgBarSeriesOptions,
    lineSeriesMac,
    {
        ...colSeriesMac,
        fill: 'red',
        showInLegend: false,
    } as AgBarSeriesOptions,
    lineSeriesIPhone,
    {
        ...colSeriesWearables,
        showInLegend: true,
        grouped: true,
    } as AgBarSeriesOptions,
    {
        ...colSeriesServices,
        showInLegend: false,
        grouped: true,
    } as AgBarSeriesOptions,
];

const areas = [areaSeriesIPhone, areaSeriesMac, areaSeriesWearables, areaSeriesServices];
const lines = [lineSeriesIPhone, lineSeriesMac];
const columns = [colSeriesIPhone, colSeriesMac, colSeriesWearables, colSeriesServices];
const rangeColumns = [
    {
        type: 'range-bar',
        xKey: 'date',
        yLowKey: 'low',
        yHighKey: 'high',
    },
    {
        type: 'range-bar',
        xKey: 'date',
        yLowKey: 'low2',
        yHighKey: 'high2',
    },
];

const nightingales = [
    {
        type: 'nightingale',
        angleKey: 'product',
        radiusKey: 'A sales',
    },
    {
        type: 'nightingale',
        angleKey: 'product',
        radiusKey: 'B sales',
    },
];

const seriesOptionsMap: Record<string, any[]> = {
    area: areas,
    bar: columns,
    line: lines,
    nightingale: nightingales,
    'range-bar': rangeColumns,
};

describe('ChartOptions', () => {
    beforeEach(() => {
        console.warn = jest.fn();
        doOnce.clear();
    });

    describe('#processSeriesOptions', () => {
        test('Simple series options processing works as expected', () => {
            const { series: options } = prepareOptions({ series: seriesOptions });

            expect(options).toMatchInlineSnapshot(`
                    [
                      {
                        "fill": "pink",
                        "seriesGrouping": {
                          "groupCount": 4,
                          "groupIndex": 0,
                          "stackCount": 0,
                          "stackIndex": 0,
                        },
                        "showInLegend": true,
                        "type": "bar",
                        "xKey": "quarter",
                        "yKey": "iphone",
                        "yName": "IPhone",
                      },
                      {
                        "fill": "red",
                        "seriesGrouping": {
                          "groupCount": 4,
                          "groupIndex": 1,
                          "stackCount": 0,
                          "stackIndex": 0,
                        },
                        "showInLegend": false,
                        "type": "bar",
                        "xKey": "quarter",
                        "yKey": "mac",
                        "yName": "Mac",
                      },
                      {
                        "seriesGrouping": {
                          "groupCount": 4,
                          "groupIndex": 2,
                          "stackCount": 0,
                          "stackIndex": 0,
                        },
                        "showInLegend": true,
                        "type": "bar",
                        "xKey": "quarter",
                        "yKey": "wearables",
                        "yName": "Wearables",
                      },
                      {
                        "seriesGrouping": {
                          "groupCount": 4,
                          "groupIndex": 3,
                          "stackCount": 0,
                          "stackIndex": 0,
                        },
                        "showInLegend": false,
                        "type": "bar",
                        "xKey": "quarter",
                        "yKey": "services",
                        "yName": "Services",
                      },
                      {
                        "type": "line",
                        "xKey": "quarter",
                        "yKey": "mac",
                        "yName": "Mac",
                      },
                      {
                        "type": "line",
                        "xKey": "quarter",
                        "yKey": "iphone",
                        "yName": "IPhone",
                      },
                    ]
                `);
        });

        test('Series options with grouped columns processing works as expected', () => {
            const { series: options } = prepareOptions({
                series: seriesOptions.map((s) => (s.type === 'bar' ? { ...s, grouped: true } : s)),
            });

            expect(options).toMatchInlineSnapshot(`
                    [
                      {
                        "fill": "pink",
                        "seriesGrouping": {
                          "groupCount": 4,
                          "groupIndex": 0,
                          "stackCount": 0,
                          "stackIndex": 0,
                        },
                        "showInLegend": true,
                        "type": "bar",
                        "xKey": "quarter",
                        "yKey": "iphone",
                        "yName": "IPhone",
                      },
                      {
                        "fill": "red",
                        "seriesGrouping": {
                          "groupCount": 4,
                          "groupIndex": 1,
                          "stackCount": 0,
                          "stackIndex": 0,
                        },
                        "showInLegend": false,
                        "type": "bar",
                        "xKey": "quarter",
                        "yKey": "mac",
                        "yName": "Mac",
                      },
                      {
                        "seriesGrouping": {
                          "groupCount": 4,
                          "groupIndex": 2,
                          "stackCount": 0,
                          "stackIndex": 0,
                        },
                        "showInLegend": true,
                        "type": "bar",
                        "xKey": "quarter",
                        "yKey": "wearables",
                        "yName": "Wearables",
                      },
                      {
                        "seriesGrouping": {
                          "groupCount": 4,
                          "groupIndex": 3,
                          "stackCount": 0,
                          "stackIndex": 0,
                        },
                        "showInLegend": false,
                        "type": "bar",
                        "xKey": "quarter",
                        "yKey": "services",
                        "yName": "Services",
                      },
                      {
                        "type": "line",
                        "xKey": "quarter",
                        "yKey": "mac",
                        "yName": "Mac",
                      },
                      {
                        "type": "line",
                        "xKey": "quarter",
                        "yKey": "iphone",
                        "yName": "IPhone",
                      },
                    ]
                `);
        });

        test('Series options with stacked columns processing works as expected', () => {
            const { series: options } = prepareOptions({
                series: seriesOptions.map((s) => (s.type === 'bar' ? { ...s, stacked: true, grouped: undefined } : s)),
            });

            expect(options).toMatchInlineSnapshot(`
                    [
                      {
                        "fill": "pink",
                        "seriesGrouping": {
                          "groupCount": 1,
                          "groupIndex": 0,
                          "stackCount": 4,
                          "stackIndex": 0,
                        },
                        "showInLegend": true,
                        "type": "bar",
                        "xKey": "quarter",
                        "yKey": "iphone",
                        "yName": "IPhone",
                      },
                      {
                        "fill": "red",
                        "seriesGrouping": {
                          "groupCount": 1,
                          "groupIndex": 0,
                          "stackCount": 4,
                          "stackIndex": 1,
                        },
                        "showInLegend": false,
                        "type": "bar",
                        "xKey": "quarter",
                        "yKey": "mac",
                        "yName": "Mac",
                      },
                      {
                        "seriesGrouping": {
                          "groupCount": 1,
                          "groupIndex": 0,
                          "stackCount": 4,
                          "stackIndex": 2,
                        },
                        "showInLegend": true,
                        "type": "bar",
                        "xKey": "quarter",
                        "yKey": "wearables",
                        "yName": "Wearables",
                      },
                      {
                        "seriesGrouping": {
                          "groupCount": 1,
                          "groupIndex": 0,
                          "stackCount": 4,
                          "stackIndex": 3,
                        },
                        "showInLegend": false,
                        "type": "bar",
                        "xKey": "quarter",
                        "yKey": "services",
                        "yName": "Services",
                      },
                      {
                        "type": "line",
                        "xKey": "quarter",
                        "yKey": "mac",
                        "yName": "Mac",
                      },
                      {
                        "type": "line",
                        "xKey": "quarter",
                        "yKey": "iphone",
                        "yName": "IPhone",
                      },
                    ]
                `);
        });

        describe('Stacking and grouping configuration combinations', () => {
            const seriesTypes: {
                [K in SeriesType]?: { stackable: boolean; groupable: boolean; stackedByDefault: boolean };
            } = {
                area: { stackable: true, groupable: false, stackedByDefault: false },
                bar: { stackable: true, groupable: true, stackedByDefault: false },
                line: { stackable: false, groupable: false, stackedByDefault: false },
                nightingale: { stackable: true, groupable: true, stackedByDefault: true },
                'range-bar': { stackable: false, groupable: true, stackedByDefault: false },
            };

            for (const [seriesType, { stackable, groupable, stackedByDefault }] of Object.entries(seriesTypes)) {
                seriesRegistry.register(
                    seriesType as SeriesType,
                    {
                        chartTypes: ['cartesian'],
                        stackable,
                        groupable,
                        stackedByDefault,
                    } as any
                );
            }

            it.each(Object.keys(seriesTypes))(
                "handle stacked property 'true' for series type [%s] appropriately",
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({ ...s, stacked: true }));
                    const options = prepareOptions({ series: testOptions });
                    const { stackable } = seriesTypes[seriesType as SeriesType]!;

                    options.series.forEach((series) => {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);

                        if (stackable) {
                            expect(console.warn).not.toHaveBeenCalled();
                            expect(series.seriesGrouping).toMatchSnapshot({
                                groupIndex: expect.any(Number),
                                groupCount: expect.any(Number),
                                stackIndex: expect.any(Number),
                                stackCount: expect.any(Number),
                            });
                        } else {
                            expect(console.warn).toHaveBeenCalledWith(
                                `AG Charts - unsupported stacking of series type "${seriesType}".`
                            );
                            expect(series.seriesGrouping).toBe(undefined);
                        }
                    });
                }
            );

            it.each(Object.keys(seriesTypes))(
                "handle stacked property 'false' for series type [%s] appropriately",
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({ ...s, stacked: false }));
                    const options = prepareOptions({ series: testOptions });
                    const { groupable } = seriesTypes[seriesType as SeriesType]!;

                    options.series.forEach((series) => {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);
                        expect(console.warn).not.toHaveBeenCalled();

                        if (groupable) {
                            expect(series.seriesGrouping).toMatchSnapshot({
                                groupIndex: expect.any(Number),
                                groupCount: expect.any(Number),
                                stackIndex: 0,
                                stackCount: 0,
                            });
                        } else {
                            expect(series.seriesGrouping).toBe(undefined);
                        }
                    });
                }
            );

            it.each(Object.keys(seriesTypes))(
                'handle omitted stacked property for series type [%s] appropriately',
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({ ...s, stacked: undefined }));
                    const options = prepareOptions({ series: testOptions });
                    const { stackable, stackedByDefault, groupable } = seriesTypes[seriesType as SeriesType]!;

                    options.series.forEach((series) => {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);
                        expect(console.warn).not.toHaveBeenCalled();

                        if (stackable && stackedByDefault) {
                            expect(series.seriesGrouping).toMatchSnapshot({
                                groupIndex: expect.any(Number),
                                groupCount: expect.any(Number),
                                stackIndex: expect.any(Number),
                                stackCount: expect.any(Number),
                            });
                        } else if (groupable) {
                            expect(series.seriesGrouping).toMatchSnapshot({
                                groupIndex: expect.any(Number),
                                groupCount: expect.any(Number),
                                stackIndex: 0,
                                stackCount: 0,
                            });
                        } else {
                            expect(series.seriesGrouping).toBe(undefined);
                        }
                    });
                }
            );

            it.each(Object.keys(seriesTypes))(
                "handle grouped property 'true' for series type [%s] appropriately",
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({ ...s, grouped: true }));
                    const options = prepareOptions({ series: testOptions });
                    const { groupable } = seriesTypes[seriesType as SeriesType]!;

                    options.series.forEach((series) => {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);

                        if (groupable) {
                            expect(console.warn).not.toHaveBeenCalled();
                            expect(series.seriesGrouping).toMatchSnapshot({
                                groupIndex: expect.any(Number),
                                groupCount: expect.any(Number),
                                stackIndex: 0,
                                stackCount: 0,
                            });
                        } else {
                            expect(console.warn).toHaveBeenCalledWith(
                                `AG Charts - unsupported grouping of series type "${seriesType}".`
                            );
                            expect(series.seriesGrouping).toBe(undefined);
                        }
                    });
                }
            );

            it.each(Object.keys(seriesTypes))(
                "handle grouped property 'false' for series type [%s] appropriately",
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({ ...s, grouped: false }));
                    const options = prepareOptions({ series: testOptions });
                    const { stackable, stackedByDefault } = seriesTypes[seriesType as SeriesType]!;

                    options.series.forEach((series) => {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);
                        expect(console.warn).not.toHaveBeenCalled();

                        if (stackable && stackedByDefault) {
                            expect(series.seriesGrouping).toMatchSnapshot({
                                groupIndex: expect.any(Number),
                                groupCount: expect.any(Number),
                                stackIndex: expect.any(Number),
                                stackCount: expect.any(Number),
                            });
                        } else {
                            expect(series.seriesGrouping).toBe(undefined);
                        }
                    });
                }
            );

            it.each(Object.keys(seriesTypes))(
                'handle omitted grouped property for series type [%s] appropriately',
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({ ...s, grouped: undefined }));
                    const options = prepareOptions({ series: testOptions });
                    const { stackable, stackedByDefault, groupable } = seriesTypes[seriesType as SeriesType]!;

                    options.series.forEach((series) => {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);
                        expect(console.warn).not.toHaveBeenCalled();

                        if (stackable ? stackedByDefault || groupable : groupable) {
                            expect(series.seriesGrouping).toMatchSnapshot({
                                groupIndex: expect.any(Number),
                                groupCount: expect.any(Number),
                                stackIndex: expect.any(Number),
                                stackCount: expect.any(Number),
                            });
                        } else {
                            expect(series.seriesGrouping).toBe(undefined);
                        }
                    });
                }
            );

            it.each(Object.keys(seriesTypes))(
                "handle grouped property 'true', stacked property 'true' for series type [%s] appropriately",
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({ ...s, stacked: true, grouped: true }));
                    const options = prepareOptions({ series: testOptions });
                    const { stackable, groupable } = seriesTypes[seriesType as SeriesType]!;

                    options.series.forEach((series) => {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);

                        if (!stackable) {
                            expect(console.warn).toHaveBeenCalledWith(
                                `AG Charts - unsupported stacking of series type "${seriesType}".`
                            );
                        }
                        if (!groupable) {
                            expect(console.warn).toHaveBeenCalledWith(
                                `AG Charts - unsupported grouping of series type "${seriesType}".`
                            );
                        }
                        if (stackable && groupable) {
                            expect(console.warn).not.toHaveBeenCalled();
                        }

                        if (stackable) {
                            expect(series.seriesGrouping).toMatchSnapshot({
                                groupIndex: expect.any(Number),
                                groupCount: expect.any(Number),
                                stackIndex: expect.any(Number),
                                stackCount: expect.any(Number),
                            });
                        } else if (groupable) {
                            expect(series.seriesGrouping).toMatchSnapshot({
                                groupIndex: expect.any(Number),
                                groupCount: expect.any(Number),
                                stackIndex: 0,
                                stackCount: 0,
                            });
                        } else {
                            expect(series.seriesGrouping).toBe(undefined);
                        }
                    });
                }
            );

            it.each(Object.keys(seriesTypes))(
                "handle grouped property 'false', stacked property 'false' for series type [%s] appropriately",
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({
                        ...s,
                        stacked: false,
                        grouped: false,
                    }));
                    const options = prepareOptions({ series: testOptions });

                    options.series.forEach((series) => {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);
                        expect(series.seriesGrouping).toBe(undefined);
                        expect(console.warn).not.toHaveBeenCalled();
                    });
                }
            );

            it.each(Object.keys(seriesTypes))(
                "handle grouped property 'true', stacked property 'false' for series type [%s] appropriately",
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({
                        ...s,
                        stacked: false,
                        grouped: true,
                    }));
                    const options = prepareOptions({ series: testOptions });
                    const { groupable } = seriesTypes[seriesType as SeriesType]!;

                    options.series.forEach((series) => {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);

                        if (groupable) {
                            expect(console.warn).not.toHaveBeenCalled();
                        } else {
                            expect(console.warn).toHaveBeenCalledWith(
                                `AG Charts - unsupported grouping of series type "${seriesType}".`
                            );
                        }

                        if (groupable) {
                            expect(series.seriesGrouping).toMatchSnapshot({
                                groupIndex: expect.any(Number),
                                groupCount: expect.any(Number),
                                stackIndex: 0,
                                stackCount: 0,
                            });
                        } else {
                            expect(series.seriesGrouping).toBe(undefined);
                        }
                    });
                }
            );

            it.each(Object.keys(seriesTypes))(
                "handle grouped property 'false', stacked property 'true' for series type [%s] appropriately",
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({
                        ...s,
                        stacked: true,
                        grouped: false,
                    }));
                    const options = prepareOptions({ series: testOptions });
                    const { stackable } = seriesTypes[seriesType as SeriesType]!;

                    options.series.forEach((series) => {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);

                        if (stackable) {
                            expect(console.warn).not.toHaveBeenCalled();
                            expect(series.seriesGrouping).toMatchSnapshot({
                                groupIndex: expect.any(Number),
                                groupCount: expect.any(Number),
                                stackIndex: expect.any(Number),
                                stackCount: expect.any(Number),
                            });
                        } else {
                            expect(console.warn).toHaveBeenCalledWith(
                                `AG Charts - unsupported stacking of series type "${seriesType}".`
                            );
                            expect(series.seriesGrouping).toBe(undefined);
                        }
                    });
                }
            );

            it.each(Object.keys(seriesTypes))(
                'handle omitted grouped and stacked properties for series type [%s] appropriately',
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({
                        ...s,
                        stacked: undefined,
                        grouped: undefined,
                    }));
                    const options = prepareOptions({ series: testOptions });
                    const { stackable, stackedByDefault, groupable } = seriesTypes[seriesType as SeriesType]!;

                    options.series.forEach((series) => {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);
                        expect(console.warn).not.toHaveBeenCalled();

                        if (stackable ? stackedByDefault || groupable : groupable) {
                            expect(series.seriesGrouping).toMatchSnapshot({
                                groupIndex: expect.any(Number),
                                groupCount: expect.any(Number),
                                stackIndex: expect.any(Number),
                                stackCount: expect.any(Number),
                            });
                        } else {
                            expect(series.seriesGrouping).toBe(undefined);
                        }
                    });
                }
            );
        });
    });
});
