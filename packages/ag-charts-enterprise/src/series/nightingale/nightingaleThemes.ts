import { _ModuleSupport } from 'ag-charts-community';
import type { ExtensibleTheme } from 'ag-charts-types';

const {
    ThemeConstants: { POLAR_AXIS_TYPE, POLAR_AXIS_SHAPE },
    FILL_GRADIENT_RADIAL_SERIES_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_DEFAULTS,
} = _ModuleSupport;

export const NIGHTINGALE_SERIES_THEME: ExtensibleTheme<'nightingale'> = {
    series: {
        fill: {
            $applySwitch: [
                { $path: 'type' },
                { $palette: 'fill' },
                ['gradient', FILL_GRADIENT_RADIAL_SERIES_DEFAULTS],
                ['image', FILL_IMAGE_DEFAULTS],
                ['pattern', FILL_PATTERN_DEFAULTS],
            ],
        },
        stroke: {
            $if: [{ $eq: [{ $palette: 'type' }, 'inbuilt'] }, { $ref: 'chartBackgroundColor' }, { $palette: 'stroke' }],
        },
        strokeWidth: 1,
        label: {
            ..._ModuleSupport.LABEL_BOXING_DEFAULTS,
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
