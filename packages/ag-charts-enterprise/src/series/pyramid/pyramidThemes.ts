import { type AgPyramidSeriesThemeableOptions, _Theme } from 'ag-charts-community';

export const PYRAMID_SERIES_THEME: {
    series: AgPyramidSeriesThemeableOptions;
} = {
    series: {
        direction: 'vertical',
        strokeWidth: 0,
        label: {
            enabled: true,
            fontSize: 12,
            fontFamily: _Theme.DEFAULT_FONT_FAMILY,
            color: _Theme.DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
        },
        stageLabel: {
            enabled: true,
            fontSize: 12,
            fontFamily: _Theme.DEFAULT_FONT_FAMILY,
            color: _Theme.DEFAULT_LABEL_COLOUR,
        },
    },
};
