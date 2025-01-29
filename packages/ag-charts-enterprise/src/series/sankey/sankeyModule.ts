import { _ModuleSupport } from 'ag-charts-community';

import { SankeySeries } from './sankeySeries';

export const SankeyModule: _ModuleSupport.SeriesModule<'sankey'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['flow-proportion'],
    solo: true,

    identifier: 'sankey',
    moduleFactory: (ctx) => new SankeySeries(ctx),
    tooltipDefaults: { range: 'exact' },

    themeTemplate: {
        seriesArea: {
            padding: {
                top: 10,
                bottom: 10,
            },
        },
        series: {
            highlightStyle: {
                series: {
                    dimOpacity: 0.2,
                },
            },
            label: {
                fontFamily: { $ref: 'fontFamily' },
                fontSize: { $ref: 'fontSize' },
                fontWeight: { $ref: 'fontWeight' },
                color: { $ref: 'foregroundColor' },
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
            toggleSeries: false,
        },
    },
    paletteFactory({ takeColors, colorsCount }) {
        return takeColors(colorsCount);
    },
};
