import type { SeriesModuleDefinition } from 'ag-charts-core';
import type { AgLineSeriesOptions } from 'ag-charts-types';

import type { SeriesModule } from '../../../module/coreModules';
import type { ModuleContext } from '../../../module/moduleContext';
import { CARTESIAN_AXIS_TYPE, CARTESIAN_POSITION } from '../../themes/constants';
import { markerPaletteFactory } from '../../themes/util';
import { LineSeries } from './lineSeries';
import { lineSeriesOptionsDef } from './lineSeriesOptionsDef';

export const LineSeriesModule: SeriesModule<'line'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'community',
    chartTypes: ['cartesian'],

    identifier: 'line',
    moduleFactory: (ctx) => new LineSeries(ctx),
    stackable: true,
    tooltipDefaults: { range: 'nearest' },
    defaultAxes: [
        {
            type: CARTESIAN_AXIS_TYPE.NUMBER,
            position: CARTESIAN_POSITION.LEFT,
        },
        {
            type: CARTESIAN_AXIS_TYPE.CATEGORY,
            position: CARTESIAN_POSITION.BOTTOM,
        },
    ],
    themeTemplate: {
        series: {
            tooltip: { position: { type: 'node' } },
            strokeWidth: 2,
            strokeOpacity: 1,
            lineDash: [0],
            lineDashOffset: 0,
            interpolation: {
                type: 'linear',
                tension: 1,
                position: 'end',
            },
            marker: {
                shape: 'circle',
                size: 7,
                strokeWidth: 0,
            },
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
    paletteFactory: (params) => {
        const { marker } = markerPaletteFactory(params);
        return { stroke: marker.fill, marker };
    },
};

export const NewLineSeriesModule: SeriesModuleDefinition<AgLineSeriesOptions> = {
    type: 'series',
    name: 'line',
    chartType: 'cartesian',

    options: lineSeriesOptionsDef,

    create: (ctx: ModuleContext) => new LineSeries(ctx),
};
