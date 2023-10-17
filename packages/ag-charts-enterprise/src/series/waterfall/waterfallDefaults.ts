import type { _ModuleSupport } from 'ag-charts-community';
import { _Theme } from 'ag-charts-community';

const { CARTESIAN_AXIS_TYPES, CARTESIAN_AXIS_POSITIONS } = _Theme;

export const WATERFALL_DEFAULTS: _ModuleSupport.SeriesModule<'waterfall'>['seriesDefaults'] = {
    axes: [
        {
            type: CARTESIAN_AXIS_TYPES.CATEGORY,
            position: CARTESIAN_AXIS_POSITIONS.LEFT,
        },
        {
            type: CARTESIAN_AXIS_TYPES.NUMBER,
            position: CARTESIAN_AXIS_POSITIONS.BOTTOM,
        },
    ],
    legend: {
        enabled: true,
        item: {
            toggleSeriesVisible: false,
        },
    },
    zoom: {
        axes: 'y',
        anchorPointX: 'middle',
        anchorPointY: 'end',
    },
};

export const WATERFALL_SWAPPED_AXES_DEFAULTS: _ModuleSupport.SeriesModule<'waterfall'>['seriesSwappedAxesDefaults'] = {
    zoom: {
        axes: 'x',
        anchorPointX: 'end',
        anchorPointY: 'middle',
    },
};
