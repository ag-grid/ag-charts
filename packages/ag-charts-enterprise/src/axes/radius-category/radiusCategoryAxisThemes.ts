import { _Theme } from 'ag-charts-community';

export const RADIUS_CATEGORY_AXIS_THEME = {
    __extends__: _Theme.EXTENDS_AXES_DEFAULTS,
    line: {
        enabled: false,
        __extends__: _Theme.EXTENDS_AXES_LINE_DEFAULTS,
    },
    tick: {
        enabled: false,
        __extends__: _Theme.EXTENDS_AXES_TICK_DEFAULTS,
    },
};
