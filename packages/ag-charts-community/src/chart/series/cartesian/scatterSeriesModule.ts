import type { SeriesModuleDefinition } from 'ag-charts-core';
import type { AgScatterSeriesOptions } from 'ag-charts-types';

import type { SeriesModule } from '../../../module/coreModules';
import type { ModuleContext } from '../../../module/moduleContext';
import { CARTESIAN_AXIS_TYPE, CARTESIAN_POSITION } from '../../themes/constants';
import { ScatterSeries } from './scatterSeries';
import { scatterSeriesOptionsDef } from './scatterSeriesOptionsDef';

export const ScatterSeriesModule: SeriesModule<'scatter'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'community',
    chartTypes: ['cartesian'],

    identifier: 'scatter',
    moduleFactory: (ctx) => new ScatterSeries(ctx),
    tooltipDefaults: { range: 'nearest' },
    defaultAxes: [
        {
            type: CARTESIAN_AXIS_TYPE.NUMBER,
            position: CARTESIAN_POSITION.BOTTOM,
        },
        {
            type: CARTESIAN_AXIS_TYPE.NUMBER,
            position: CARTESIAN_POSITION.LEFT,
        },
    ],
    themeTemplate: {
        series: {
            shape: 'circle',
            size: 7,
            fill: { $palette: 'fill' },
            stroke: { $palette: 'stroke' },
            // @ts-expect-error undocumented option
            defaultColorRange: { $palette: 'gradient' },
            fillOpacity: 0.8,
            tooltip: { position: { anchorTo: 'node' } },
            label: {
                enabled: false,
                fontSize: { $ref: 'fontSize' },
                fontFamily: { $ref: 'fontFamily' },
                fontWeight: { $ref: 'fontWeight' },
                color: { $ref: 'textColor' },
            },
            errorBar: {
                cap: {
                    lengthRatio: 1,
                },
            },
        },
    },
};

export const NewScatterSeriesModule: SeriesModuleDefinition<AgScatterSeriesOptions> = {
    type: 'series',
    name: 'scatter',
    chartType: 'cartesian',

    options: scatterSeriesOptionsDef,

    create: (ctx: ModuleContext) => new ScatterSeries(ctx),
};
