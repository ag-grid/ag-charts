import { _Theme } from 'ag-charts-community';

export const RANGE_BAR_SERIES_THEME = {
    __extends__: _Theme.EXTENDS_SERIES_DEFAULTS,
    direction: 'vertical' as const,
    xKey: '',
    yLowKey: '',
    yHighKey: '',
    strokeWidth: 0,
    label: {
        enabled: false,
        fontStyle: undefined,
        fontWeight: undefined,
        fontSize: 12,
        fontFamily: _Theme.DEFAULT_FONT_FAMILY,
        color: _Theme.DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
        formatter: undefined,
        placement: 'inside' as const,
        __overrides__: _Theme.OVERRIDE_SERIES_LABEL_DEFAULTS,
    },
};
