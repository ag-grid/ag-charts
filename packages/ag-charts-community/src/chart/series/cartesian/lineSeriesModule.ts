import type { SeriesModule } from '../../../module/coreModules';
import { CARTESIAN_AXIS_TYPE, CARTESIAN_POSITION } from '../../themes/constants';
import { markerPaletteFactory } from '../../themes/util';
import { LineSeries } from './lineSeries';

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
                color: { $ref: 'foregroundColor' },
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
