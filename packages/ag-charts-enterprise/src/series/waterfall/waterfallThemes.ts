import { _ModuleSupport } from 'ag-charts-community';

const itemTheme = {
    strokeWidth: 0,
    label: {
        enabled: false,
        fontStyle: undefined,
        fontWeight: 'normal' as const,
        fontSize: 12,
        fontFamily: _ModuleSupport.ThemeSymbols.DEFAULT_FONT_FAMILY,
        color: _ModuleSupport.ThemeSymbols.DEFAULT_LABEL_COLOUR,
        formatter: undefined,
        placement: 'outside-end' as const,
    },
};

export const WATERFALL_SERIES_THEME = {
    series: {
        item: {
            positive: itemTheme,
            negative: itemTheme,
            total: itemTheme,
        },
        line: {
            stroke: _ModuleSupport.ThemeSymbols.PALETTE_NEUTRAL_STROKE,
            strokeOpacity: 1,
            lineDash: [0],
            lineDashOffset: 0,
            strokeWidth: 2,
        },
    },
    legend: {
        enabled: true,
        toggleSeries: false,
    },
};
