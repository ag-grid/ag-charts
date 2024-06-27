import type { SeriesModule } from '../../../module/coreModules';
import { markerPaletteFactory } from '../../../module/theme';
import { CARTESIAN_AXIS_TYPE, POSITION } from '../../themes/constants';
import { DEFAULT_FONT_FAMILY, DEFAULT_LABEL_COLOUR, DEFAULT_SHADOW_COLOUR } from '../../themes/symbols';
import { AreaSeries } from './areaSeries';

export const AreaSeriesModule: SeriesModule<'area'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'community',
    chartTypes: ['cartesian'],

    identifier: 'area',
    instanceConstructor: AreaSeries,
    stackable: true,
    tooltipDefaults: { range: 'nearest' },
    defaultAxes: [
        {
            type: CARTESIAN_AXIS_TYPE.NUMBER,
            position: POSITION.LEFT,
        },
        {
            type: CARTESIAN_AXIS_TYPE.CATEGORY,
            position: POSITION.BOTTOM,
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
                // @ts-expect-error - users shouldn't specify all options, but we have to for theming to work
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
                fontSize: 12,
                fontFamily: DEFAULT_FONT_FAMILY,
                color: DEFAULT_LABEL_COLOUR,
            },
        },
    },
    paletteFactory: (params) => {
        const { marker } = markerPaletteFactory(params);
        return { fill: marker.fill, stroke: marker.stroke, marker };
    },
};
