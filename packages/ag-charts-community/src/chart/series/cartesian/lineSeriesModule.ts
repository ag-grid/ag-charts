import type { SeriesModule } from '../../../module/coreModules';
import { markerPaletteFactory } from '../../../module/theme';
import { CARTESIAN_AXIS_TYPE, POSITION } from '../../themes/constants';
import {
    DEFAULT_FONT_FAMILY,
    DEFAULT_LABEL_COLOUR,
    EXTENDS_CARTESIAN_MARKER_DEFAULTS,
    EXTENDS_SERIES_DEFAULTS,
} from '../../themes/symbols';
import { LineSeries } from './lineSeries';

export const LineSeriesModule: SeriesModule<'line'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'community',
    chartTypes: ['cartesian'],

    identifier: 'line',
    instanceConstructor: LineSeries,
    seriesDefaults: {
        axes: [
            {
                type: CARTESIAN_AXIS_TYPE.NUMBER,
                position: POSITION.LEFT,
            },
            {
                type: CARTESIAN_AXIS_TYPE.CATEGORY,
                position: POSITION.BOTTOM,
            },
        ],
    },
    themeTemplate: {
        series: {
            __extends__: EXTENDS_SERIES_DEFAULTS,
            tooltip: {
                position: {
                    type: 'node',
                },
            },
            strokeWidth: 2,
            strokeOpacity: 1,
            lineDash: [0],
            lineDashOffset: 0,
            marker: {
                __extends__: EXTENDS_CARTESIAN_MARKER_DEFAULTS,
                fillOpacity: 1,
                strokeOpacity: 1,
                strokeWidth: 0,
            },
            label: {
                enabled: false,
                fontStyle: undefined,
                fontWeight: undefined,
                fontSize: 12,
                fontFamily: DEFAULT_FONT_FAMILY,
                color: DEFAULT_LABEL_COLOUR,
                formatter: undefined,
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
    paletteFactory: (params) => {
        const { marker } = markerPaletteFactory(params);
        return {
            stroke: marker.fill,
            marker,
        };
    },
};
