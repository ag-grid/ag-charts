import { type SeriesModuleDefinition } from 'ag-charts-core';
import type { AgBarSeriesOptions } from 'ag-charts-types';

import type { SeriesModule } from '../../../module/coreModules';
import type { ModuleContext } from '../../../module/moduleContext';
import { CARTESIAN_AXIS_TYPE, CARTESIAN_POSITION } from '../../themes/constants';
import { DEFAULT_SHADOW_COLOUR } from '../../themes/symbols';
import { swapAxisCondition } from '../../themes/util';
import { BarSeries } from './barSeries';
import { barSeriesOptionsDef } from './barSeriesOptionsDef';

export const BarSeriesModule: SeriesModule<'bar'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'community',
    chartTypes: ['cartesian'],

    identifier: 'bar',
    moduleFactory: (ctx) => new BarSeries(ctx),
    stackable: true,
    groupable: true,
    tooltipDefaults: { range: 'exact' },
    defaultAxes: swapAxisCondition(
        [
            { type: CARTESIAN_AXIS_TYPE.NUMBER, position: CARTESIAN_POSITION.LEFT },
            { type: CARTESIAN_AXIS_TYPE.CATEGORY, position: CARTESIAN_POSITION.BOTTOM },
        ],
        (series) => series?.direction === 'horizontal'
    ),
    themeTemplate: {
        series: {
            direction: 'vertical',
            fill: { $palette: 'fill' },
            stroke: { $palette: 'stroke' },
            // @ts-expect-error undocumented option
            defaultColorRange: { $palette: 'gradient' },
            fillOpacity: 1,
            strokeWidth: 0,
            lineDash: [0],
            lineDashOffset: 0,
            label: {
                enabled: false,
                fontWeight: { $ref: 'fontWeight' },
                fontSize: { $ref: 'fontSize' },
                fontFamily: { $ref: 'fontFamily' },
                color: {
                    $if: [
                        {
                            $or: [
                                { $eq: [{ $path: './placement' }, 'outside-start'] },
                                { $eq: [{ $path: './placement' }, 'outside-end'] },
                            ],
                        },
                        { $ref: 'textColor' },
                        { $ref: 'backgroundColor' },
                    ],
                },
                placement: 'inside-center',
            },
            shadow: {
                enabled: false,
                color: DEFAULT_SHADOW_COLOUR,
                xOffset: 3,
                yOffset: 3,
                blur: 5,
            },
            errorBar: {
                cap: {
                    lengthRatio: 0.3,
                },
            },
        },
    },
};

export const NewBarSeriesModule: SeriesModuleDefinition<AgBarSeriesOptions> = {
    type: 'series',
    name: 'bar',
    chartType: 'cartesian',

    options: barSeriesOptionsDef,

    create: (ctx: ModuleContext) => new BarSeries(ctx),
};
