import type { SeriesModule } from '../../../module/coreModules';
import { markerPaletteFactory } from '../../../util/theme';
import { DEFAULT_CARTESIAN_CHART_OVERRIDES } from '../../mapping/defaults';
import {
    DEFAULT_FONT_FAMILY,
    DEFAULT_LABEL_COLOUR,
    DEFAULT_SHADOW_COLOUR,
    EXTENDS_CARTESIAN_MARKER_DEFAULTS,
    EXTENDS_SERIES_DEFAULTS,
} from '../../themes/symbols';
import { AreaSeries } from './areaSeries';

export const AreaSeriesModule: SeriesModule<'area'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'community',
    chartTypes: ['cartesian'],

    identifier: 'area',
    instanceConstructor: AreaSeries,
    stackable: true,
    seriesDefaults: DEFAULT_CARTESIAN_CHART_OVERRIDES,
    themeTemplate: {
        __extends__: EXTENDS_SERIES_DEFAULTS,
        nodeClickRange: 'nearest',
        tooltip: {
            position: {
                type: 'node',
            },
        },
        fillOpacity: 0.8,
        strokeOpacity: 1,
        strokeWidth: 2,
        lineDash: [0],
        lineDashOffset: 0,
        shadow: {
            enabled: false,
            color: DEFAULT_SHADOW_COLOUR,
            xOffset: 3,
            yOffset: 3,
            blur: 5,
        },
        marker: {
            __extends__: EXTENDS_CARTESIAN_MARKER_DEFAULTS,
            enabled: false,
            fillOpacity: 1,
            strokeOpacity: 1,
            strokeWidth: 2,
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
            fill: marker.fill,
            marker,
        };
    },
};
