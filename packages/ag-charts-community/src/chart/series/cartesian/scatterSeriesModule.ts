import type { SeriesModule } from '../../../util/coreModules';
import {
    DEFAULT_FONT_FAMILY,
    DEFAULT_LABEL_COLOUR,
    EXTENDS_CARTESIAN_MARKER_DEFAULTS,
    EXTENDS_SERIES_DEFAULTS,
} from '../../themes/symbols';
import { singleSeriesPaletteFactory } from '../../mapping/defaults';
import { ScatterSeries } from './scatterSeries';
import { NumberAxis } from '../../axis/numberAxis';

export const ScatterSeriesModule: SeriesModule<'scatter'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'community',
    chartTypes: ['cartesian'],

    identifier: 'scatter',
    instanceConstructor: ScatterSeries,
    seriesDefaults: {
        axes: [
            { type: NumberAxis.type, position: 'bottom' },
            { type: NumberAxis.type, position: 'left' },
        ],
    },
    themeTemplate: {
        __extends__: EXTENDS_SERIES_DEFAULTS,
        tooltip: {
            position: {
                type: 'node',
            },
        },
        marker: {
            __extends__: EXTENDS_CARTESIAN_MARKER_DEFAULTS,
        },
        label: {
            enabled: false,
            fontStyle: undefined,
            fontWeight: undefined,
            fontSize: 12,
            fontFamily: DEFAULT_FONT_FAMILY,
            color: DEFAULT_LABEL_COLOUR,
        },
    },
    paletteFactory: (params) => {
        const { fill, stroke } = singleSeriesPaletteFactory(params);
        return { marker: { fill, stroke } };
    },
};
