import { _Theme } from 'ag-charts-community';

export const RANGE_BAR_SERIES_THEME = {
    series: {
        direction: 'vertical' as const,
        strokeWidth: 0,
        label: {
            enabled: false,
            fontSize: 12,
            fontFamily: _Theme.DEFAULT_FONT_FAMILY,
            color: _Theme.DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
            placement: 'inside' as const,
        },
    },
    axes: {
        [_Theme.CARTESIAN_AXIS_TYPE.NUMBER]: {
            crosshair: { enabled: true },
        },
    },
};
