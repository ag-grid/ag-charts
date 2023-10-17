import type { _ModuleSupport } from 'ag-charts-community';
import { _Theme } from 'ag-charts-community';

const { CARTESIAN_AXIS_TYPES, CARTESIAN_AXIS_POSITIONS } = _Theme;

export const RANGE_BAR_DEFAULTS: _ModuleSupport.SeriesModule<'range-bar'>['seriesDefaults'] = {
    axes: [
        {
            type: CARTESIAN_AXIS_TYPES.CATEGORY,
            position: CARTESIAN_AXIS_POSITIONS.LEFT,
        },
        {
            type: CARTESIAN_AXIS_TYPES.NUMBER,
            position: CARTESIAN_AXIS_POSITIONS.BOTTOM,
            crosshair: {
                enabled: true,
                snap: false,
            },
        },
    ],
    zoom: {
        axes: 'y',
        anchorPointX: 'middle',
        anchorPointY: 'end',
    },
};

export const RANGE_BAR_SWAPPED_AXES_DEFAULTS: _ModuleSupport.SeriesModule<'range-bar'>['seriesSwappedAxesDefaults'] = {
    zoom: {
        axes: 'x',
        anchorPointX: 'end',
        anchorPointY: 'middle',
    },
};
