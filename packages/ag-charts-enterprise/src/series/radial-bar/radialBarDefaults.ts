import { _Theme } from 'ag-charts-community';

const { POLAR_AXIS_TYPES } = _Theme;

export const RADIAL_BAR_DEFAULTS = {
    axes: [
        {
            type: POLAR_AXIS_TYPES.ANGLE_NUMBER,
        },
        {
            type: POLAR_AXIS_TYPES.RADIUS_CATEGORY,
            innerRadiusRatio: 0.2,
            groupPaddingInner: 0.2,
            paddingInner: 0.2,
            paddingOuter: 0.1,
        },
    ],
};
