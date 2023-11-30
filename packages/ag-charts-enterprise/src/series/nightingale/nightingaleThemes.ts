import { _Theme } from 'ag-charts-community';

export const NIGHTINGALE_SERIES_THEME = {
    __extends__: _Theme.EXTENDS_SERIES_DEFAULTS,
    strokeWidth: 0,
    sectorSpacing: 1,
    label: {
        enabled: false,
        fontSize: 12,
        fontFamily: _Theme.DEFAULT_FONT_FAMILY,
        color: _Theme.DEFAULT_LABEL_COLOUR,
        __overrides__: _Theme.OVERRIDE_SERIES_LABEL_DEFAULTS,
    },
};
