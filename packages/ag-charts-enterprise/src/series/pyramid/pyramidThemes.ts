import { _ModuleSupport } from 'ag-charts-community';

const { DEFAULT_LABEL_COLOUR, DEFAULT_INSIDE_SERIES_LABEL_COLOUR } = _ModuleSupport.ThemeSymbols;

export const PYRAMID_SERIES_THEME: _ModuleSupport.SeriesModule<'pyramid'>['themeTemplate'] = {
    series: {
        direction: 'vertical',
        strokeWidth: 0,
        spacing: 2,
        label: {
            enabled: true,
            fontSize: { ref: 'fontSize' as const },
            fontFamily: { ref: 'fontFamily' as const },
            color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
        },
        stageLabel: {
            enabled: true,
            fontSize: { ref: 'fontSize' as const },
            fontFamily: { ref: 'fontFamily' as const },
            color: DEFAULT_LABEL_COLOUR,
            spacing: 12,
        },
    },
};
