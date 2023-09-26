import { _Theme } from 'ag-charts-community';
const { ANGLE_NUMBER, RADIUS_CATEGORY } = _Theme;

export const RADIAL_BAR_DEFAULTS = {
    axes: [
        {
            type: ANGLE_NUMBER,
        },
        {
            type: RADIUS_CATEGORY,
            innerRadiusRatio: 0.2,
            groupPaddingInner: 0.2,
            paddingInner: 0.2,
            paddingOuter: 0.1,
        },
    ],
};
