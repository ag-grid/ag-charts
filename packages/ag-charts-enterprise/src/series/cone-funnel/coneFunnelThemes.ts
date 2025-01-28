import { type AgAxisLabelFormatterParams, _ModuleSupport } from 'ag-charts-community';

const {
    ThemeConstants: { CARTESIAN_AXIS_TYPE },
} = _ModuleSupport;

export const CONE_FUNNEL_SERIES_THEME: _ModuleSupport.SeriesModule<'cone-funnel'>['themeTemplate'] = {
    series: {
        direction: 'vertical',
        strokeWidth: 0,
        label: {
            enabled: true,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'foregroundColor' },
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
                formatter(params: AgAxisLabelFormatterParams) {
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
