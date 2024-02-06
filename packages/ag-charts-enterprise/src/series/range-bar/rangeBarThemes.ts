import { _Theme } from 'ag-charts-community';

export const RANGE_BAR_SERIES_THEME = {
    series: {
        __extends__: _Theme.EXTENDS_SERIES_DEFAULTS,
        direction: 'vertical' as const,
        strokeWidth: 0,
        label: {
            enabled: false,
            fontSize: 12,
            fontFamily: _Theme.DEFAULT_FONT_FAMILY,
            color: _Theme.DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
            placement: 'inside' as const,
            __overrides__: _Theme.OVERRIDE_SERIES_LABEL_DEFAULTS,
        },
    },
    axes: {
        [_Theme.CARTESIAN_AXIS_TYPE.NUMBER]: {
            crosshair: {
                enabled: true,
                snap: false,
            },
        },
    },
};
