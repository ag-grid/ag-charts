import {
    type AgCategoryAxisThemeOptions,
    type AgFunnelSeriesThemeableOptions,
    type AgNumberAxisThemeOptions,
    _Theme,
} from 'ag-charts-community';

export const FUNNEL_SERIES_THEME: {
    series: AgFunnelSeriesThemeableOptions;
    axes: { number: AgNumberAxisThemeOptions; category: AgCategoryAxisThemeOptions };
} = {
    series: {
        direction: 'horizontal' as const,
        strokeWidth: 0,
        spacing: 0.3,
        label: {
            enabled: true,
            fontSize: 12,
            fontFamily: _Theme.DEFAULT_FONT_FAMILY,
            color: _Theme.DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
        },
        connector: {
            enabled: true,
            fillOpacity: 0.2,
            strokeWidth: 0,
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
