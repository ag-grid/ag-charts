import { BarSeries } from '../series/barSeries';
import { ChartType } from '../types';
import type { CartesianSeriesModule } from '../types/moduleTypes';
import type { BarSeriesOptions } from '../types/seriesTypes';
import { boolean, number, required, string, union } from '../util/validation';
import { commonSeriesOptionsDefs } from './commonOptionsDefs';

export const BarSeriesModule: CartesianSeriesModule<BarSeriesOptions> = {
    type: 'series',
    identifier: 'bar',
    constructor: BarSeries,
    chartTypes: [ChartType.Cartesian],
    canSwapDirection: true,
    groupable: true,
    stackable: true,
    defaults: {
        direction: 'vertical',
        stacked: true,
    },
    optionsDefs: {
        ...commonSeriesOptionsDefs,
        xKey: required(string),
        yKey: required(string),
        xName: string,
        yName: string,
        normalizedTo: number,
        direction: union('vertical', 'horizontal'),
        grouped: boolean,
        stacked: boolean,
        stackGroup: string,
    },

    // dataDefs: {
    //     xValue: { type: 'key' },
    //     yValue: { type: 'value' },
    //     yRange: { type: 'value', subtype: 'range' },
    //     sInterval: { type: 'reducer' },
    // },

    // dataDefs: [
    //     { type: 'key', id: 'xValue', param: 'xKey' },
    //     { type: 'value', id: 'yValue-raw' }, // yValue-raw
    //     { type: 'value', id: 'yValue-end' }, // yValue-end
    //     { type: 'value', id: 'yValue-start' }, // yValue-start
    //     { type: 'group-value-processor' }, // yValue-end
    //     { type: 'group-value-processor' }, // yValue-start
    //     { type: 'aggregate' }, // yValue-end
    //     { type: 'reducer' }, // smallestKeyInterval
    // ],
};
