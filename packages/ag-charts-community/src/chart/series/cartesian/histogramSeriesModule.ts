import type { SeriesModule } from '../../../util/coreModules';
import { singleSeriesPaletteFactory } from '../../../util/theme';
import {
    DEFAULT_FONT_FAMILY,
    DEFAULT_LABEL_COLOUR,
    DEFAULT_SHADOW_COLOUR,
    EXTENDS_SERIES_DEFAULTS,
} from '../../themes/symbols';
import { HistogramSeries } from './histogramSeries';
import { NumberAxis } from '../../axis/numberAxis';

export const HistogramSeriesModule: SeriesModule<'histogram'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'community',
    chartTypes: ['cartesian'],

    identifier: 'histogram',
    instanceConstructor: HistogramSeries,
    seriesDefaults: {
        axes: [
            { type: NumberAxis.type, position: 'bottom' },
            { type: NumberAxis.type, position: 'left' },
        ],
    },
    themeTemplate: {
        __extends__: EXTENDS_SERIES_DEFAULTS,
        strokeWidth: 1,
        fillOpacity: 0.8,
        strokeOpacity: 1,
        lineDash: [0],
        lineDashOffset: 0,
        label: {
            enabled: false,
            fontStyle: undefined,
            fontWeight: undefined,
            fontSize: 12,
            fontFamily: DEFAULT_FONT_FAMILY,
            color: DEFAULT_LABEL_COLOUR,
            formatter: undefined,
        },
        shadow: {
            enabled: false,
            color: DEFAULT_SHADOW_COLOUR,
            xOffset: 3,
            yOffset: 3,
            blur: 5,
        },
    },
    paletteFactory: singleSeriesPaletteFactory,
};
