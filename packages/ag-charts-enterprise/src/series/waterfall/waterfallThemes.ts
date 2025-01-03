import { _ModuleSupport } from 'ag-charts-community';

const itemTheme = {
    strokeWidth: 0,
    label: {
        enabled: false,
        fontStyle: undefined,
        fontWeight: 'normal' as const,
        fontSize: { ref: 'fontSize' as const },
        fontFamily: { ref: 'fontFamily' as const },
        color: { ref: 'foregroundColor' as const },
        formatter: undefined,
        placement: 'outside-end' as const,
    },
};

export const WATERFALL_SERIES_THEME: _ModuleSupport.SeriesModule<'waterfall'>['themeTemplate'] = {
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
