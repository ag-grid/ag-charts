import { CARTESIAN_AXIS_TYPE, POSITION } from '../../chart/themes/constants';
import type { SeriesModule } from '../modules/types';
import { BarSeries, type BarSeriesOptions } from '../series/barSeries';
import { ChartType } from '../types';
import { boolean, number, required, string, union } from '../util/validation';
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

    dataDefs: {
        x: ['x'],
        y: ['y'],
    },

    defaultAxes: [
        { type: CARTESIAN_AXIS_TYPE.NUMBER, position: POSITION.LEFT },
        { type: CARTESIAN_AXIS_TYPE.CATEGORY, position: POSITION.BOTTOM },
    ],

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
