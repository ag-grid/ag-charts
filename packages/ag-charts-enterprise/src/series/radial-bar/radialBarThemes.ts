import { _ModuleSupport } from 'ag-charts-community';

const {
    ThemeConstants: { POLAR_AXIS_TYPE },
} = _ModuleSupport;

export const RADIAL_BAR_SERIES_THEME: _ModuleSupport.SeriesModule<'radial-bar'>['themeTemplate'] = {
    series: {
        fill: { $palette: 'fill' },
        stroke: { $palette: 'stroke' },
        // @ts-expect-error undocumented option
        defaultColorRange: { $palette: 'gradient' },
        strokeWidth: 0,
        label: {
            enabled: false,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'backgroundColor' },
        },
    },
    axes: {
        [POLAR_AXIS_TYPE.RADIUS_CATEGORY]: {
            innerRadiusRatio: 0.2,
            groupPaddingInner: 0.2,
            paddingInner: 0.2,
            paddingOuter: 0.1,
        },
    },
};
