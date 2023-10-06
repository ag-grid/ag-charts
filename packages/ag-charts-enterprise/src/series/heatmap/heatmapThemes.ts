import { _Theme } from 'ag-charts-community';

export const HEATMAP_SERIES_THEME = {
    __extends__: _Theme.EXTENDS_SERIES_DEFAULTS,
    title: undefined,
    xKey: '',
    yKey: '',
    xName: '',
    yName: '',
    labelName: 'Label',
    colorRange: _Theme.DEFAULT_HEATMAP_SERIES_COLOUR_RANGE,
    label: {
        enabled: false,
        fontStyle: undefined,
        fontWeight: undefined,
        fontSize: 12,
        fontFamily: _Theme.DEFAULT_FONT_FAMILY,
        color: _Theme.DEFAULT_LABEL_COLOUR,
        __overrides__: _Theme.OVERRIDE_SERIES_LABEL_DEFAULTS,
    },
};
