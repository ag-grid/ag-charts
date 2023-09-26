import { _Theme } from 'ag-charts-community';

export const RADIAL_BAR_SERIES_THEME = {
    __extends__: _Theme.EXTENDS_SERIES_DEFAULTS,
    strokeWidth: 0,
    label: {
        enabled: false,
        fontSize: 12,
        fontFamily: _Theme.DEFAULT_FONT_FAMILY,
        color: _Theme.DEFAULT_INVERTED_LABEL_COLOUR,
        __overrides__: _Theme.OVERRIDE_SERIES_LABEL_DEFAULTS,
    },
};
