import { _ModuleSupport, _Theme } from 'ag-charts-community';

import { ChordSeries } from './chordSeries';

const { DEFAULT_FONT_FAMILY, DEFAULT_LABEL_COLOUR, EXTENDS_SERIES_DEFAULTS } = _Theme;

export const ChordModule: _ModuleSupport.SeriesModule<'chord'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['flow-proportion'],

    identifier: 'chord',
    instanceConstructor: ChordSeries,

    themeTemplate: {
        series: {
            __extends__: EXTENDS_SERIES_DEFAULTS,
            highlightStyle: {
                series: {
                    dimOpacity: 0.2,
                },
            },
            label: {
                fontFamily: DEFAULT_FONT_FAMILY,
                color: DEFAULT_LABEL_COLOUR,
                spacing: 5,
                maxWidth: 100,
            },
            node: {
                spacing: 8,
                height: 10,
                strokeWidth: 0,
            },
            link: {
                fillOpacity: 0.5,
                strokeWidth: 0,
            },
        },
        legend: {
            enabled: false,
        },
    },
    paletteFactory({ takeColors, colorsCount }) {
        const { fills, strokes } = takeColors(colorsCount);
        return {
            fills,
            strokes,
        };
    },
};
