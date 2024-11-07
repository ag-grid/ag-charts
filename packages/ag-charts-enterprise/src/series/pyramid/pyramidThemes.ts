import { type AgPyramidSeriesThemeableOptions, _ModuleSupport } from 'ag-charts-community';

const { DEFAULT_FONT_FAMILY, DEFAULT_LABEL_COLOUR, DEFAULT_INSIDE_SERIES_LABEL_COLOUR } = _ModuleSupport.ThemeSymbols;

export const PYRAMID_SERIES_THEME: {
    series: AgPyramidSeriesThemeableOptions;
} = {
    series: {
        direction: 'vertical',
        strokeWidth: 0,
        spacing: 2,
        label: {
            enabled: true,
            fontSize: 12,
            fontFamily: DEFAULT_FONT_FAMILY,
            color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
        },
        stageLabel: {
            enabled: true,
            fontSize: 12,
            fontFamily: DEFAULT_FONT_FAMILY,
            color: DEFAULT_LABEL_COLOUR,
            spacing: 12,
        },
    },
};
