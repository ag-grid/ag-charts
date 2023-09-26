import { _Theme } from 'ag-charts-community';
const { ANGLE_CATEGORY, RADIUS_NUMBER, CIRCLE } = _Theme;

export const NIGHTINGALE_DEFAULTS = {
    axes: [
        {
            type: ANGLE_CATEGORY,
            shape: CIRCLE,
            groupPaddingInner: 0,
            paddingInner: 0,
            label: {
                padding: 10,
            },
        },
        {
            type: RADIUS_NUMBER,
            shape: CIRCLE,
        },
    ],
};
