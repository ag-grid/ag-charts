import { _ModuleSupport } from 'ag-charts-community';

const {
    ThemeConstants: { CARTESIAN_AXIS_TYPE },
    multiSeriesHighlightStyle,
} = _ModuleSupport;

export const BOX_PLOT_SERIES_THEME: _ModuleSupport.SeriesModule<'box-plot'>['themeTemplate'] = {
    series: {
        direction: 'vertical',
        fill: {
            $if: [
                {
                    $or: [
                        { $isGradient: { $palette: 'fill' } },
                        { $isPattern: { $palette: 'fill' } },
                        { $isImage: { $palette: 'fill' } },
                    ],
                },
                { $palette: 'fill' },
                { $mix: [_ModuleSupport.SAFE_FILL_OPERATION, { $ref: 'chartBackgroundColor' }, 0.7] },
            ],
        },
        stroke: { $palette: 'stroke' },
        // @ts-expect-error undocumented option
        fillGradientDefaults: _ModuleSupport.FILL_GRADIENT_LINEAR_DEFAULTS,
        fillPatternDefaults: _ModuleSupport.FILL_PATTERN_DEFAULTS,
        fillImageDefaults: _ModuleSupport.FILL_IMAGE_DEFAULTS,
        strokeWidth: 2,
        highlight: multiSeriesHighlightStyle(),
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
