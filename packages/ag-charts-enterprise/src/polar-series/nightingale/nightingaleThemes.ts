import { _Theme } from 'ag-charts-community';

export const NIGHTINGALE_SERIES_THEME = {
    __extends__: _Theme.EXTENDS_SERIES_DEFAULTS,
    strokeWidth: 1,
    label: {
        enabled: false,
        fontSize: 12,
        fontFamily: _Theme.DEFAULT_FONT_FAMILY,
        color: 'rgb(70, 70, 70)',
        __overrides__: _Theme.OVERRIDE_SERIES_LABEL_DEFAULTS,
    },
};
