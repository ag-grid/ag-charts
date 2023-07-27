import { _Theme } from 'ag-charts-community';

export const RANGE_BAR_SERIES_THEME = {
    __extends__: _Theme.EXTENDS_SERIES_DEFAULTS,
    xKey: '',
    yMinKey: '',
    yMaxKey: '',
    xName: '',
    yMinName: '',
    yMaxName: '',
    label: {
        enabled: false,
        fontStyle: undefined,
        fontWeight: undefined,
        fontSize: 12,
        fontFamily: _Theme.DEFAULT_FONT_FAMILY,
        color: 'rgb(70, 70, 70)',
        __overrides__: _Theme.OVERRIDE_SERIES_LABEL_DEFAULTS,
    },
};
