import { _Theme } from 'ag-charts-community';

export const AXIS_CROSSHAIR_THEME = {
    crosshair: {
        __extends__: _Theme.EXTENDS_AXES_CROSSHAIR_DEFAULTS,
    },
    category: {
        crosshair: {
            __extends__: _Theme.EXTENDS_AXES_CROSSHAIR_DEFAULTS,
            enabled: false,
        },
    },
};
