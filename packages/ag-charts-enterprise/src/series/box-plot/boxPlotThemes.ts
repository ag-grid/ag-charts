import { type WithThemeParams, _ModuleSupport } from 'ag-charts-community';
import type { InternalAgGradientColor } from 'ag-charts-core';

const { CARTESIAN_AXIS_TYPE } = _ModuleSupport.ThemeConstants;

export const BOX_PLOT_SERIES_THEME: _ModuleSupport.SeriesModule<'box-plot'>['themeTemplate'] = {
    series: {
        direction: 'vertical',
        fill: {
            $if: [
                { $or: [{ $isGradient: [{ $palette: 'fill' }] }, { $isPattern: [{ $palette: 'fill' }] }] },
                { $palette: 'fill' },
                { $mix: [_ModuleSupport.SAFE_FILL_OPERATION, { $ref: 'backgroundColor' }, 0.7] },
            ],
        },
        stroke: { $palette: 'stroke' },
        // @ts-expect-error undocumented option
        fillGradientDefaults: {
            type: 'gradient',
            gradient: 'linear',
            bounds: 'item',
            colorStops: { $palette: 'gradient' },
            rotation: 0,
            reverse: false,
        } satisfies WithThemeParams<Required<InternalAgGradientColor>>,
        fillPatternDefaults: _ModuleSupport.FILL_PATTERN_DEFAULTS,
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
