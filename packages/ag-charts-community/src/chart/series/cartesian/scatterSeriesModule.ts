import type { SeriesModule } from '../../../module/coreModules';
import { markerPaletteFactory } from '../../../module/theme';
import { CARTESIAN_AXIS_TYPE, POSITION } from '../../themes/constants';
import { DEFAULT_FONT_FAMILY, DEFAULT_LABEL_COLOUR } from '../../themes/symbols';
import { ScatterSeries } from './scatterSeries';

export const ScatterSeriesModule: SeriesModule<'scatter'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'community',
    chartTypes: ['cartesian'],

    identifier: 'scatter',
    instanceConstructor: ScatterSeries,
    defaultAxes: [
        {
            type: CARTESIAN_AXIS_TYPE.NUMBER,
            position: POSITION.BOTTOM,
        },
        {
            type: CARTESIAN_AXIS_TYPE.NUMBER,
            position: POSITION.LEFT,
        },
    ],
    themeTemplate: {
        series: {
            tooltip: { position: { type: 'node' } },
            marker: {
                shape: 'circle',
                size: 7,
                fillOpacity: 0.8,
            },
            label: {
                enabled: false,
                fontSize: 12,
                fontFamily: DEFAULT_FONT_FAMILY,
                color: DEFAULT_LABEL_COLOUR,
            },
        },
    },
    enterpriseThemeTemplate: {
        series: {
            errorBar: {
                cap: {
                    lengthRatio: 1,
                },
            },
        },
    },
    paletteFactory: markerPaletteFactory,
};
