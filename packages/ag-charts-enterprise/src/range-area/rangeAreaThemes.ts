import { type InteractionRange, _Theme } from 'ag-charts-community';

export const RANGE_AREA_SERIES_THEME = {
    __extends__: _Theme.EXTENDS_SERIES_DEFAULTS,
    xKey: '',
    yLowKey: '',
    yHighKey: '',
    fillOpacity: 0.7,
    nodeClickRange: 'nearest' as InteractionRange,
    marker: {
        enabled: false,
        fillOpacity: 1,
    },
    label: {
        enabled: false,
        placement: 'outside',
        padding: 10,
        fontStyle: undefined,
        fontWeight: undefined,
        fontSize: 12,
        fontFamily: _Theme.DEFAULT_FONT_FAMILY,
        color: _Theme.DEFAULT_LABEL_COLOUR,
        __overrides__: _Theme.OVERRIDE_SERIES_LABEL_DEFAULTS,
    },
};
