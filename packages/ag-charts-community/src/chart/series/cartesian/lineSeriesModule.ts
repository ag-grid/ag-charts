import type { SeriesModule } from '../../../module/coreModules';
import { markerPaletteFactory } from '../../../util/theme';
import {
    DEFAULT_FONT_FAMILY,
    DEFAULT_LABEL_COLOUR,
    EXTENDS_CARTESIAN_MARKER_DEFAULTS,
    EXTENDS_SERIES_DEFAULTS,
} from '../../themes/symbols';
import { DEFAULT_CARTESIAN_CHART_OVERRIDES } from '../../mapping/defaults';
import { LineSeries } from './lineSeries';

export const LineSeriesModule: SeriesModule<'line'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'community',
    chartTypes: ['cartesian'],

    identifier: 'line',
    instanceConstructor: LineSeries,
    seriesDefaults: DEFAULT_CARTESIAN_CHART_OVERRIDES,
    themeTemplate: {
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
    paletteFactory: (params) => {
        const { marker } = markerPaletteFactory(params);
        return {
            stroke: marker.stroke,
            marker,
        };
    },
};
