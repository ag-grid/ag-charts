import { _ModuleSupport, _Theme } from 'ag-charts-community';

import { RadialGaugeSeries } from './radialGaugeSeries';

const {
    FONT_WEIGHT,
    DEFAULT_FONT_FAMILY,
    DEFAULT_HIERARCHY_FILLS,
    DEFAULT_LABEL_COLOUR,
    DEFAULT_MUTED_LABEL_COLOUR,
    singleSeriesPaletteFactory,
} = _Theme;

export const RadialGaugeModule: _ModuleSupport.SeriesModule<'radial-gauge'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['gauge'],

    identifier: 'radial-gauge',
    moduleFactory: (ctx) => new RadialGaugeSeries(ctx),
    tooltipDefaults: { range: 'exact' },
    themeTemplate: {
        series: {
            strokeWidth: 0,
            needle: {
                enabled: false,
                fill: DEFAULT_LABEL_COLOUR,
                spacing: 10,
            },
            label: {
                enabled: true,
                fontWeight: FONT_WEIGHT.NORMAL,
                fontSize: 14,
                fontFamily: DEFAULT_FONT_FAMILY,
                color: DEFAULT_LABEL_COLOUR,
            },
            secondaryLabel: {
                enabled: false,
                fontWeight: FONT_WEIGHT.NORMAL,
                fontSize: 12,
                fontFamily: DEFAULT_FONT_FAMILY,
                color: DEFAULT_MUTED_LABEL_COLOUR,
            },
        },
    },
    paletteFactory(params) {
        const { fill, stroke } = singleSeriesPaletteFactory(params);
        const hierarchyFills = params.themeTemplateParameters.get(DEFAULT_HIERARCHY_FILLS);
        return {
            foreground: {
                fill,
                stroke,
            },
            background: {
                fill: hierarchyFills?.[1],
                stroke: hierarchyFills?.[2],
            },
        };
    },
};
