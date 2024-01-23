import { _Theme } from 'ag-charts-community';

const { POLAR_AXIS_TYPE } = _Theme;

export const RADIAL_BAR_DEFAULTS = {
    axes: [
        {
            type: POLAR_AXIS_TYPE.ANGLE_NUMBER,
        },
        {
            type: POLAR_AXIS_TYPE.RADIUS_CATEGORY,
            innerRadiusRatio: 0.2,
            groupPaddingInner: 0.2,
            paddingInner: 0.2,
            paddingOuter: 0.1,
        },
    ],
};
