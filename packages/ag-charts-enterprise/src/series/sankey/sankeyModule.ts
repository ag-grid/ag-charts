import { type _ModuleSupport, _Theme } from 'ag-charts-community';

import { SankeySeries } from './sankeySeries';

const { DEFAULT_FONT_FAMILY, DEFAULT_LABEL_COLOUR, EXTENDS_SERIES_DEFAULTS } = _Theme;

export const SankeyModule: _ModuleSupport.SeriesModule<'sankey'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['flow-proportion'],
    solo: true,

    identifier: 'sankey',
    instanceConstructor: SankeySeries,

    themeTemplate: {
        seriesArea: {
            padding: {
                top: 10,
                bottom: 10,
            },
        },
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
                fontSize: 12,
                spacing: 10,
            },
            node: {
                spacing: 20,
                width: 10,
                strokeWidth: 0,
            },
            link: {
                fillOpacity: 0.5,
                strokeWidth: 0,
            },
        },
        legend: {
            enabled: false,
            item: {
                toggleSeriesVisible: false,
            },
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
