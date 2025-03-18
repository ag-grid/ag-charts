import { type AgGradientColor, _ModuleSupport } from 'ag-charts-community';

const { CARTESIAN_AXIS_TYPE } = _ModuleSupport.ThemeConstants;

export const BOX_PLOT_SERIES_THEME: _ModuleSupport.SeriesModule<'box-plot'>['themeTemplate'] = {
    series: {
        direction: 'vertical',
        fill: { $mix: [{ $palette: 'fill' }, { $ref: 'backgroundColor' }, 0.7] },
        stroke: { $palette: 'stroke' },
        // @ts-expect-error undocumented option
        fillGradientDefaults: {
            type: 'gradient',
            gradient: 'linear',
            bounds: 'item',
            colorStops: { $palette: 'gradient' } as any,
            rotation: 0,
            reverse: false,
        } satisfies Required<AgGradientColor>,
        strokeWidth: 2,
    },
    axes: {
        [CARTESIAN_AXIS_TYPE.NUMBER]: {
            crosshair: {
                snap: false,
            },
        },
        [CARTESIAN_AXIS_TYPE.CATEGORY]: {
            groupPaddingInner: 0.2,
            crosshair: {
                enabled: false,
                snap: false,
            },
        },
    },
};
