import {
    type AgCategoryAxisThemeOptions,
    type AgConeFunnelSeriesThemeableOptions,
    type AgNumberAxisThemeOptions,
    type AgSeriesAreaOptions,
    _ModuleSupport,
} from 'ag-charts-community';

const {
    ThemeSymbols: { DEFAULT_LABEL_COLOUR, DEFAULT_FONT_FAMILY },
    ThemeConstants: { CARTESIAN_AXIS_TYPE },
} = _ModuleSupport;

export const CONE_FUNNEL_SERIES_THEME: {
    series: AgConeFunnelSeriesThemeableOptions;
    seriesArea: AgSeriesAreaOptions;
    axes: { number: AgNumberAxisThemeOptions; category: AgCategoryAxisThemeOptions };
} = {
    series: {
        direction: 'vertical',
        strokeWidth: 0,
        label: {
            enabled: true,
            fontSize: 12,
            fontFamily: DEFAULT_FONT_FAMILY,
            color: DEFAULT_LABEL_COLOUR,
            placement: 'before',
            spacing: 4,
        },
    },
    seriesArea: {
        padding: {
            top: 20,
            bottom: 20,
        },
    },
    axes: {
        [CARTESIAN_AXIS_TYPE.NUMBER]: {
            nice: false,
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
        [CARTESIAN_AXIS_TYPE.CATEGORY]: {
            line: {
                enabled: false,
            },
        },
    },
};
