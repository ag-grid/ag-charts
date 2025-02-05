import type { SeriesModule } from '../../../module/coreModules';
import { CARTESIAN_AXIS_TYPE, CARTESIAN_POSITION } from '../../themes/constants';
import { DEFAULT_COLOR_RANGE, DEFAULT_SHADOW_COLOUR } from '../../themes/symbols';
import { markerPaletteFactory } from '../../themes/util';
import { AreaSeries } from './areaSeries';

export const AreaSeriesModule: SeriesModule<'area'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'community',
    chartTypes: ['cartesian'],

    identifier: 'area',
    moduleFactory: (ctx) => new AreaSeries(ctx),
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
            nodeClickRange: 'nearest',
            tooltip: { position: { type: 'node' } },
            fillOpacity: 0.8,
            strokeOpacity: 1,
            strokeWidth: 0,
            lineDash: [0],
            lineDashOffset: 0,
            shadow: {
                enabled: false,
                color: DEFAULT_SHADOW_COLOUR,
                xOffset: 3,
                yOffset: 3,
                blur: 5,
            },
            interpolation: {
                type: 'linear',
                tension: 1,
                position: 'end',
            },
            marker: {
                enabled: false,
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
        },
    },
    paletteFactory: (params) => {
        const { marker } = markerPaletteFactory(params);
        const defaultColorRange = params.themeTemplateParameters.get(DEFAULT_COLOR_RANGE);
        return { fill: marker.fill, stroke: marker.stroke, marker, defaultColorRange };
    },
};
