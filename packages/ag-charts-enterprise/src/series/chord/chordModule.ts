import { _ModuleSupport, _Theme } from 'ag-charts-community';

import { ChordSeries } from './chordSeries';

const { DEFAULT_FONT_FAMILY, DEFAULT_LABEL_COLOUR } = _Theme;

export const ChordModule: _ModuleSupport.SeriesModule<'chord'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['flow-proportion'],
    solo: true,

    identifier: 'chord',
    instanceConstructor: ChordSeries,

    themeTemplate: {
        series: {
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
                width: 10,
                strokeWidth: 0,
            },
            link: {
                fillOpacity: 0.5,
                strokeWidth: 0,
                tension: 0.4,
            },
        },
        legend: {
            enabled: false,
            toggleSeries: false,
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
