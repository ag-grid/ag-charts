import type { _ModuleSupport } from 'ag-charts-community';
import { _Theme } from 'ag-charts-community';

const { CARTESIAN_AXIS_TYPES, CARTESIAN_AXIS_POSITIONS } = _Theme;

export const BOX_PLOT_SERIES_DEFAULTS: _ModuleSupport.SeriesModule<'box-plot'>['seriesDefaults'] = {
    axes: [
        {
            type: CARTESIAN_AXIS_TYPES.CATEGORY,
            position: CARTESIAN_AXIS_POSITIONS.BOTTOM,
            groupPaddingInner: 0.2,
            crosshair: {
                enabled: false,
                snap: false,
            },
        },
        {
            type: CARTESIAN_AXIS_TYPES.NUMBER,
            position: CARTESIAN_AXIS_POSITIONS.LEFT,
            crosshair: {
                snap: false,
            },
        },
    ],
};

export const BOX_PLOT_SERIES_SWAPPED_AXES_DEFAULTS: _ModuleSupport.SeriesModule<'box-plot'>['seriesSwappedAxesDefaults'] =
    {
        zoom: {
            axes: 'y',
            anchorPointX: 'middle',
            anchorPointY: 'end',
        },
    };
