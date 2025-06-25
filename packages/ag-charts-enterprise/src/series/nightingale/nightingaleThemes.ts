import { _ModuleSupport } from 'ag-charts-community';

const {
    ThemeConstants: { POLAR_AXIS_TYPE, POLAR_AXIS_SHAPE },
} = _ModuleSupport;

export const NIGHTINGALE_SERIES_THEME: _ModuleSupport.SeriesModule<'nightingale'>['themeTemplate'] = {
    series: {
        fill: { $palette: 'fill' },
        stroke: {
            $if: [{ $eq: [{ $palette: 'type' }, 'inbuilt'] }, { $ref: 'chartBackgroundColor' }, { $palette: 'stroke' }],
        },
        // @ts-expect-error undocumented option
        fillGradientDefaults: _ModuleSupport.FILL_GRADIENT_RADIAL_SERIES_DEFAULTS,
        fillPatternDefaults: _ModuleSupport.FILL_PATTERN_DEFAULTS,
        fillImageDefaults: _ModuleSupport.FILL_IMAGE_DEFAULTS,
        strokeWidth: 1,
        label: {
            enabled: false,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'textColor' },
        },
        highlight: _ModuleSupport.multiSeriesHighlightStyle(),
    },
    axes: {
        [POLAR_AXIS_TYPE.ANGLE_CATEGORY]: {
            shape: { $findFirstSiblingNotOperation: POLAR_AXIS_SHAPE.CIRCLE },
            groupPaddingInner: 0,
            paddingInner: 0,
            label: {
                spacing: 10,
            },
        },
        [POLAR_AXIS_TYPE.RADIUS_NUMBER]: {
            shape: { $findFirstSiblingNotOperation: POLAR_AXIS_SHAPE.CIRCLE },
        },
    },
};
