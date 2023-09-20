import { _Theme, _ModuleSupport } from 'ag-charts-community';

import { HistogramSeries } from './histogramSeries';

const { EXTENDS_SERIES_DEFAULTS, DEFAULT_FONT_FAMILY, DEFAULT_LABEL_COLOUR, DEFAULT_SHADOW_COLOUR } = _Theme;

export const HistogramSeriesModule: _ModuleSupport.SeriesModule<'histogram'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'community',
    chartTypes: ['cartesian'],

    identifier: 'histogram',
    instanceConstructor: HistogramSeries,
    seriesDefaults: {
        axes: [
            { type: 'number', position: 'bottom' },
            { type: 'number', position: 'left' },
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
    paletteFactory: ({ takeColors }) => {
        const {
            fills: [fill],
            strokes: [stroke],
        } = takeColors(1);
        return { fill, stroke };
    },
};
