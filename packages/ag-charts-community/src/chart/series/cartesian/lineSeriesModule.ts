import type { SeriesModule } from '../../../util/coreModules';
import { markerPaletteFactory } from '../../../util/theme';
import {
    DEFAULT_FONT_FAMILY,
    DEFAULT_LABEL_COLOUR,
    EXTENDS_CARTESIAN_MARKER_DEFAULTS,
    EXTENDS_SERIES_DEFAULTS,
} from '../../themes/symbols';
import { LineSeries } from './lineSeries';
import type { AgCartesianChartOptions } from '../../../options/agChartOptions';

const LINE_SERIES_DEFAULTS: AgCartesianChartOptions = {
    axes: [
        {
            type: 'number',
            position: 'left',
        },
        {
            type: 'category',
            position: 'bottom',
            groupPaddingInner: 0,
            paddingInner: 1,
            paddingOuter: 0.1,
        },
    ],
};

export const LineSeriesModule: SeriesModule<'line'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'community',
    chartTypes: ['cartesian'],

    identifier: 'line',
    instanceConstructor: LineSeries,
    seriesDefaults: LINE_SERIES_DEFAULTS,
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
