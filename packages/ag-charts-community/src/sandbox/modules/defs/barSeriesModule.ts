import { ChartType } from '../../chart/types';
import { boolean, number, optional, string, union } from '../../util/validate';
import { BarSeries, type BarSeriesOptions } from '../barSeries';
import type { SeriesModule } from '../types';
import { commonSeriesOptionsDefs } from './commonOptions';

export const BarSeriesModule: SeriesModule<BarSeriesOptions> = {
    type: 'series',
    identifier: 'bar',
    constructor: BarSeries,
    chartTypes: [ChartType.Cartesian],
    canSwapDirection: true,
    groupable: true,
    stackable: true,
    defaults: {
        stacked: true,
    },
    optionsDefs: {
        ...commonSeriesOptionsDefs,
        xKey: string,
        yKey: string,
        xValue: optional(string),
        yValue: optional(string),
        normalizedTo: optional(number),
        direction: optional(union('vertical', 'horizontal')),
        grouped: optional(boolean),
        stacked: optional(boolean),
        stackGroup: optional(string),
    },

    dataDefs: {
        xValue: { type: 'key' },
        yValue: { type: 'value' },
        yRange: { type: 'value', subtype: 'range' },
        sInterval: { type: 'reducer' },
    },

    dataDefs: [
        { type: 'key', id: 'xValue', param: 'xKey' },
        { type: 'value', id: 'yValue-raw' }, // yValue-raw
        { type: 'value', id: 'yValue-end' }, // yValue-end
        { type: 'value', id: 'yValue-start' }, // yValue-start
        { type: 'group-value-processor' }, // yValue-end
        { type: 'group-value-processor' }, // yValue-start
        { type: 'aggregate' }, // yValue-end
        { type: 'reducer' }, // smallestKeyInterval
    ],
};
