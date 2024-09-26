import {
    type AgCategoryAxisThemeOptions,
    type AgConeFunnelSeriesThemeableOptions,
    type AgNumberAxisThemeOptions,
    _Theme,
} from 'ag-charts-community';

export const CONE_FUNNEL_SERIES_THEME: {
    series: AgConeFunnelSeriesThemeableOptions;
    axes: { number: AgNumberAxisThemeOptions; category: AgCategoryAxisThemeOptions };
} = {
    series: {
        direction: 'horizontal' as const,
        strokeWidth: 0,
        label: {
            enabled: true,
            fontSize: 12,
            fontFamily: _Theme.DEFAULT_FONT_FAMILY,
            color: _Theme.DEFAULT_LABEL_COLOUR,
            placement: 'before',
            spacing: 4,
        },
    },
    axes: {
        [_Theme.CARTESIAN_AXIS_TYPE.NUMBER]: {
            gridLine: {
                enabled: false,
            },
            crosshair: {
                enabled: false,
            },
            label: {
                enabled: false,
                formatter(params) {
                    return Math.abs(params.value).toFixed(params.fractionDigits ?? 0);
                },
            },
        },
        [_Theme.CARTESIAN_AXIS_TYPE.CATEGORY]: {
            line: {
                enabled: false,
            },
        },
    },
};
